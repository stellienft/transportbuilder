import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createDroplet, waitForDropletActive, deleteDroplet } from '@/lib/digitalocean'
import { createDnsRecord, deleteDnsRecord } from '@/lib/cloudflare'

// -----------------------------------------------------------------------------
// Stripe client
// -----------------------------------------------------------------------------

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(key)
}

// -----------------------------------------------------------------------------
// Idempotency: track processed events to prevent double-handling
// In production, use Redis or a DB table. Here we use an in-memory set
// with a TTL window (events expire after 1 hour).
// -----------------------------------------------------------------------------

const processedEvents = new Map<string, number>()
const EVENT_TTL_MS = 60 * 60 * 1000 // 1 hour

function isDuplicate(eventId: string): boolean {
  // Prune old entries
  const now = Date.now()
  for (const [id, ts] of processedEvents) {
    if (now - ts > EVENT_TTL_MS) processedEvents.delete(id)
  }
  if (processedEvents.has(eventId)) return true
  processedEvents.set(eventId, now)
  return false
}

// -----------------------------------------------------------------------------
// Retry helper with bounded exponential backoff
// -----------------------------------------------------------------------------

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastErr: Error | null = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastErr
}

// -----------------------------------------------------------------------------
// Failure classifier — infra vs quality
// -----------------------------------------------------------------------------

function classifyError(err: any): 'infra' | 'quality' {
  const msg = (err?.message || '').toLowerCase()
  if (msg.includes('timeout') || msg.includes('econnrefused') || msg.includes('network') || msg.includes('5')) {
    return 'infra'
  }
  return 'quality'
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // ── Idempotency check ────────────────────────────────────────────────────
  if (isDuplicate(event.id)) {
    console.log(`[Stripe Webhook] Duplicate event ${event.id}, skipping`)
    return NextResponse.json({ received: true })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // -------------------------------------------------------------------
      // checkout.session.completed
      // -------------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const metadata = session.metadata ?? {}

        const siteId = metadata.site_id
        const userId = metadata.user_id
        const plan = (metadata.plan ?? 'pro') as 'pro' | 'premium'

        if (!siteId || !userId) {
          console.error('[Stripe Webhook] Missing site_id or user_id in session metadata', { sessionId: session.id })
          break
        }

        // Retrieve subscription to get price and period info
        const stripe = getStripe()
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id ?? null

        // Create or update subscription record (idempotent upsert)
        const { error: subErr } = await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            site_id: siteId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            plan,
            status: 'active',
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: (subscription as any).cancel_at_period_end,
          },
          { onConflict: 'stripe_subscription_id' }
        )
        if (subErr) {
          console.error('[Stripe Webhook] Subscription upsert failed:', subErr.message)
          break
        }

        // Provision DO droplet (only if not already provisioned)
        const { data: site } = await supabase
          .from('sites')
          .select('slug, droplet_id')
          .eq('id', siteId)
          .single()

        if (site && !site.droplet_id) {
          try {
            const droplet = await retryWithBackoff(() => createDroplet(site.slug, siteId, plan))
            const dropletIp = await retryWithBackoff(() => waitForDropletActive(droplet.dropletId))

            // Create Cloudflare DNS record
            const dnsRecord = await retryWithBackoff(() => createDnsRecord(site.slug, dropletIp))

            // Update site with droplet info (atomic)
            const { error: updateErr } = await supabase
              .from('sites')
              .update({
                droplet_id: droplet.dropletId,
                droplet_ip: dropletIp,
                cloudflare_dns_id: dnsRecord.dnsRecordId,
              })
              .eq('id', siteId)
            if (updateErr) {
              console.error('[Stripe Webhook] Site update failed after provision:', updateErr.message)
            }
          } catch (provisionErr: any) {
            const errType = classifyError(provisionErr)
            console.error(`[Stripe Webhook] Droplet provisioning failed (${errType}):`, provisionErr.message)
            // Don't fail the webhook — subscription is active, provision can be retried
          }
        }

        console.log(`[Stripe Webhook] checkout.session.completed — site ${siteId} activated on ${plan} plan`)
        break
      }

      // -------------------------------------------------------------------
      // customer.subscription.updated
      // -------------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id, site_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!existing) {
          console.warn(`[Stripe Webhook] No subscription found for stripe_subscription_id=${subscriptionId}`)
          break
        }

        const priceId = subscription.items.data[0]?.price.id ?? null

        let plan: 'starter' | 'pro' | 'premium' = 'pro'
        const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID
        const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID
        if (PREMIUM_PRICE_ID && priceId === PREMIUM_PRICE_ID) {
          plan = 'premium'
        } else if (PRO_PRICE_ID && priceId === PRO_PRICE_ID) {
          plan = 'pro'
        }

        const status = subscription.status === 'active' ? 'active' :
                       subscription.status === 'trialing' ? 'active' :
                       subscription.status === 'past_due' ? 'past_due' :
                       subscription.status

        const { error: updErr } = await supabase
          .from('subscriptions')
          .update({
            plan,
            status,
            stripe_price_id: priceId,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at_period_end: (subscription as any).cancel_at_period_end,
          })
          .eq('id', existing.id)
        if (updErr) {
          console.error('[Stripe Webhook] Subscription update failed:', updErr.message)
        }

        console.log(`[Stripe Webhook] customer.subscription.updated — site ${existing.site_id} now on ${plan} plan, status=${status}`)
        break
      }

      // -------------------------------------------------------------------
      // customer.subscription.deleted
      // -------------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id, site_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!existing) {
          console.warn(`[Stripe Webhook] No subscription found for stripe_subscription_id=${subscriptionId}`)
          break
        }

        const { error: cancelErr } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            plan: 'starter',
            cancel_at_period_end: false,
          })
          .eq('id', existing.id)
        if (cancelErr) {
          console.error('[Stripe Webhook] Subscription cancel failed:', cancelErr.message)
        }

        // Optionally tear down droplet
        const { data: site } = await supabase
          .from('sites')
          .select('droplet_id')
          .eq('id', existing.site_id)
          .single()

        if (site?.droplet_id) {
          try {
            const { data: siteFull } = await supabase
              .from('sites')
              .select('cloudflare_dns_id')
              .eq('id', existing.site_id)
              .single()

            if (siteFull?.cloudflare_dns_id) {
              await deleteDnsRecord(siteFull.cloudflare_dns_id)
            }

            await deleteDroplet(site.droplet_id)
          } catch (teardownErr: any) {
            const errType = classifyError(teardownErr)
            console.error(`[Stripe Webhook] Teardown failed (${errType}):`, teardownErr.message)
          }

          const { error: siteUpdErr } = await supabase
            .from('sites')
            .update({
              is_published: false,
              droplet_id: null,
              droplet_ip: null,
              cloudflare_dns_id: null,
            })
            .eq('id', existing.site_id)
          if (siteUpdErr) {
            console.error('[Stripe Webhook] Site deprovision update failed:', siteUpdErr.message)
          }
        }

        console.log(`[Stripe Webhook] customer.subscription.deleted — site ${existing.site_id} subscription cancelled`)
        break
      }

      // -------------------------------------------------------------------
      // invoice.payment_failed
      // -------------------------------------------------------------------
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        if (!subscriptionId) {
          console.warn('[Stripe Webhook] invoice.payment_failed — no subscription ID on invoice')
          break
        }

        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id, site_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!existing) {
          console.warn(`[Stripe Webhook] No subscription found for stripe_subscription_id=${subscriptionId}`)
          break
        }

        const { error: pdErr } = await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('id', existing.id)
        if (pdErr) {
          console.error('[Stripe Webhook] Past-due update failed:', pdErr.message)
        }

        console.log(`[Stripe Webhook] invoice.payment_failed — site ${existing.site_id} marked past_due`)
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err: any) {
    const errType = classifyError(err)
    console.error(`[Stripe Webhook] Error processing event (${errType}):`, err)
    // Return 500 only for infra errors so Stripe retries; quality errors are acknowledged
    if (errType === 'infra') {
      return NextResponse.json(
        { error: 'Temporary processing error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}

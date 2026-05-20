import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// -----------------------------------------------------------------------------
// Stripe client
// -----------------------------------------------------------------------------

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// -----------------------------------------------------------------------------
// Price ID lookup — monthly + yearly + setup fees
// -----------------------------------------------------------------------------

const MONTHLY_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
}

const YEARLY_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
  pro: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
}

const SETUP_FEE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_SETUP_FEE_ID,
  pro: process.env.STRIPE_PRO_SETUP_FEE_ID,
  premium: process.env.STRIPE_PREMIUM_SETUP_FEE_ID,
}

// -----------------------------------------------------------------------------
// POST handler — create a Stripe Checkout Session
// Body: { siteId, plan, billing: "monthly" | "yearly" }
// -----------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    // ------------------------------------------------------------------
    // Authenticate user
    // ------------------------------------------------------------------
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ------------------------------------------------------------------
    // Parse request body
    // ------------------------------------------------------------------
    const body = await request.json()
    const { siteId, plan, billing = 'monthly' } = body as {
      siteId?: string
      plan?: string
      billing?: string
    }

    if (!siteId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, plan' },
        { status: 400 }
      )
    }

    const validPlans = ['starter', 'pro', 'premium']
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    const validBilling = ['monthly', 'yearly']
    if (!validBilling.includes(billing)) {
      return NextResponse.json(
        { error: `Invalid billing. Must be: monthly or yearly` },
        { status: 400 }
      )
    }

    // ------------------------------------------------------------------
    // Verify the user owns this site
    // ------------------------------------------------------------------
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, user_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    if (site.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to subscribe for this site' },
        { status: 403 }
      )
    }

    // ------------------------------------------------------------------
    // Resolve price ID based on billing cycle
    // ------------------------------------------------------------------
    const priceLookup = billing === 'yearly' ? YEARLY_PRICE_IDS : MONTHLY_PRICE_IDS
    const priceId = priceLookup[plan]

    if (!priceId) {
      console.error(`[Checkout] No ${billing} price ID configured for plan: ${plan}`)
      return NextResponse.json(
        { error: `Pricing not configured for ${plan} (${billing})` },
        { status: 500 }
      )
    }

    // ------------------------------------------------------------------
    // Check if this is an upgrade — no setup fee on upgrades
    // ------------------------------------------------------------------
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status, plan')
      .eq('site_id', siteId)
      .eq('status', 'active')
      .maybeSingle()

    const isUpgrade = !!existingSub

    // ------------------------------------------------------------------
    // Build line items: subscription + setup fee (new subscriptions only)
    // ------------------------------------------------------------------
    const lineItems: { price: string; quantity: number }[] = [
      {
        price: priceId,
        quantity: 1,
      },
    ]

    const setupFeeId = SETUP_FEE_IDS[plan]
    if (!isUpgrade && setupFeeId) {
      lineItems.push({
        price: setupFeeId,
        quantity: 1,
      })
    }

    // ------------------------------------------------------------------
    // Look up existing stripe_customer_id (if any) for the user
    // ------------------------------------------------------------------
    const { data: existingCustomer } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    const stripe = getStripe()

    // ------------------------------------------------------------------
    // Create Checkout Session
    // ------------------------------------------------------------------
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: 'https://transportbuilder.xyz/dashboard',
      cancel_url: 'https://transportbuilder.xyz/dashboard/billing',
      metadata: {
        site_id: siteId,
        user_id: user.id,
        plan,
        billing,
        is_upgrade: isUpgrade ? 'true' : 'false',
      },
    }

    // Reuse existing Stripe customer if available
    if (existingCustomer?.stripe_customer_id) {
      sessionParams.customer = existingCustomer.stripe_customer_id
    } else {
      sessionParams.customer_email = user.email ?? undefined
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ sessionId: session.id })
  } catch (err: any) {
    console.error('[Checkout API] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}

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
// Price ID lookup
// -----------------------------------------------------------------------------

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
}

// -----------------------------------------------------------------------------
// POST handler — create a Stripe Checkout Session
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
    const { siteId, plan } = body as { siteId?: string; plan?: string }

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
    // Resolve price ID
    // ------------------------------------------------------------------
    const priceId = PRICE_IDS[plan]

    if (!priceId) {
      console.error(`[Checkout] No price ID configured for plan: ${plan}`)
      return NextResponse.json(
        { error: `Pricing not configured for plan: ${plan}` },
        { status: 500 }
      )
    }

    // ------------------------------------------------------------------
    // Look up existing stripe_customer_id (if any) for the user
    // ------------------------------------------------------------------
    const { data: existingSub } = await supabase
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
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'https://transportbuilder.xyz/dashboard',
      cancel_url: 'https://transportbuilder.xyz/dashboard',
      metadata: {
        site_id: siteId,
        user_id: user.id,
        plan,
      },
    }

    // Reuse existing Stripe customer if available
    if (existingSub?.stripe_customer_id) {
      sessionParams.customer = existingSub.stripe_customer_id
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

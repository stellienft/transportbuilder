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
// POST handler — create a Stripe Customer Portal session
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
    // Find the user's stripe_customer_id
    // ------------------------------------------------------------------
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 404 }
      )
    }

    // ------------------------------------------------------------------
    // Create Customer Portal session
    // ------------------------------------------------------------------
    const stripe = getStripe()

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: 'https://transportbuilder.xyz/dashboard/billing',
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (err: any) {
    console.error('[Portal API] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}

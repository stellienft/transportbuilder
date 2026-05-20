import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ExternalLink, ArrowUpRight, Settings } from 'lucide-react'
import type { Subscription, SubscriptionPlan } from '@/lib/types'

// -----------------------------------------------------------------------------
// Plan display config
// -----------------------------------------------------------------------------

const PLAN_INFO: Record<
  SubscriptionPlan,
  { label: string; monthlyPrice: string; yearlyPrice: string; setupFee: string; description: string }
> = {
  starter: {
    label: 'Starter',
    monthlyPrice: '$29/mo',
    yearlyPrice: '$278/yr',
    setupFee: '$49',
    description: 'Basic landing page with standard features',
  },
  pro: {
    label: 'Pro',
    monthlyPrice: '$49/mo',
    yearlyPrice: '$470/yr',
    setupFee: '$99',
    description: 'Custom domain, rate calculator, and analytics',
  },
  premium: {
    label: 'Premium',
    monthlyPrice: '$79/mo',
    yearlyPrice: '$758/yr',
    setupFee: '$199',
    description: 'White-label, advanced integrations, and dedicated support',
  },
}

const PLAN_ORDER: SubscriptionPlan[] = ['starter', 'pro', 'premium']

function getNextPlan(current: SubscriptionPlan): SubscriptionPlan | null {
  const idx = PLAN_ORDER.indexOf(current)
  return idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1] : null
}

// -----------------------------------------------------------------------------
// Status badge color helper
// -----------------------------------------------------------------------------

function statusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default'
    case 'past_due':
      return 'destructive'
    case 'cancelled':
      return 'secondary'
    default:
      return 'outline'
  }
}

// -----------------------------------------------------------------------------
// Format date
// -----------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// -----------------------------------------------------------------------------
// Server Actions
// -----------------------------------------------------------------------------

async function redirectToCheckout(formData: FormData) {
  'use server'

  const siteId = formData.get('siteId') as string
  const plan = formData.get('plan') as string
  const billing = (formData.get('billing') as string) || 'monthly'

  if (!siteId || !plan) {
    redirect('/dashboard/billing')
    return
  }

  const { createClient } = await import('@/lib/supabase/server')
  const Stripe = (await import('stripe')).default

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect('/login'); return }

  // Monthly + yearly price IDs
  const priceMap: Record<string, Record<string, string | undefined>> = {
    monthly: {
      starter: process.env.STRIPE_STARTER_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID,
      premium: process.env.STRIPE_PREMIUM_PRICE_ID,
    },
    yearly: {
      starter: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
      pro: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
      premium: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    },
  }

  // Setup fee price IDs
  const setupFeeMap: Record<string, string | undefined> = {
    starter: process.env.STRIPE_STARTER_SETUP_FEE_ID,
    pro: process.env.STRIPE_PRO_SETUP_FEE_ID,
    premium: process.env.STRIPE_PREMIUM_SETUP_FEE_ID,
  }

  const priceId = priceMap[billing]?.[plan]
  if (!priceId) { redirect('/dashboard/billing'); return }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  // Check if upgrade — no setup fee
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('site_id', siteId)
    .eq('status', 'active')
    .maybeSingle()

  const isUpgrade = !!existingSub

  // Build line items
  const lineItems: Record<string, any>[] = [
    { price: priceId, quantity: 1 },
  ]

  const setupFeeId = setupFeeMap[plan]
  if (!isUpgrade && setupFeeId) {
    lineItems.push({ price: setupFeeId, quantity: 1 })
  }

  // Look up existing customer
  const { data: existingCustomer } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle()

  const params: Record<string, any> = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: 'https://transportbuilder.xyz/dashboard',
    cancel_url: 'https://transportbuilder.xyz/dashboard/billing',
    metadata: { site_id: siteId, user_id: user.id, plan, billing, is_upgrade: isUpgrade ? 'true' : 'false' },
  }

  if (existingCustomer?.stripe_customer_id) {
    params.customer = existingCustomer.stripe_customer_id
  } else {
    params.customer_email = user.email ?? undefined
  }

  const session = await stripe.checkout.sessions.create(params)
  redirect(session.url ?? '/dashboard/billing')
}

async function redirectToPortal() {
  'use server'

  const { createClient } = await import('@/lib/supabase/server')
  const Stripe = (await import('stripe')).default

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { redirect('/login'); return }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!subscription?.stripe_customer_id) {
    redirect('/dashboard/billing')
    return
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: 'https://transportbuilder.xyz/dashboard/billing',
  })

  redirect(portalSession.url)
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default async function BillingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all subscriptions for this user with site info
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*, sites(name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const hasActiveSub = subscriptions?.some(
    (s: Subscription) => s.status === 'active'
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Billing
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your subscriptions and billing details
        </p>
      </div>

      {/* Manage subscription link (portal) */}
      {hasActiveSub && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Manage Subscription
            </CardTitle>
            <CardDescription className="text-gray-500">
              Update payment method, change plans, or cancel your subscription
              through the Stripe billing portal.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <form action={redirectToPortal}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open Billing Portal
              </button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Subscription list */}
      {!subscriptions || subscriptions.length === 0 ? (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-heading font-bold text-gray-900">
                No subscriptions yet
              </h3>
              <p className="text-gray-500 max-w-sm">
                Subscribe to a plan from your site dashboard to get started.
              </p>
            </div>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
                Go to Dashboard
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub: Subscription & { sites?: { name: string; slug: string } | null }) => {
            const plan = sub.plan as SubscriptionPlan
            const info = PLAN_INFO[plan] ?? PLAN_INFO.starter
            const nextPlan = getNextPlan(plan)
            const siteName = (sub as any).sites?.name ?? 'Unknown Site'

            return (
              <Card
                key={sub.id}
                className="bg-white border-gray-200 shadow-sm"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900">
                      {siteName}
                    </CardTitle>
                    <Badge variant={statusVariant(sub.status)}>
                      {sub.status === 'active'
                        ? 'Active'
                        : sub.status === 'past_due'
                          ? 'Past Due'
                          : sub.status === 'cancelled'
                            ? 'Cancelled'
                            : sub.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-500">
                    {info.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Plan</p>
                      <p className="font-medium text-gray-900">
                        {info.label}{' '}
                        <span className="text-gray-500 font-normal">
                          ({info.monthlyPrice})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Next billing date</p>
                      <p className="font-medium text-gray-900">
                        {sub.cancel_at_period_end
                          ? `Cancels ${formatDate(sub.current_period_end)}`
                          : formatDate(sub.current_period_end)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Current period</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(sub.current_period_start)} —{' '}
                        {formatDate(sub.current_period_end)}
                      </p>
                    </div>
                    {sub.cancel_at_period_end && (
                      <div>
                        <p className="text-gray-500">Cancellation</p>
                        <p className="font-medium text-amber-600">
                          Scheduled at period end
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                {(nextPlan && sub.status === 'active') || sub.status === 'active' ? (
                  <CardFooter className="gap-2">
                    {nextPlan && sub.status === 'active' && (
                      <form action={redirectToCheckout}>
                        <input type="hidden" name="siteId" value={sub.site_id} />
                        <input type="hidden" name="plan" value={nextPlan} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          Upgrade to {PLAN_INFO[nextPlan].label}
                        </button>
                      </form>
                    )}
                    <form action={redirectToPortal}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Manage
                      </button>
                    </form>
                  </CardFooter>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}

      {/* Plan comparison */}
      <div>
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">
          Available Plans
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((planKey) => {
            const info = PLAN_INFO[planKey]
            const isCurrentPlan = subscriptions?.some(
              (s: Subscription) => s.plan === planKey && s.status === 'active'
            )
            return (
              <Card
                key={planKey}
                className={`bg-white shadow-sm ${
                  isCurrentPlan
                    ? 'ring-2 ring-gray-900 border-gray-900'
                    : 'border-gray-200'
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-gray-900">
                    {info.label}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    <span className="text-2xl font-bold text-gray-900">
                      {info.monthlyPrice}
                    </span>
                    <span className="text-sm text-gray-400 block mt-0.5">
                      or {info.yearlyPrice} (save 20%)
                    </span>
                    <span className="text-xs text-gray-400 block mt-1">
                      + {info.setupFee} setup fee
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {info.description}
                  </p>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Badge variant="secondary">Current plan</Badge>
                  ) : (
                    <span className="text-sm text-gray-400">
                      Select from site dashboard
                    </span>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

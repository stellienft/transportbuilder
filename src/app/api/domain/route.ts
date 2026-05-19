import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { addCustomHostname, verifyCustomHostname } from '@/lib/cloudflare'

// -----------------------------------------------------------------------------
// GET handler — check custom domain verification status
// -----------------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing required query param: siteId' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // -----------------------------------------------------------------------
    // Look up site
    // -----------------------------------------------------------------------
    const { data: site, error: siteError } = await admin
      .from('sites')
      .select('id, user_id, slug, custom_domain, custom_domain_verified, cloudflare_custom_hostname_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // -----------------------------------------------------------------------
    // Verify the caller owns this site
    // -----------------------------------------------------------------------
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== site.user_id) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this site' },
        { status: 403 }
      )
    }

    if (!site.custom_domain) {
      return NextResponse.json(
        { error: 'No custom domain configured for this site' },
        { status: 400 }
      )
    }

    if (!site.cloudflare_custom_hostname_id) {
      return NextResponse.json({
        domain: site.custom_domain,
        status: 'pending_setup',
        message: 'Custom hostname has not been registered with Cloudflare yet. Use POST to add it.',
      })
    }

    // -----------------------------------------------------------------------
    // Query Cloudflare for the custom hostname verification status
    // -----------------------------------------------------------------------
    const verification = await verifyCustomHostname(site.cloudflare_custom_hostname_id)

    // -----------------------------------------------------------------------
    // If SSL is active, mark the domain as verified in our database
    // -----------------------------------------------------------------------
    if (verification.sslStatus === 'active' && !site.custom_domain_verified) {
      await admin
        .from('sites')
        .update({ custom_domain_verified: true, updated_at: new Date().toISOString() })
        .eq('id', siteId)
    }

    return NextResponse.json({
      domain: verification.hostname,
      sslStatus: verification.sslStatus,
      verified: verification.sslStatus === 'active',
      ownershipVerification: verification.ownershipVerification,
    })
  } catch (err: any) {
    console.error('[Domain API GET] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}

// -----------------------------------------------------------------------------
// POST handler — add a custom domain for a Pro+ site
// -----------------------------------------------------------------------------

interface AddDomainRequest {
  siteId: string
  domain: string
}

export async function POST(request: Request) {
  try {
    const body: AddDomainRequest = await request.json()
    const { siteId, domain } = body

    if (!siteId || !domain) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, domain' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // -----------------------------------------------------------------------
    // Look up site
    // -----------------------------------------------------------------------
    const { data: site, error: siteError } = await admin
      .from('sites')
      .select('id, user_id, slug, custom_domain, custom_domain_verified, cloudflare_custom_hostname_id')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // -----------------------------------------------------------------------
    // Verify the caller owns this site
    // -----------------------------------------------------------------------
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== site.user_id) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this site' },
        { status: 403 }
      )
    }

    // -----------------------------------------------------------------------
    // Verify the subscription is on a Pro or Premium plan
    // -----------------------------------------------------------------------
    const { data: subscription, error: subError } = await admin
      .from('subscriptions')
      .select('id, plan, status')
      .eq('site_id', siteId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No subscription found for this site' },
        { status: 402 }
      )
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: `Subscription is not active (status: ${subscription.status})` },
        { status: 402 }
      )
    }

    if (subscription.plan !== 'pro' && subscription.plan !== 'premium') {
      return NextResponse.json(
        { error: 'Custom domains are only available on Pro and Premium plans' },
        { status: 403 }
      )
    }

    // -----------------------------------------------------------------------
    // Normalize domain — strip protocol, trailing slashes, whitespace
    // -----------------------------------------------------------------------
    const normalizedDomain = domain
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase()

    // -----------------------------------------------------------------------
    // Add the custom hostname via Cloudflare for SaaS
    // -----------------------------------------------------------------------
    const customHostname = await addCustomHostname(normalizedDomain)

    // -----------------------------------------------------------------------
    // Update the site record with the custom domain info
    // -----------------------------------------------------------------------
    const now = new Date().toISOString()

    const { error: updateError } = await admin
      .from('sites')
      .update({
        custom_domain: normalizedDomain,
        custom_domain_verified: false,
        cloudflare_custom_hostname_id: customHostname.customHostnameId,
        updated_at: now,
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('[Domain API] Failed to update site:', updateError)
      return NextResponse.json(
        { error: 'Failed to update site with custom domain' },
        { status: 500 }
      )
    }

    // -----------------------------------------------------------------------
    // Return verification instructions
    // -----------------------------------------------------------------------
    return NextResponse.json({
      success: true,
      domain: normalizedDomain,
      sslStatus: customHostname.sslStatus,
      verificationInstructions: {
        method: 'CNAME',
        record: {
          type: 'CNAME',
          name: normalizedDomain,
          value: `${site.slug}.transitpage.com`,
          ttl: 'Auto',
        },
        alternativeTxtRecord: {
          type: 'TXT',
          name: `_cf-custom-hostname.${normalizedDomain}`,
          value: customHostname.customHostnameId,
        },
        steps: [
          `1. Log in to your DNS provider for ${normalizedDomain}`,
          `2. Add a CNAME record pointing ${normalizedDomain} → ${site.slug}.transitpage.com`,
          `3. Wait for DNS propagation (usually 5-10 minutes, up to 48 hours)`,
          `4. Check verification status via GET /api/domain?siteId=${siteId}`,
        ],
      },
    })
  } catch (err: any) {
    console.error('[Domain API POST] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}

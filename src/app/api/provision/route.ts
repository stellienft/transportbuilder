import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createDroplet, waitForDropletActive } from '@/lib/digitalocean'
import { createDnsRecord, addCustomHostname } from '@/lib/cloudflare'

// -----------------------------------------------------------------------------
// Request type
// -----------------------------------------------------------------------------

interface ProvisionRequest {
  siteId: string
}

// -----------------------------------------------------------------------------
// POST handler — provision a DO droplet + Cloudflare DNS for a site
// -----------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body: ProvisionRequest = await request.json()
    const { siteId } = body

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing required field: siteId' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // -----------------------------------------------------------------------
    // Look up site
    // -----------------------------------------------------------------------
    const { data: site, error: siteError } = await admin
      .from('sites')
      .select('id, user_id, slug, droplet_id, custom_domain, custom_domain_verified')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // -----------------------------------------------------------------------
    // Verify the caller owns this site (via auth session)
    // -----------------------------------------------------------------------
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== site.user_id) {
      return NextResponse.json(
        { error: 'You do not have permission to provision this site' },
        { status: 403 }
      )
    }

    // -----------------------------------------------------------------------
    // Check that an active subscription exists for this site
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

    // -----------------------------------------------------------------------
    // If already provisioned, return the existing URL
    // -----------------------------------------------------------------------
    if (site.droplet_id) {
      const url = `https://${site.slug}.transitpage.com`
      return NextResponse.json({ success: true, url, alreadyProvisioned: true })
    }

    // -----------------------------------------------------------------------
    // Create DO droplet
    // -----------------------------------------------------------------------
    const plan = subscription.plan as 'starter' | 'pro' | 'premium'
    const droplet = await createDroplet(site.slug, siteId, plan)

    // -----------------------------------------------------------------------
    // Wait for droplet to become active and get its IP
    // -----------------------------------------------------------------------
    const dropletIp = await waitForDropletActive(droplet.dropletId)

    // -----------------------------------------------------------------------
    // Create Cloudflare DNS A record pointing to the droplet IP
    // -----------------------------------------------------------------------
    const dnsRecord = await createDnsRecord(site.slug, dropletIp)

    // -----------------------------------------------------------------------
    // Update the site record with infrastructure details
    // -----------------------------------------------------------------------
    const now = new Date().toISOString()

    const updatePayload: Record<string, any> = {
      droplet_id: droplet.dropletId,
      droplet_ip: dropletIp,
      cloudflare_dns_id: dnsRecord.dnsRecordId,
      is_published: true,
      published_at: now,
      updated_at: now,
    }

    // -----------------------------------------------------------------------
    // If Pro+ with custom domain, also add the custom hostname via
    // Cloudflare for SaaS
    // -----------------------------------------------------------------------
    if ((plan === 'pro' || plan === 'premium') && site.custom_domain) {
      try {
        const customHostname = await addCustomHostname(site.custom_domain)
        updatePayload.cloudflare_custom_hostname_id = customHostname.customHostnameId
      } catch (err: any) {
        // Log but don't fail the entire provision — custom hostname can be
        // retried via the /api/domain endpoint
        console.error('[Provision] Failed to add custom hostname (non-fatal):', err.message)
      }
    }

    const { error: updateError } = await admin
      .from('sites')
      .update(updatePayload)
      .eq('id', siteId)

    if (updateError) {
      console.error('[Provision] Failed to update site:', updateError)
      return NextResponse.json(
        { error: 'Failed to update site after provisioning' },
        { status: 500 }
      )
    }

    const url = `https://${site.slug}.transitpage.com`

    return NextResponse.json({
      success: true,
      url,
      dropletId: droplet.dropletId,
      dropletIp,
      dnsRecordId: dnsRecord.dnsRecordId,
    })
  } catch (err: any) {
    console.error('[Provision API] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}

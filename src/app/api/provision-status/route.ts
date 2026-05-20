import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getDroplet } from '@/lib/digitalocean'

// -----------------------------------------------------------------------------
// GET handler — check VPS hosting status for a site
// -----------------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing required param: siteId' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Look up site
    const { data: site, error: siteError } = await admin
      .from('sites')
      .select('id, user_id, slug, droplet_id, droplet_ip')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Verify the caller owns this site
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== site.user_id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this site' },
        { status: 403 }
      )
    }

    // No droplet → not provisioned
    if (!site.droplet_id) {
      return NextResponse.json({ provisioned: false })
    }

    // Look up subscription plan for size info
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('plan, status')
      .eq('site_id', siteId)
      .single()

    const plan = (subscription?.plan ?? 'starter') as 'starter' | 'pro' | 'premium'

    const sizeMap: Record<string, string> = {
      starter: 's-1vcpu-1gb (1 vCPU / 1 GB — $6/mo)',
      pro: 's-1vcpu-1gb (1 vCPU / 1 GB — $6/mo)',
      premium: 's-2vcpu-2gb (2 vCPU / 2 GB — $12/mo)',
    }

    // Check current droplet status from DO
    try {
      const droplet = await getDroplet(site.droplet_id)

      return NextResponse.json({
        provisioned: true,
        status: droplet.status,
        ip: droplet.publicIp || site.droplet_ip,
        plan,
        planLabel: sizeMap[plan] || plan,
        dropletId: site.droplet_id,
        name: droplet.name,
      })
    } catch (err: any) {
      // Droplet was deleted externally or DO API error
      // Clear stale droplet references so the site can be re-provisioned
      await admin
        .from('sites')
        .update({ droplet_id: null, droplet_ip: null, cloudflare_dns_id: null })
        .eq('id', siteId)
      console.warn(`[Provision Status] Droplet ${site.droplet_id} not found in DO, cleared stale refs for site ${siteId}`)
      return NextResponse.json({
        provisioned: false,
        error: 'droplet not found — stale references cleared',
        plan,
        planLabel: sizeMap[plan] || plan,
      })
    }
  } catch (err: any) {
    console.error('[Provision Status API] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    )
  }
}

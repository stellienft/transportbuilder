import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// -----------------------------------------------------------------------------
// Request type
// -----------------------------------------------------------------------------

interface PublishRequest {
  siteId: string
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body: PublishRequest = await request.json()
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
      .select('id, user_id, slug, is_published')
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
        { error: 'You do not have permission to publish this site' },
        { status: 403 }
      )
    }

    // -----------------------------------------------------------------------
    // Generate static HTML (future: render template to HTML string)
    // For now we just mark the site as published in the database.
    // -----------------------------------------------------------------------
    const now = new Date().toISOString()

    const { error: updateError } = await admin
      .from('sites')
      .update({
        is_published: true,
        published_at: now,
        updated_at: now,
      })
      .eq('id', siteId)

    if (updateError) {
      console.error('[Publish] Failed to update site:', updateError)
      return NextResponse.json(
        { error: 'Failed to publish site' },
        { status: 500 }
      )
    }

    const url = `https://${site.slug}.transportbuilder.xyz`

    return NextResponse.json({ success: true, url })
  } catch (err: any) {
    console.error('[Publish API] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

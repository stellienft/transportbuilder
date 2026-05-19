import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// -----------------------------------------------------------------------------
// Request type
// -----------------------------------------------------------------------------

interface ContactRequest {
  siteId: string
  name: string
  email: string
  phone?: string
  message: string
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body: ContactRequest = await request.json()
    const { siteId, name, email, phone, message } = body

    if (!siteId || !name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, name, email, message' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // -----------------------------------------------------------------------
    // Look up site
    // -----------------------------------------------------------------------
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // -----------------------------------------------------------------------
    // Look up contact section for destination email
    // -----------------------------------------------------------------------
    const { data: contactSection } = await supabase
      .from('site_sections')
      .select('content')
      .eq('site_id', siteId)
      .eq('section_key', 'contact')
      .single()

    const destinationEmail = contactSection?.content?.email ?? null

    // -----------------------------------------------------------------------
    // Log submission (ElasticEmail integration coming later)
    // -----------------------------------------------------------------------
    console.log('[Contact] New submission:', {
      siteId,
      name,
      email,
      phone: phone ?? '(not provided)',
      message,
      destinationEmail,
    })

    // -----------------------------------------------------------------------
    // Insert into form_submissions
    // -----------------------------------------------------------------------
    const { error: insertError } = await supabase
      .from('form_submissions')
      .insert({
        site_id: siteId,
        form_type: 'contact',
        data: {
          name,
          email,
          phone: phone ?? null,
          message,
          destination_email: destinationEmail,
        },
      })

    if (insertError) {
      console.error('[Contact] Failed to insert submission:', insertError)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Contact API] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

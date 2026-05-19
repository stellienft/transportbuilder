import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { RateTable, SubscriptionPlan } from '@/lib/types'

// -----------------------------------------------------------------------------
// Request / Response types
// -----------------------------------------------------------------------------

interface CalculatorRequest {
  siteId: string
  origin: string
  destination: string
  vehicle_type?: string | null
}

interface CalculatorResponse {
  distance_km: number
  base_cost: number
  surcharge: number
  total_cost: number
  currency: string
}

// -----------------------------------------------------------------------------
// Mapbox helpers
// -----------------------------------------------------------------------------

async function geocode(query: string, token: string): Promise<{ lng: number; lat: number }> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Geocoding request failed for "${query}" (HTTP ${res.status})`)
  }
  const data = await res.json()
  if (!data.features || data.features.length === 0) {
    throw new Error(`No geocoding results found for "${query}"`)
  }
  const [lng, lat] = data.features[0].center
  return { lng, lat }
}

async function getDistance(
  origin: { lng: number; lat: number },
  destination: { lng: number; lat: number },
  token: string
): Promise<number> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Directions request failed (HTTP ${res.status})`)
  }
  const data = await res.json()
  if (!data.routes || data.routes.length === 0) {
    throw new Error('No driving route found between the given locations')
  }
  // Mapbox returns distance in metres — convert to km
  return data.routes[0].distance / 1000
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body: CalculatorRequest = await request.json()
    const { siteId, origin, destination, vehicle_type } = body

    if (!siteId || !origin || !destination) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, origin, destination' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // -----------------------------------------------------------------------
    // Look up site & subscription plan
    // -----------------------------------------------------------------------
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('site_id', siteId)
      .single()

    const plan: SubscriptionPlan = sub?.plan ?? 'starter'

    if (plan === 'starter') {
      return NextResponse.json(
        { error: 'Rate calculator is not available on the Starter plan. Upgrade to Pro or Premium.' },
        { status: 403 }
      )
    }

    // -----------------------------------------------------------------------
    // Look up rate table
    // -----------------------------------------------------------------------
    const { data: rateTable, error: rtError } = await supabase
      .from('rate_tables')
      .select('*')
      .eq('site_id', siteId)
      .single()

    if (rtError || !rateTable) {
      return NextResponse.json(
        { error: 'Rate table not configured for this site' },
        { status: 404 }
      )
    }

    const rt = rateTable as RateTable

    // -----------------------------------------------------------------------
    // Mapbox — geocode & route
    // -----------------------------------------------------------------------
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      return NextResponse.json(
        { error: 'Mapbox access token not configured on the server' },
        { status: 500 }
      )
    }

    let originCoords: { lng: number; lat: number }
    let destCoords: { lng: number; lat: number }

    try {
      originCoords = await geocode(origin, mapboxToken)
    } catch (err: any) {
      return NextResponse.json(
        { error: `Could not geocode origin: ${err.message}` },
        { status: 422 }
      )
    }

    try {
      destCoords = await geocode(destination, mapboxToken)
    } catch (err: any) {
      return NextResponse.json(
        { error: `Could not geocode destination: ${err.message}` },
        { status: 422 }
      )
    }

    let distanceKm: number
    try {
      distanceKm = await getDistance(originCoords, destCoords, mapboxToken)
    } catch (err: any) {
      return NextResponse.json(
        { error: `Could not calculate route: ${err.message}` },
        { status: 422 }
      )
    }

    // -----------------------------------------------------------------------
    // Calculate cost
    // -----------------------------------------------------------------------
    const baseCost = Math.max(rt.minimum_fee, distanceKm * rt.base_rate_per_km)

    let surcharge = 0
    if (vehicle_type) {
      const match = rt.vehicle_surcharges?.find(
        (v) => v.type.toLowerCase() === vehicle_type.toLowerCase()
      )
      if (match) {
        surcharge = match.surcharge
      }
    }

    const totalCost = baseCost + surcharge

    // -----------------------------------------------------------------------
    // Email notification (log for now — ElasticEmail integration coming later)
    // -----------------------------------------------------------------------
    if (rt.email_template) {
      console.log('[Calculator] Email notification would be sent:', {
        to: rt.email_template,
        subject: rt.email_subject ?? 'New Quote Request',
        origin,
        destination,
        vehicle_type,
        distance_km: distanceKm,
        base_cost: baseCost,
        surcharge,
        total_cost: totalCost,
        currency: rt.currency,
      })
    }

    // -----------------------------------------------------------------------
    // Store submission
    // -----------------------------------------------------------------------
    await supabase.from('form_submissions').insert({
      site_id: siteId,
      form_type: 'calculator',
      data: {
        origin,
        destination,
        vehicle_type: vehicle_type ?? null,
        distance_km: distanceKm,
        base_cost: baseCost,
        surcharge,
        total_cost: totalCost,
        currency: rt.currency,
      },
    })

    // -----------------------------------------------------------------------
    // Return result
    // -----------------------------------------------------------------------
    const response: CalculatorResponse = {
      distance_km: Math.round(distanceKm * 10) / 10,
      base_cost: Math.round(baseCost * 100) / 100,
      surcharge: Math.round(surcharge * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      currency: rt.currency,
    }

    return NextResponse.json(response)
  } catch (err: any) {
    console.error('[Calculator API] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

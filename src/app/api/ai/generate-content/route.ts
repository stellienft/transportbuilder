import { NextResponse } from 'next/server'

// =============================================================================
// AI Content Generation Route
// =============================================================================
// Accepts business details and generates structured section content using an
// OpenAI-compatible LLM. Falls back to template substitution when no API key
// is configured so the feature works offline / in dev.
// =============================================================================

// -----------------------------------------------------------------------------
// Request / Response types
// -----------------------------------------------------------------------------

interface GenerateContentRequest {
  businessName: string
  businessInfo: string
  businessType?: string
  location?: string
  templateSlug: string
}

interface GeneratedContent {
  hero: {
    headline: string
    subheadline: string
    cta_text: string
    images: string[]
  }
  about: {
    heading: string
    body: string
    image_url: string | null
  }
  services: {
    heading: string
    items: Array<{
      name: string
      description: string
      icon: string
    }>
  }
  calculator: {
    heading: string
    description: string
  }
  testimonials: {
    heading: string
    items: Array<{
      name: string
      company: string
      text: string
      rating: number
    }>
  }
  contact: {
    heading: string
    phone: string
    email: string
    address: string
    hours: string
  }
  footer: {
    company_name: string
    tagline: string
    copyright_text: string
  }
}

// -----------------------------------------------------------------------------
// System prompt
// -----------------------------------------------------------------------------

function buildSystemPrompt(input: GenerateContentRequest): string {
  const { businessName, businessInfo, businessType, location } = input

  const locationContext = location
    ? `The business is located in ${location}. Incorporate this location naturally into the content — for example, "${location}'s premier transport service" or "serving ${location} and surrounds".`
    : 'No specific location was provided — use a generic Australian context.'

  const businessTypeContext = businessType
    ? `The business type/speciality is: ${businessType}.`
    : 'No specific business type was provided — assume a general transport and logistics company.'

  return `You are a professional copywriter specialising in Australian transport and logistics websites. Your task is to generate compelling, authentic website content for a business called "${businessName}".

Business info: ${businessInfo}
${businessTypeContext}
${locationContext}

IMPORTANT RULES:
- Use Australian English spelling (e.g. "specialise" not "specialize", "organise" not "organize", "colour" not "color").
- The hero headline must be punchy, action-oriented, and 5-8 words.
- Generate 4-6 services relevant to the business type, specific to transport/logistics (e.g. "Same-Day Delivery", "Interstate Freight", "Warehousing & Distribution", "Heavy Haulage", "Refrigerated Transport").
- Each service icon must be one of: truck, box, clock, shield, globe, warehouse, route, users.
- Generate exactly 3 testimonials with realistic Australian-sounding names and plausible Australian company names.
- The calculator heading should reference rate/distance calculation (e.g. "Instant Freight Calculator", "Rate & Distance Calculator").
- Contact phone must be in Australian format: 0X XXXX XXXX.
- Contact email should follow the pattern info@businessname.com.au (use a simplified, lowercase, no-spaces version of "${businessName}").
- Contact address should be a plausible Australian address${location ? ` in ${location}` : ''}.
- All content should feel authentic and specific, not generic template-speak. Avoid clichés like "your one-stop shop" or "we go above and beyond".
- The about body should be 2-3 paragraphs, written in a confident but down-to-earth Australian business tone.
- Testimonial ratings should all be 5.

Return a single JSON object with EXACTLY this structure (no extra keys, no markdown, just raw JSON):

{
  "hero": {
    "headline": "string (catchy, 5-8 words)",
    "subheadline": "string (1-2 sentences)",
    "cta_text": "string (e.g. 'Get a Free Quote')",
    "images": []
  },
  "about": {
    "heading": "string",
    "body": "string (2-3 paragraphs, use \\n\\n for paragraph breaks)",
    "image_url": null
  },
  "services": {
    "heading": "string",
    "items": [
      { "name": "string", "description": "string (1-2 sentences)", "icon": "one of: truck, box, clock, shield, globe, warehouse, route, users" }
    ]
  },
  "calculator": {
    "heading": "string",
    "description": "string (1 sentence)"
  },
  "testimonials": {
    "heading": "string",
    "items": [
      { "name": "string (Australian-sounding name)", "company": "string (company name)", "text": "string (1-2 sentences)", "rating": 5 }
    ]
  },
  "contact": {
    "heading": "string",
    "phone": "string (Australian format 0X XXXX XXXX)",
    "email": "string",
    "address": "string (Australian address)",
    "hours": "string (e.g. 'Mon-Fri: 7am-6pm, Sat: 8am-12pm')"
  },
  "footer": {
    "company_name": "string",
    "tagline": "string",
    "copyright_text": "string"
  }
}`
}

// -----------------------------------------------------------------------------
// LLM API call
// -----------------------------------------------------------------------------

async function generateWithLLM(input: GenerateContentRequest): Promise<GeneratedContent> {
  const apiKey = process.env.CHUTES_API_KEY!
  const model = 'moonshotai/Kimi-K2.6-TEE'

  const response = await fetch('https://llm.chutes.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(input) },
        {
          role: 'user',
          content: `Generate the full website content for "${input.businessName}". Business info: ${input.businessInfo}${input.businessType ? `. Type: ${input.businessType}` : ''}${input.location ? `. Location: ${input.location}` : ''}. Return the JSON now.`,
        },
      ],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM API returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('LLM API returned empty content')
  }

  // Parse and validate the JSON
  const parsed: GeneratedContent = JSON.parse(content)

  // Basic shape validation — ensure all top-level keys exist
  const requiredKeys = ['hero', 'about', 'services', 'calculator', 'testimonials', 'contact', 'footer']
  for (const key of requiredKeys) {
    if (!(key in parsed)) {
      throw new Error(`LLM response missing required key: ${key}`)
    }
  }

  return parsed
}

// -----------------------------------------------------------------------------
// Fallback template substitution (no API key needed)
// -----------------------------------------------------------------------------

function generateFallback(input: GenerateContentRequest): GeneratedContent {
  const { businessName, businessInfo, businessType, location } = input

  const loc = location || 'Australia'
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const bType = businessType || 'transport and logistics'

  return {
    hero: {
      headline: `${loc}'s Trusted Transport Partner`,
      subheadline: `${businessName} delivers reliable, professional ${bType} services across ${loc} and beyond. Your freight in safe hands.`,
      cta_text: 'Get a Free Quote',
      images: [],
    },
    about: {
      heading: `About ${businessName}`,
      body: `${businessName} is a ${bType} company based in ${loc}, dedicated to providing dependable freight and logistics solutions to businesses of all sizes. With a focus on reliability, safety, and customer service, we've built a reputation as one of the region's most trusted transport partners.\n\nOur team brings decades of combined experience in the transport industry, handling everything from local metro deliveries to complex interstate freight movements. We understand that every shipment matters, and we treat your goods with the same care we'd give our own.\n\nWhether you need regular scheduled runs or one-off urgent deliveries, ${businessName} has the fleet, the expertise, and the commitment to get it done right. ${businessInfo ? businessInfo : ''}`,
      image_url: null,
    },
    services: {
      heading: 'Our Services',
      items: [
        { name: 'Same-Day Delivery', description: `Urgent deliveries across ${loc} metro. Pick up by 8 AM, delivered by 5 PM — guaranteed.`, icon: 'clock' },
        { name: 'Interstate Freight', description: 'Reliable linehaul services connecting major capitals. Overnight departures with next-day arrivals.', icon: 'route' },
        { name: 'Warehousing & Distribution', description: `Strategic warehousing in ${loc} with pick-pack-ship services and real-time inventory visibility.`, icon: 'warehouse' },
        { name: 'Heavy Haulage', description: 'Oversized loads and machinery moved safely with specialist trailers, permits, and pilot vehicles arranged.', icon: 'truck' },
        { name: 'Pallet Freight', description: 'Single or multi-pallet shipments at transparent, per-pallet rates. No hidden surcharges.', icon: 'box' },
      ],
    },
    calculator: {
      heading: 'Instant Freight Calculator',
      description: `Enter your pickup and delivery details to get an estimated freight cost from ${businessName}.`,
    },
    testimonials: {
      heading: 'What Our Clients Say',
      items: [
        { name: 'Mark Thompson', company: `Thompson Supplies, ${loc}`, text: `${businessName} has been our go-to carrier for over two years. Always on time, always professional. Couldn't ask for better service.`, rating: 5 },
        { name: 'Sarah Mitchell', company: 'Outback Trading Co.', text: `We ship across the state weekly and ${businessName} handles it all without a hitch. Great communication and fair pricing.`, rating: 5 },
        { name: 'Dave Chen', company: `Pacific Imports, ${loc}`, text: `Finally a transport company that actually answers the phone and delivers when they say they will. Highly recommend.`, rating: 5 },
      ],
    },
    contact: {
      heading: 'Get in Touch',
      phone: '02 8000 0000',
      email: `info@${slug}.com.au`,
      address: `1 Transport Drive, ${loc} NSW 2000, Australia`,
      hours: 'Mon-Fri: 7am-6pm, Sat: 8am-12pm',
    },
    footer: {
      company_name: businessName,
      tagline: `Professional ${bType} across ${loc}`,
      copyright_text: `© ${new Date().getFullYear()} ${businessName} Pty Ltd. All rights reserved.`,
    },
  }
}

// -----------------------------------------------------------------------------
// POST handler
// -----------------------------------------------------------------------------

export async function POST(request: Request) {
  let body: GenerateContentRequest

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const { businessName, businessInfo, templateSlug } = body

  // Validate required fields
  if (!businessName) {
    return NextResponse.json(
      { error: 'Missing required field: businessName' },
      { status: 400 },
    )
  }
  if (!businessInfo) {
    return NextResponse.json(
      { error: 'Missing required field: businessInfo' },
      { status: 400 },
    )
  }
  if (!templateSlug) {
    return NextResponse.json(
      { error: 'Missing required field: templateSlug' },
      { status: 400 },
    )
  }

  try {
    const apiKey = process.env.CHUTES_API_KEY
    let content: GeneratedContent

    if (apiKey) {
      // Use the LLM to generate content
      content = await generateWithLLM(body)
    } else {
      // Fallback: template substitution
      console.warn('[AI Generate] No CHUTES_API_KEY set — using fallback template substitution')
      content = generateFallback(body)
    }

    return NextResponse.json({ content })
  } catch (err: any) {
    console.error('[AI Generate Content] Error:', err)

    // If LLM fails, fall back to template substitution
    console.warn('[AI Generate] Falling back to template substitution due to error')
    try {
      const fallbackContent = generateFallback(body)
      return NextResponse.json({
        content: fallbackContent,
        warning: 'LLM generation failed; using template fallback',
      })
    } catch (fallbackErr: any) {
      return NextResponse.json(
        { error: 'Failed to generate content', details: err.message },
        { status: 500 },
      )
    }
  }
}

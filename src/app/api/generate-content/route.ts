import { NextResponse } from 'next/server'

// =============================================================================
// AI Content Generation Route — Transport Builder Editor
// =============================================================================
// Accepts a business description and generates structured section content for
// an Australian transport/logistics company website. Uses the Chutes.ai TEE API
// (GLM-5.1-TEE model). Falls back to template substitution when no API key is
// configured so the feature works offline / in dev.
// =============================================================================

// -----------------------------------------------------------------------------
// Request / Response types
// -----------------------------------------------------------------------------

interface GenerateContentRequest {
  description: string
  siteName: string
  templateSlug: string
}

interface HeroContent {
  headline: string
  subheadline: string
  cta_text: string
  cta_link: string
}

interface AboutContent {
  heading: string
  body: string
}

interface ServiceItem {
  icon: string
  title: string
  description: string
}

interface ServicesContent {
  services: ServiceItem[]
}

interface TestimonialItem {
  name: string
  company: string
  text: string
  rating: number
}

interface TestimonialsContent {
  testimonials: TestimonialItem[]
}

interface ContactContent {
  heading: string
  email: string
  phone: string
  address: string
}

interface FooterLink {
  label: string
  url: string
}

interface FooterContent {
  company_name: string
  copyright_text: string
  links: FooterLink[]
}

interface GeneratedContent {
  hero: HeroContent
  about: AboutContent
  services: ServicesContent
  testimonials: TestimonialsContent
  contact: ContactContent
  footer: FooterContent
}

// -----------------------------------------------------------------------------
// System prompt
// -----------------------------------------------------------------------------

function buildSystemPrompt(input: GenerateContentRequest): string {
  const { siteName, description } = input

  return `You are a professional copywriter specialising in Australian transport and logistics websites. Your task is to generate compelling, authentic website content for a business called "${siteName}".

Business description: ${description}

IMPORTANT RULES:
- Use Australian English spelling (e.g. "specialise" not "specialize", "organise" not "organize", "colour" not "color").
- Be professional but approachable — confident and down-to-earth, not corporate jargon.
- The hero headline must be punchy, action-oriented, and 5-8 words.
- The hero CTA text should be "Get a Quote" and the CTA link should be "#contact".
- Generate exactly 6 services relevant to the business, specific to transport/logistics.
- Each service icon must be one of the following, used in this order: truck, box, clock, shield, globe, warehouse.
- Generate exactly 3 testimonials with realistic Australian-sounding names and plausible Australian company names.
- Testimonial ratings must all be 5.
- Contact phone must be an Australian 1300 number (format: 1300 XXX XXX).
- Contact email should use a .com.au domain based on the business name (lowercase, no spaces).
- Contact address should be a plausible Australian address in a major city (Sydney, Melbourne, Brisbane, Perth, Adelaide, etc.).
- The about body should be 2-3 paragraphs, written in a confident but down-to-earth Australian business tone.
- Generate realistic company details — Australian cities, 1300 numbers, .com.au emails.
- Return ONLY valid JSON — no markdown code blocks, no extra commentary.

Return a single JSON object with EXACTLY this structure (no extra keys, no markdown, just raw JSON):

{
  "hero": {
    "headline": "string (catchy, 5-8 words)",
    "subheadline": "string (1-2 sentences)",
    "cta_text": "Get a Quote",
    "cta_link": "#contact"
  },
  "about": {
    "heading": "About Us",
    "body": "string (2-3 paragraphs, use \\n\\n for paragraph breaks)"
  },
  "services": {
    "services": [
      { "icon": "truck", "title": "string", "description": "string (1-2 sentences)" },
      { "icon": "box", "title": "string", "description": "string (1-2 sentences)" },
      { "icon": "clock", "title": "string", "description": "string (1-2 sentences)" },
      { "icon": "shield", "title": "string", "description": "string (1-2 sentences)" },
      { "icon": "globe", "title": "string", "description": "string (1-2 sentences)" },
      { "icon": "warehouse", "title": "string", "description": "string (1-2 sentences)" }
    ]
  },
  "testimonials": {
    "testimonials": [
      { "name": "string (Australian-sounding name)", "company": "string (company name)", "text": "string (1-2 sentences)", "rating": 5 },
      { "name": "string", "company": "string", "text": "string", "rating": 5 },
      { "name": "string", "company": "string", "text": "string", "rating": 5 }
    ]
  },
  "contact": {
    "heading": "Get in Touch",
    "email": "string (.com.au domain)",
    "phone": "string (1300 XXX XXX)",
    "address": "string (Australian address)"
  },
  "footer": {
    "company_name": "string",
    "copyright_text": "string (e.g. © 2024 Company. All rights reserved.)",
    "links": [
      { "label": "Home", "url": "/" },
      { "label": "Services", "url": "#services" },
      { "label": "Contact", "url": "#contact" }
    ]
  }
}`
}

// -----------------------------------------------------------------------------
// LLM API call
// -----------------------------------------------------------------------------

async function generateWithLLM(input: GenerateContentRequest): Promise<GeneratedContent> {
  const apiKey = process.env.CHUTES_API_KEY!
  const model = 'zai-org/GLM-5.1-TEE'

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
          content: `Generate the full website content for "${input.siteName}". Description: ${input.description}. Return the JSON now.`,
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

  // Strip markdown code fences if the model wrapped the output
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  // Parse and validate the JSON
  const parsed: GeneratedContent = JSON.parse(cleaned)

  // Basic shape validation — ensure all top-level keys exist
  const requiredKeys: (keyof GeneratedContent)[] = [
    'hero',
    'about',
    'services',
    'testimonials',
    'contact',
    'footer',
  ]
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
  const { siteName, description } = input

  const slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, '')
  const year = new Date().getFullYear()

  return {
    hero: {
      headline: "Australia's Trusted Transport Partner",
      subheadline: `${siteName} delivers reliable, professional transport and logistics services across Australia and beyond. Your freight in safe hands.`,
      cta_text: 'Get a Quote',
      cta_link: '#contact',
    },
    about: {
      heading: 'About Us',
      body: `${siteName} is a transport and logistics company dedicated to providing dependable freight solutions to businesses of all sizes across Australia. With a focus on reliability, safety, and customer service, we've built a reputation as one of the industry's most trusted partners.\n\nOur team brings decades of combined experience in the transport industry, handling everything from local metro deliveries to complex interstate freight movements. We understand that every shipment matters, and we treat your goods with the same care we'd give our own.\n\nWhether you need regular scheduled runs or one-off urgent deliveries, ${siteName} has the fleet, the expertise, and the commitment to get it done right. ${description ? description : ''}`,
    },
    services: {
      services: [
        {
          icon: 'truck',
          title: 'Freight & Haulage',
          description: `Reliable freight transport across Australia. From single pallets to full loads, ${siteName} moves your goods safely and on time.`,
        },
        {
          icon: 'box',
          title: 'Parcel & Package Delivery',
          description: 'Fast, trackable parcel delivery for businesses of all sizes. Transparent per-parcel pricing with no hidden surcharges.',
        },
        {
          icon: 'clock',
          title: 'Same-Day & Express',
          description: 'Urgent deliveries across metro areas. Pick up by 8 AM, delivered by 5 PM — guaranteed.',
        },
        {
          icon: 'shield',
          title: 'Insured & Secure Transport',
          description: 'Full transit insurance and careful handling for high-value and fragile goods. Peace of mind on every shipment.',
        },
        {
          icon: 'globe',
          title: 'Interstate & National',
          description: 'Connecting major capitals with overnight linehaul services. Next-day arrival on key routes nationwide.',
        },
        {
          icon: 'warehouse',
          title: 'Warehousing & Distribution',
          description: 'Strategic warehousing with pick-pack-ship services and real-time inventory visibility for your supply chain.',
        },
      ],
    },
    testimonials: {
      testimonials: [
        {
          name: 'Mark Thompson',
          company: 'Thompson Supplies, Sydney',
          text: `${siteName} has been our go-to carrier for over two years. Always on time, always professional. Couldn't ask for better service.`,
          rating: 5,
        },
        {
          name: 'Sarah Mitchell',
          company: 'Outback Trading Co.',
          text: `We ship across the state weekly and ${siteName} handles it all without a hitch. Great communication and fair pricing.`,
          rating: 5,
        },
        {
          name: 'Dave Chen',
          company: 'Pacific Imports, Melbourne',
          text: `Finally a transport company that actually answers the phone and delivers when they say they will. Highly recommend.`,
          rating: 5,
        },
      ],
    },
    contact: {
      heading: 'Get in Touch',
      email: `info@${slug}.com.au`,
      phone: '1300 000 000',
      address: `1 Transport Drive, Sydney NSW 2000, Australia`,
    },
    footer: {
      company_name: siteName,
      copyright_text: `© ${year} ${siteName}. All rights reserved.`,
      links: [
        { label: 'Home', url: '/' },
        { label: 'Services', url: '#services' },
        { label: 'Contact', url: '#contact' },
      ],
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

  const { description, siteName, templateSlug } = body

  // Validate required fields
  if (!description) {
    return NextResponse.json(
      { error: 'Missing required field: description' },
      { status: 400 },
    )
  }
  if (!siteName) {
    return NextResponse.json(
      { error: 'Missing required field: siteName' },
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

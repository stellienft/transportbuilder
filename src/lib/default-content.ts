// =============================================================================
// Transport Builder — Default content factory for each template slug
// =============================================================================
// When a user creates a new site, this module provides pre-filled content
// matching the template they chose, so the site looks fully built from day one.
// =============================================================================

import type { SectionKey, SectionContentMap } from "@/lib/types";

// -----------------------------------------------------------------------------
// Per-template colour / font defaults
// -----------------------------------------------------------------------------

export type TemplateDefaults = {
  primary_color: string;
  secondary_color: string;
  font_heading: string;
  font_body: string;
};

const TEMPLATE_DEFAULTS: Record<string, TemplateDefaults> = {
  "haulier-bold": {
    primary_color: "#2563eb",
    secondary_color: "#1e293b",
    font_heading: "Inter",
    font_body: "Inter",
  },
  "express-clean": {
    primary_color: "#0ea5e9",
    secondary_color: "#f8fafc",
    font_heading: "Inter",
    font_body: "Inter",
  },
  "freight-pro": {
    primary_color: "#dc2626",
    secondary_color: "#111827",
    font_heading: "Inter",
    font_body: "Inter",
  },
  "outback-haul": {
    primary_color: "#d97706",
    secondary_color: "#451a03",
    font_heading: "Inter",
    font_body: "Inter",
  },
  "cargo-shipping": {
    primary_color: "#1a3c6e",
    secondary_color: "#0a1f3d",
    font_heading: "Inter",
    font_body: "Inter",
  },
};

// -----------------------------------------------------------------------------
// Unsplash image pool
// -----------------------------------------------------------------------------

const IMG = {
  trucksHighway:
    "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1920&q=80",
  containersPort:
    "https://images.unsplash.com/photo-1494412574643-ff11b0a5eb19?w=1920&q=80",
  warehouseOps:
    "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=1920&q=80",
  truckRoad:
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1920&q=80",
  freightYard:
    "https://images.unsplash.com/photo-1565626424822-c8b4e9127291?w=1920&q=80",
} as const;

// -----------------------------------------------------------------------------
// haulier-bold — Bold, heavy-haul brand
// -----------------------------------------------------------------------------

const HAULIER_BOLD_SERVICES = [
  {
    icon: "truck",
    title: "General Freight",
    description:
      "Full-load and part-load freight across the east coast and beyond. From a single pallet to a full B-double, we deliver with reliability and care.",
  },
  {
    icon: "clock",
    title: "Same-Day Metro",
    description:
      "Time-critical deliveries within Sydney, Melbourne, and Brisbane metro zones. Pick up by 8 AM, delivered by 5 PM — guaranteed.",
  },
  {
    icon: "package",
    title: "Distribution & Warehousing",
    description:
      "Strategic warehousing in Penrith, Dandenong, and Ipswich with pick-pack-ship services and real-time inventory visibility.",
  },
  {
    icon: "shield",
    title: "Heavy Haulage",
    description:
      "Oversized loads, machinery, and construction equipment moved safely with specialist trailers, permits, and pilot vehicles arranged.",
  },
  {
    icon: "globe",
    title: "Interstate Linehaul",
    description:
      "Dedicated linehaul services connecting Sydney, Melbourne, Brisbane, and Adelaide. Overnight departures, next-day arrivals.",
  },
  {
    icon: "truck",
    title: "Fleet Management",
    description:
      "Need a dedicated fleet without the overhead? Our fleet-as-a-service model gives you branded vehicles and drivers on flexible contracts.",
  },
];

const HAULIER_BOLD_TESTIMONIALS = [
  {
    name: "James Mitchell",
    company: "Mitchell & Sons Produce, Griffith NSW",
    text: "We've been using Haulier Bold for over three years now and they've never let us down. Even during the peak harvest season, every delivery arrives on time and in perfect condition.",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    company: "Pacific Import Solutions, Melbourne VIC",
    text: "Their interstate linehaul is second to none. We ship container loads from Melbourne to Brisbane weekly and the tracking and communication is always spot-on. Highly recommend.",
    rating: 5,
  },
  {
    name: "Dave Patterson",
    company: "Patterson Construction, Penrith NSW",
    text: "Moving excavators and oversize gear used to be a nightmare until we found these guys. They handle all the permits and route planning — we just point to where it needs to go.",
    rating: 4,
  },
];

// -----------------------------------------------------------------------------
// express-clean — Clean, minimal, transparent brand
// -----------------------------------------------------------------------------

const EXPRESS_CLEAN_SERVICES = [
  {
    icon: "package",
    title: "Parcel & Satchel Delivery",
    description:
      "Affordable parcel delivery for e-commerce and small business. Flat-rate satchels and tracked parcels with proof of delivery included.",
  },
  {
    icon: "clock",
    title: "Express Freight",
    description:
      "Priority express service with same-day and next-day options across all major metro areas. Real-time tracking from pickup to delivery.",
  },
  {
    icon: "truck",
    title: "Pallet Freight",
    description:
      "Single pallet or multi-pallet shipments at transparent, per-pallet rates. No hidden fuel levies, no surprise surcharges.",
  },
  {
    icon: "globe",
    title: "National Distribution",
    description:
      "Reach every postcode in Australia through our distribution network. Consolidated and direct options to suit your timeline and budget.",
  },
  {
    icon: "shield",
    title: "Fragile & High-Value",
    description:
      "Specialist handling for delicate and high-value goods. Extra padding, careful loading, and full insurance options available.",
  },
  {
    icon: "package",
    title: "3PL Fulfilment",
    description:
      "End-to-end third-party logistics: storage, pick-pack, and dispatch from our Melbourne and Sydney fulfilment centres with API integration.",
  },
];

const EXPRESS_CLEAN_TESTIMONIALS = [
  {
    name: "Emily Tran",
    company: "Urban Botanica, Collingwood VIC",
    text: "Switching to Express Clean for our e-commerce fulfilment was the best decision we made. Our shipping costs dropped 20% and customers get their orders faster than ever.",
    rating: 5,
  },
  {
    name: "Tom Bradley",
    company: "Bradley Office Supplies, Chatswood NSW",
    text: "Finally a freight company with transparent pricing. What they quote is what you pay — no surprise charges at the end of the month. Their tracking is brilliant too.",
    rating: 5,
  },
  {
    name: "Rachel Nguyen",
    company: "Nguyen Ceramics, Fitzroy VIC",
    text: "We ship fragile pottery across Australia and Express Clean handles it beautifully. Their careful packaging service means almost zero breakages. Couldn't ask for more.",
    rating: 4,
  },
];

// -----------------------------------------------------------------------------
// freight-pro — Data-driven, performance-focused brand
// -----------------------------------------------------------------------------

const FREIGHT_PRO_SERVICES = [
  {
    icon: "truck",
    title: "Managed Freight",
    description:
      "Full-service freight management with dedicated account managers. We plan, execute, and optimise every shipment for maximum efficiency and minimum cost.",
  },
  {
    icon: "clock",
    title: "Time-Critical Logistics",
    description:
      "When every minute counts. Our priority dispatch service guarantees pickup within 2 hours and express routing across the national network.",
  },
  {
    icon: "globe",
    title: "Supply Chain Optimisation",
    description:
      "Data-driven supply chain consulting. We analyse your freight patterns, identify savings, and redesign routes to cut costs by up to 25%.",
  },
  {
    icon: "shield",
    title: "Dangerous Goods",
    description:
      "Licensed DG transport for chemicals, fuels, and hazardous materials. Full compliance with ADG Code, trained drivers, and emergency response plans.",
  },
  {
    icon: "package",
    title: "Cross-Docking",
    description:
      "Reduce storage costs with our cross-dock facilities in Brisbane, Sydney, and Perth. Inbound freight sorted and outbound within 4 hours.",
  },
  {
    icon: "truck",
    title: "Refrigerated Transport",
    description:
      "Temperature-controlled freight from -25°C to +25°C with real-time monitoring and HACCP-compliant handling for food and pharmaceuticals.",
  },
];

const FREIGHT_PRO_TESTIMONIALS = [
  {
    name: "Dr. Karen Wu",
    company: "MediPharm Distributors, Brisbane QLD",
    text: "FreightPro's refrigerated service is the only one we trust for our pharmaceutical shipments. Temperature logs are always within spec and their compliance documentation is impeccable.",
    rating: 5,
  },
  {
    name: "Mark Henderson",
    company: "Henderson Chemicals, Tingalpa QLD",
    text: "Finding a carrier licensed for dangerous goods that actually shows up on time is rare. FreightPro does both. Their DG handling is professional and their paperwork is always in order.",
    rating: 5,
  },
  {
    name: "Lisa Park",
    company: "Park Retail Group, Fortitude Valley QLD",
    text: "Their supply chain team saved us over $180K in the first year by re-routing our distribution network. The data they provided was eye-opening. True logistics professionals.",
    rating: 4,
  },
];

// -----------------------------------------------------------------------------
// outback-haul — Remote/regional specialist brand
// -----------------------------------------------------------------------------

const OUTBACK_HAUL_SERVICES = [
  {
    icon: "truck",
    title: "Remote Area Delivery",
    description:
      "Delivering to stations, communities, and mine sites across the Outback. We know the unsealed roads, river crossings, and GPS-blind routes.",
  },
  {
    icon: "shield",
    title: "Mining & Resources",
    description:
      "Heavy equipment and supplies to remote mine sites in WA, NT, and QLD. Oversize permits, road trains, and site-safe certified drivers.",
  },
  {
    icon: "globe",
    title: "Regional Distribution",
    description:
      "Connecting regional towns and communities to the supply chain. Weekly runs to remote centres across inland NSW, QLD, and SA.",
  },
  {
    icon: "package",
    title: "Livestock Transport",
    description:
      "Humane, stress-free livestock transport with experienced drivers and purpose-built trailers. Full compliance with animal welfare standards.",
  },
  {
    icon: "truck",
    title: "Road Train Operations",
    description:
      "Triple and quad road trains for high-volume freight across the Nullarbor and through the Red Centre. Maximum payload, maximum efficiency.",
  },
  {
    icon: "clock",
    title: "Emergency Freight",
    description:
      "Urgent parts, fuel, and supplies to broken-down machinery and remote sites. 24/7 dispatch with GPS tracking to the last kilometre of dirt road.",
  },
];

const OUTBACK_HAUL_TESTIMONIALS = [
  {
    name: "Mike O'Brien",
    company: "Outback Mining Supplies, Kalgoorlie WA",
    text: "Getting freight out to remote WA sites is no easy feat, but Outback Haul handles it without a fuss. Professional drivers, fair pricing, and they actually answer the phone when you call.",
    rating: 5,
  },
  {
    name: "Jenny Wallace",
    company: "Wallace Pastoral Co., Longreach QLD",
    text: "We've tried other carriers for our livestock runs but nobody handles cattle like the Outback Haul team. They understand stock, they know the roads, and they deliver without stress on the animals.",
    rating: 5,
  },
  {
    name: "Roberto Amato",
    company: "Amato Road Services, Alice Springs NT",
    text: "When a grader breaks down 400 km from anywhere, we need parts fast. Outback Haul's emergency service has bailed us out more times than I can count. Absolute legends.",
    rating: 4,
  },
];

// -----------------------------------------------------------------------------
// Template-specific default content — all sections per template
// -----------------------------------------------------------------------------

const CONTENT_MAP: Record<string, Record<SectionKey, SectionContentMap[SectionKey]>> = {
  "haulier-bold": {
    hero: {
      headline: "Moving Australia Forward",
      subheadline:
        "Bold, reliable freight solutions built for the long haul. From metro deliveries to cross-country transport, we keep Australia moving.",
      cta_text: "Get a Free Quote",
      cta_link: "#contact",
      logo_url: "",
      images: [IMG.trucksHighway, IMG.truckRoad, IMG.freightYard],
    },
    stats: {
      stats: [
        { value: "15", suffix: "+", label: "Years Experience" },
        { value: "80", suffix: "+", label: "Fleet Vehicles" },
        { value: "10K", suffix: "+", label: "Deliveries Per Month" },
        { value: "99.2", suffix: "%", label: "On-Time Rate" },
      ],
    },
    about: {
      heading: "Built on Grit. Driven by Reliability.",
      body: "Haulier Bold Transport was founded in 2009 by the Patterson family in Western Sydney with a single truck and a simple promise: deliver on time, every time. Fifteen years on, we operate a fleet of over 80 vehicles spanning the entire east coast and beyond. We're still family-owned, still Australian-run, and still obsessed with getting your freight where it needs to be — no excuses.\n\nOur team of 150+ logistics professionals works around the clock to ensure every shipment is handled with care, tracked in real time, and delivered safely. From a single pallet to a full B-double, we treat every load like it's our own.",
      image_url: IMG.containersPort,
    },
    services: { services: HAULIER_BOLD_SERVICES },
    calculator: {
      heading: "Get an Instant Quote",
      description:
        "Enter your pickup and delivery locations to get an estimated freight cost instantly.",
      show_map: false,
    },
    testimonials: { testimonials: HAULIER_BOLD_TESTIMONIALS },
    contact: {
      heading: "Get in Touch",
      email: "info@haulierbold.com.au",
      phone: "+61 2 8765 4321",
      address: "47 Cooper Street, Penrith NSW 2750, Australia",
      map_embed_url:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3315.5!2d150.7!3d-33.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDQ1JzAwLjAiUyAxNTDCsDQyJzAwLjAiRQ!5e0!3m2!1sen!2sau!4v1234567890",
    },
    footer: {
      company_name: "Haulier Bold Transport",
      copyright_text: "© 2024 Haulier Bold Transport Pty Ltd. ABN 45 678 901 234. All rights reserved.",
      links: [
        { label: "Privacy Policy", url: "/privacy" },
        { label: "Terms of Service", url: "/terms" },
        { label: "Careers", url: "/careers" },
      ],
    },
  },

  "express-clean": {
    hero: {
      headline: "Your Freight, Our Priority",
      subheadline:
        "Streamlined logistics with crystal-clear communication. We make shipping simple so you can focus on growing your business.",
      cta_text: "Request a Quote",
      cta_link: "#contact",
      logo_url: "",
      images: [IMG.containersPort],
    },
    stats: {
      stats: [
        { value: "12", suffix: "+", label: "Years in Business" },
        { value: "55", suffix: "+", label: "Vehicles" },
        { value: "5K", suffix: "+", label: "Parcels Daily" },
        { value: "98.7", suffix: "%", label: "Delivery Success" },
      ],
    },
    about: {
      heading: "Simplicity at Every Step",
      body: "Express Clean Logistics was born from a simple idea: freight shouldn't be complicated. Founded in 2011 in Melbourne, we've grown into one of Australia's most trusted logistics partners by keeping things clear, honest, and efficient.\n\nWith a fleet of 55 modern vehicles and warehouses in Melbourne, Sydney, and Adelaide, we provide end-to-end supply chain solutions that just work. No hidden fees, no vague timelines — just reliable service backed by real people who answer the phone.\n\nWe believe every business deserves a logistics partner that's easy to work with. That's why we've invested in technology that gives you real-time visibility and a team that's always ready to help.",
      image_url: IMG.warehouseOps,
    },
    services: { services: EXPRESS_CLEAN_SERVICES },
    calculator: {
      heading: "Instant Freight Calculator",
      description:
        "Get a transparent, upfront quote for your shipment. No surprises, no hidden charges.",
      show_map: false,
    },
    testimonials: { testimonials: EXPRESS_CLEAN_TESTIMONIALS },
    contact: {
      heading: "Let's Talk",
      email: "hello@expressclean.com.au",
      phone: "+61 3 9876 5432",
      address: "120 Collins Street, Melbourne VIC 3000, Australia",
      map_embed_url:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153!2d144.97!3d-37.82!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ5JzEyLjAiUyAxNjTCsDU4JzEyLjAiRQ!5e0!3m2!1sen!2sau!4v1234567890",
    },
    footer: {
      company_name: "Express Clean Logistics",
      copyright_text: "© 2024 Express Clean Logistics Pty Ltd. ABN 12 345 678 901. All rights reserved.",
      links: [
        { label: "Privacy", url: "/privacy" },
        { label: "Terms", url: "/terms" },
        { label: "Support", url: "/support" },
      ],
    },
  },

  "freight-pro": {
    hero: {
      headline: "Precision Logistics. Proven Results.",
      subheadline:
        "Data-driven freight management with 99.2% on-time delivery. When performance matters, the pros choose FreightPro.",
      cta_text: "Start Shipping",
      cta_link: "#contact",
      logo_url: "",
      images: [IMG.warehouseOps, IMG.trucksHighway],
    },
    stats: {
      stats: [
        { value: "200", suffix: "+", label: "Team Members" },
        { value: "120", suffix: "+", label: "Fleet Vehicles" },
        { value: "10K", suffix: "+", label: "Monthly Deliveries" },
        { value: "99.2", suffix: "%", label: "On-Time Delivery" },
      ],
    },
    about: {
      heading: "Performance You Can Measure",
      body: "FreightPro Australia was established in 2007 with a mission to bring corporate-grade logistics to businesses of every size. Headquartered in Brisbane with operations nationwide, we combine cutting-edge technology with decades of industry expertise to deliver results that speak for themselves.\n\nOur proprietary tracking platform gives clients real-time visibility across their entire supply chain. Every kilometre, every delivery, every metric — tracked, analysed, and optimised.\n\nWith a team of 200+ and a fleet of 120 vehicles, we handle over 10,000 deliveries per month. But we never forget that behind every number is a customer who's counting on us.",
      image_url: IMG.freightYard,
    },
    services: { services: FREIGHT_PRO_SERVICES },
    calculator: {
      heading: "Calculate Your Freight Cost",
      description:
        "Enter your shipment details for a precise, competitive quote powered by our rate engine.",
      show_map: false,
    },
    testimonials: { testimonials: FREIGHT_PRO_TESTIMONIALS },
    contact: {
      heading: "Contact Our Team",
      email: "ops@freightpro.com.au",
      phone: "+61 7 3344 5566",
      address: "800 Ipswich Road, Moorooka QLD 4105, Australia",
      map_embed_url:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3568!2d153.01!3d-27.55!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDMzJzAwLjAiUyAxNjPCsDAwJzM2LjAiRQ!5e0!3m2!1sen!2sau!4v1234567890",
    },
    footer: {
      company_name: "FreightPro Australia",
      copyright_text: "© 2024 FreightPro Australia Pty Ltd. ABN 78 901 234 567. All rights reserved.",
      links: [
        { label: "Privacy Policy", url: "/privacy" },
        { label: "Terms & Conditions", url: "/terms" },
        { label: "Track Shipment", url: "/track" },
      ],
    },
  },

  "outback-haul": {
    hero: {
      headline: "Hauling Across the Outback",
      subheadline:
        "From the red dust to the city streets — we know every road in this country. Aussie-owned, outback-tested.",
      cta_text: "Get a Quote",
      cta_link: "#contact",
      logo_url: "",
      images: [IMG.truckRoad, IMG.freightYard],
    },
    stats: {
      stats: [
        { value: "18", suffix: "+", label: "Years on the Road" },
        { value: "3", label: "Regional Depots" },
        { value: "2M", suffix: "+", label: "KMs Covered Annually" },
        { value: "24/7", label: "Emergency Dispatch" },
      ],
    },
    about: {
      heading: "Born in the Dust. Built to Last.",
      body: "Outback Haul started in 2006 when Jack and Di Thompson loaded their first load of fencing supplies onto a flatbed in Broken Hill and drove 800 kilometres to a station north of Coober Pedy. That spirit of grit and determination hasn't changed.\n\nToday, we're one of the few logistics companies that genuinely specialises in remote and regional Australia. Our drivers know the unsealed roads, the river crossings, and the stations that don't appear on GPS. We deliver to places other carriers won't go.\n\nWith depots in Broken Hill, Alice Springs, and Port Augusta, and a fleet built for the tough stuff, Outback Haul is your trusted partner for freight anywhere in Australia — from the deep outback to the capital cities.",
      image_url: IMG.truckRoad,
    },
    services: { services: OUTBACK_HAUL_SERVICES },
    calculator: {
      heading: "Outback Quote Calculator",
      description:
        "Get an estimate for your haul — even to the most remote locations across Australia.",
      show_map: false,
    },
    testimonials: { testimonials: OUTBACK_HAUL_TESTIMONIALS },
    contact: {
      heading: "Drop Us a Line",
      email: "jack@outbackhaul.com.au",
      phone: "+61 8 8088 7766",
      address: "23 Argent Street, Broken Hill NSW 2880, Australia",
      map_embed_url:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3150!2d141.47!3d-31.96!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDU3JzM2LjAiUyAxNDFCsDI4JzEyLjAiRQ!5e0!3m2!1sen!2sau!4v1234567890",
    },
    footer: {
      company_name: "Outback Haul",
      copyright_text: "© 2024 Outback Haul Pty Ltd. ABN 56 789 012 345. All rights reserved.",
      links: [
        { label: "Privacy", url: "/privacy" },
        { label: "Terms", url: "/terms" },
        { label: "Our Routes", url: "/routes" },
      ],
    },
  },

  "cargo-shipping": {
    hero: {
      headline: "Get your free quote today",
      subheadline:
        "Professional cargo and shipping solutions with global reach and local expertise.",
      cta_text: "Learn More",
      cta_link: "#contact",
      logo_url: "",
      images: [IMG.trucksHighway, IMG.containersPort, IMG.warehouseOps],
    },
    stats: {
      stats: [
        { value: "11", suffix: "+", label: "Years Working Experience" },
        { value: "80", suffix: "K", label: "Clients & Partners" },
        { value: "2.7", prefix: "$", suffix: "B", label: "E-commerce Orders" },
        { value: "99.2", suffix: "%", label: "On-Time Delivery" },
      ],
    },
    about: {
      heading: "We give you the full range global logistics solution",
      body: "At our company, we are more than just a logistics provider — we are the architects of seamless supply chains, the navigators of global trade, and the enablers of business growth. With a passion for innovation and a commitment to excellence, we deliver solutions that move your business forward.\n\nFrom land freight to ocean cargo, air express to warehousing, we provide end-to-end logistics services tailored to your needs. Our experienced team ensures every shipment arrives safely, on time, and within budget.",
      image_url: IMG.freightYard,
    },
    services: {
      services: [
        {
          icon: "truck",
          title: "Land Freight Transportation",
          description:
            "Reliable road freight services covering every corner of the country. From full truckloads to part-load consolidation.",
        },
        {
          icon: "globe",
          title: "Air Freight Transportation",
          description:
            "Express air cargo for time-critical shipments. Priority handling with real-time tracking from origin to destination.",
        },
        {
          icon: "anchor",
          title: "Ocean Freight Transportation",
          description:
            "Cost-effective sea freight for bulk and containerised cargo. FCL and LCL options across all major trade routes.",
        },
        {
          icon: "warehouse",
          title: "Warehousing & Distribution",
          description:
            "Strategic warehousing with pick-pack-ship services, inventory management, and cross-dock distribution.",
        },
      ],
    },
    calculator: {
      heading: "Instant Shipping Calculator",
      description:
        "Enter your pickup and delivery locations for an estimated freight cost.",
      show_map: false,
    },
    testimonials: { testimonials: HAULIER_BOLD_TESTIMONIALS },
    contact: {
      heading: "Get In Touch",
      email: "info@cargoshipping.com.au",
      phone: "+61 2 9000 1234",
      address: "1 Harbour Street, Sydney NSW 2000, Australia",
      map_embed_url:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3312!2d151.2!3d-33.87!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDUyJzEyLjAiUyAxNTHCsDEyJzAwLjAiRQ!5e0!3m2!1sen!2sau!4v1234567890",
    },
    footer: {
      company_name: "Cargo Shipping Co.",
      copyright_text:
        "© 2024 Cargo Shipping Co. Pty Ltd. All rights reserved.",
      links: [
        { label: "Privacy Policy", url: "/privacy" },
        { label: "Terms of Service", url: "/terms" },
        { label: "Track Shipment", url: "/track" },
      ],
    },
  },
};

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Returns all pre-filled section content for a given template slug.
 * Falls back to the "haulier-bold" template content if the slug is unknown.
 */
export function getDefaultContent(
  templateSlug: string
): Record<SectionKey, SectionContentMap[SectionKey]> {
  return CONTENT_MAP[templateSlug] ?? CONTENT_MAP["haulier-bold"];
}

/**
 * Returns the colour/font defaults for a given template slug.
 * Falls back to haulier-bold if the slug is unknown.
 */
export function getTemplateConfigDefaults(
  templateSlug: string
): TemplateDefaults {
  return TEMPLATE_DEFAULTS[templateSlug] ?? TEMPLATE_DEFAULTS["haulier-bold"];
}

// =============================================================================
// Transport Builder Core Types — matching Supabase schema
// =============================================================================

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

// -----------------------------------------------------------------------------
// Template
// -----------------------------------------------------------------------------

export type Template = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  preview_url: string | null;
  sections: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

// -----------------------------------------------------------------------------
// Site & SiteConfig
// -----------------------------------------------------------------------------

export type SiteConfig = {
  primary_color: string;
  secondary_color: string;
  font_heading: string;
  font_body: string;
  favicon_url: string | null;
  site_title: string;
  meta_description: string | null;
  og_image_url: string | null;
};

export type Site = {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  droplet_id: string | null;
  droplet_ip: string | null;
  cloudflare_dns_id: string | null;
  cloudflare_custom_hostname_id: string | null;
  is_published: boolean;
  published_at: string | null;
  config: SiteConfig;
  created_at: string;
  updated_at: string;
};

// -----------------------------------------------------------------------------
// Section key union
// -----------------------------------------------------------------------------

export type SectionKey =
  | 'hero'
  | 'stats'
  | 'about'
  | 'services'
  | 'calculator'
  | 'testimonials'
  | 'contact'
  | 'footer';

// -----------------------------------------------------------------------------
// Section content types
// -----------------------------------------------------------------------------

export type HeroContent = {
  headline: string;
  subheadline: string | null;
  cta_text: string | null;
  cta_link: string | null;
  logo_url: string | null;
  images: string[];
};

export type AboutContent = {
  heading: string;
  body: string;
  image_url: string | null;
};

export type StatItem = {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
};

export type StatsContent = {
  stats: StatItem[];
};

export type ServiceItem = {
  icon: string;
  title: string;
  description: string;
};

export type ServicesContent = {
  services: ServiceItem[];
};

export type CalculatorContent = {
  heading: string;
  description: string | null;
  show_map: boolean;
  // Note: rate data lives in RateTable
};

export type TestimonialItem = {
  name: string;
  company: string;
  text: string;
  rating: number;
};

export type TestimonialsContent = {
  testimonials: TestimonialItem[];
};

export type ContactContent = {
  heading: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  map_embed_url: string | null;
};

export type FooterContent = {
  company_name: string;
  copyright_text: string;
  links: { label: string; url: string }[];
};

// -----------------------------------------------------------------------------
// Section content map
// -----------------------------------------------------------------------------

export type SectionContentMap = {
  hero: HeroContent;
  stats: StatsContent;
  about: AboutContent;
  services: ServicesContent;
  calculator: CalculatorContent;
  testimonials: TestimonialsContent;
  contact: ContactContent;
  footer: FooterContent;
};

// -----------------------------------------------------------------------------
// SiteSection
// -----------------------------------------------------------------------------

export type SiteSection = {
  id: string;
  site_id: string;
  section_key: SectionKey;
  is_enabled: boolean;
  sort_order: number;
  content: SectionContentMap[SectionKey];
  created_at: string;
  updated_at: string;
};

// -----------------------------------------------------------------------------
// RateTable & related
// -----------------------------------------------------------------------------

export type VehicleSurcharge = {
  type: string;
  surcharge: number;
};

export type ZoneMultiplier = {
  zone: string;
  multiplier: number;
};

export type RateTable = {
  id: string;
  site_id: string;
  base_rate_per_km: number;
  minimum_fee: number;
  currency: string;
  vehicle_surcharges: VehicleSurcharge[];
  zone_multipliers: ZoneMultiplier[];
  email_template: string | null;
  email_subject: string | null;
  created_at: string;
  updated_at: string;
};

// -----------------------------------------------------------------------------
// Subscription
// -----------------------------------------------------------------------------

export type SubscriptionPlan = 'starter' | 'pro' | 'premium';

export type Subscription = {
  id: string;
  user_id: string;
  site_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: SubscriptionPlan;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

// -----------------------------------------------------------------------------
// SiteIntegration
// -----------------------------------------------------------------------------

export type SiteIntegration = {
  id: string;
  site_id: string;
  ga4_id: string | null;
  google_place_id: string | null;
  mapbox_api_key: string | null;
  created_at: string;
  updated_at: string;
};

// -----------------------------------------------------------------------------
// FormSubmission
// -----------------------------------------------------------------------------

export type FormSubmission = {
  id: string;
  site_id: string;
  form_type: 'contact' | 'calculator';
  data: Record<string, any>;
  created_at: string;
};

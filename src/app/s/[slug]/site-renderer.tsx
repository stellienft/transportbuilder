'use client'

import type { Site, SiteSection, RateTable, SiteIntegration, SubscriptionPlan } from '@/lib/types'
import HaulierBold from '@/components/templates/haulier-bold'
import ExpressClean from '@/components/templates/express-clean'
import FreightPro from '@/components/templates/freight-pro'
import OutbackHaul from '@/components/templates/outback-haul'
import CargoShipping from '@/components/templates/cargo-shipping'

export interface SiteRendererState {
  site: Site
  sections: SiteSection[]
  rateTable: RateTable | null
  integration: SiteIntegration | null
  plan: SubscriptionPlan
  templateSlug?: string
}

const defaultSections = {
  hero: { is_enabled: false, content: { headline: '', subheadline: '', cta_text: '', cta_link: '', logo_url: '', images: [] } },
  stats: { is_enabled: false, content: { stats: [] } },
  about: { is_enabled: false, content: { heading: '', body: '', image_url: '' } },
  services: { is_enabled: false, content: { services: [] } },
  calculator: { is_enabled: false, content: { heading: '', description: '', show_map: false } },
  testimonials: { is_enabled: false, content: { testimonials: [] } },
  contact: { is_enabled: false, content: { heading: '', email: '', phone: '', address: '', map_embed_url: '' } },
  footer: { is_enabled: false, content: { company_name: '', copyright_text: '', links: [] } },
}

function buildSectionsMap(sections: SiteSection[]) {
  const result = { ...defaultSections }
  for (const section of sections) {
    const key = section.section_key as keyof typeof result
    if (key in result) {
      result[key] = {
        is_enabled: section.is_enabled,
        content: section.content as any,
      }
    }
  }
  return result
}

export default function SiteRenderer({ initialState }: { initialState: SiteRendererState }) {
  const site = initialState.site
  const config = site.config ?? ({} as any)
  const sectionsMap = buildSectionsMap(initialState.sections)

  const commonProps = {
    siteName: site.name,
    config: {
      primary_color: config.primary_color ?? '#2563eb',
      secondary_color: config.secondary_color ?? '#1e293b',
      font_heading: config.font_heading ?? 'Inter',
      font_body: config.font_body ?? 'Inter',
      site_title: config.site_title ?? site.name,
      meta_description: config.meta_description ?? '',
      og_image_url: config.og_image_url ?? '',
      favicon_url: config.favicon_url ?? '',
    },
    sections: sectionsMap,
    rateTable: initialState.rateTable
      ? {
          base_rate_per_km: initialState.rateTable.base_rate_per_km,
          minimum_fee: initialState.rateTable.minimum_fee,
          currency: initialState.rateTable.currency,
          vehicle_surcharges: initialState.rateTable.vehicle_surcharges,
        }
      : undefined,
    integrations: initialState.integration
      ? {
          ga4_id: initialState.integration.ga4_id ?? '',
          google_place_id: initialState.integration.google_place_id ?? '',
        }
      : undefined,
    plan: initialState.plan,
  }

  switch (initialState.templateSlug ?? 'haulier-bold') {
    case 'express-clean':
      return <ExpressClean {...commonProps} />
    case 'freight-pro':
      return <FreightPro {...commonProps} />
    case 'outback-haul':
      return <OutbackHaul {...commonProps} />
    case 'cargo-shipping':
      return <CargoShipping {...commonProps} />
    default:
      return <HaulierBold {...commonProps} />
  }
}

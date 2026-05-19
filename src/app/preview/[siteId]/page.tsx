import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Site,
  SiteSection,
  RateTable,
  SiteIntegration,
  SubscriptionPlan,
} from '@/lib/types'
import HaulierBold from '@/components/templates/haulier-bold'
import PreviewListener from './preview-listener'

// =============================================================================
// Data fetching
// =============================================================================

async function getSiteData(siteId: string) {
  const supabase = createAdminClient()

  // Fetch site
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .single()

  if (siteError || !site) return null

  // Fetch sections ordered by sort_order
  const { data: sections } = await supabase
    .from('site_sections')
    .select('*')
    .eq('site_id', siteId)
    .order('sort_order', { ascending: true })

  // Fetch rate table
  const { data: rateTable } = await supabase
    .from('rate_tables')
    .select('*')
    .eq('site_id', siteId)
    .single()

  // Fetch integrations
  const { data: integration } = await supabase
    .from('site_integrations')
    .select('*')
    .eq('site_id', siteId)
    .single()

  // Fetch subscription plan
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('site_id', siteId)
    .single()

  return {
    site: site as Site,
    sections: (sections ?? []) as SiteSection[],
    rateTable: (rateTable as RateTable) ?? null,
    integration: (integration as SiteIntegration) ?? null,
    plan: (sub?.plan as SubscriptionPlan) ?? 'starter',
  }
}

// =============================================================================
// Transform sections array → object keyed by section_key
// =============================================================================

function buildSectionsMap(sections: SiteSection[]) {
  const defaultSections = {
    hero: { is_enabled: false, content: { headline: '', subheadline: '', cta_text: '', cta_link: '', logo_url: '', images: [] } },
    about: { is_enabled: false, content: { heading: '', body: '', image_url: '' } },
    services: { is_enabled: false, content: { services: [] } },
    calculator: { is_enabled: false, content: { heading: '', description: '', show_map: false } },
    testimonials: { is_enabled: false, content: { testimonials: [] } },
    contact: { is_enabled: false, content: { heading: '', email: '', phone: '', address: '', map_embed_url: '' } },
    footer: { is_enabled: false, content: { company_name: '', copyright_text: '', links: [] } },
  }

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

// =============================================================================
// Page component (Server Component)
// =============================================================================

export default async function PreviewPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  const data = await getSiteData(siteId)

  if (!data) {
    notFound()
  }

  const { site, sections, rateTable, integration, plan } = data
  const sectionsMap = buildSectionsMap(sections)

  const initialState = {
    site,
    sections,
    rateTable,
    integration,
    plan,
  }

  return (
    <PreviewListener initialState={initialState}>
      {(state) => {
        const currentSections = buildSectionsMap(state.sections)
        return (
          <HaulierBold
            siteName={state.site?.name ?? site.name}
            config={{
              primary_color: state.site?.config?.primary_color ?? site.config.primary_color,
              secondary_color: state.site?.config?.secondary_color ?? site.config.secondary_color,
              font_heading: state.site?.config?.font_heading ?? site.config.font_heading,
              font_body: state.site?.config?.font_body ?? site.config.font_body,
              site_title: state.site?.config?.site_title ?? site.config.site_title,
              meta_description: state.site?.config?.meta_description ?? site.config.meta_description ?? '',
              og_image_url: state.site?.config?.og_image_url ?? site.config.og_image_url ?? '',
              favicon_url: state.site?.config?.favicon_url ?? site.config.favicon_url ?? '',
            }}
            sections={currentSections}
            rateTable={
              state.rateTable
                ? {
                    base_rate_per_km: state.rateTable.base_rate_per_km,
                    minimum_fee: state.rateTable.minimum_fee,
                    currency: state.rateTable.currency,
                    vehicle_surcharges: state.rateTable.vehicle_surcharges,
                  }
                : undefined
            }
            integrations={
              state.integration
                ? {
                    ga4_id: state.integration.ga4_id ?? '',
                    google_place_id: state.integration.google_place_id ?? '',
                  }
                : undefined
            }
            plan={state.plan}
          />
        )
      }}
    </PreviewListener>
  )
}

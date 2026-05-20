import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Site,
  SiteSection,
  RateTable,
  SiteIntegration,
  SubscriptionPlan,
} from '@/lib/types'
import SiteRenderer from './site-renderer'

async function getPublishedSite(slug: string) {
  const supabase = createAdminClient()

  // Look up site by slug
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .single()

  if (siteError || !site) return null
  if (!site.is_published) return null

  // Get template slug
  const { data: template } = await supabase
    .from('templates')
    .select('slug')
    .eq('id', site.template_id)
    .single()

  const { data: sections } = await supabase
    .from('site_sections')
    .select('*')
    .eq('site_id', site.id)
    .order('sort_order', { ascending: true })

  const { data: rateTable } = await supabase
    .from('rate_tables')
    .select('*')
    .eq('site_id', site.id)
    .single()

  const { data: integration } = await supabase
    .from('site_integrations')
    .select('*')
    .eq('site_id', site.id)
    .single()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('site_id', site.id)
    .single()

  return {
    site: site as Site,
    sections: (sections ?? []) as SiteSection[],
    rateTable: (rateTable as RateTable) ?? null,
    integration: (integration as SiteIntegration) ?? null,
    plan: (sub?.plan as SubscriptionPlan) ?? 'starter',
    templateSlug: template?.slug ?? 'haulier-bold',
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getPublishedSite(slug)
  if (!data) return { title: 'Site Not Found' }

  const config = data.site.config ?? ({} as any)
  return {
    title: config.site_title ?? data.site.name,
    description: config.meta_description ?? '',
    openGraph: {
      title: config.site_title ?? data.site.name,
      description: config.meta_description ?? '',
      images: config.og_image_url ? [config.og_image_url] : [],
    },
  }
}

export default async function PublishedSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getPublishedSite(slug)

  if (!data) {
    notFound()
  }

  return <SiteRenderer initialState={data} />
}

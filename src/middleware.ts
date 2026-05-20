import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const APP_DOMAIN = 'transportbuilder.xyz'
const APP_HOSTNAMES = [
  APP_DOMAIN,
  `www.${APP_DOMAIN}`,
  'localhost',
  'phpstack-1019214-6428381.cloudwaysapps.com',
]

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Extract the bare hostname (strip port)
  const bareHost = hostname.split(':')[0]

  // Check if this is a subdomain request (e.g. test-4.transportbuilder.xyz)
  const isSubdomain = bareHost.endsWith(`.${APP_DOMAIN}`) && !APP_HOSTNAMES.includes(bareHost)

  if (isSubdomain) {
    // Extract subdomain slug (e.g. "test-4" from "test-4.transportbuilder.xyz")
    const slug = bareHost.replace(`.${APP_DOMAIN}`, '')

    // Rewrite to /s/[slug] so Next.js serves the published site
    url.pathname = `/s/${slug}${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Check for custom domain — look up in Supabase
  if (!APP_HOSTNAMES.includes(bareHost) && !bareHost.endsWith('.cloudwaysapps.com')) {
    // This might be a custom domain. Use a lightweight Supabase REST call to check.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      try {
        const lookupUrl = `${supabaseUrl}/rest/v1/sites?custom_domain=eq.${encodeURIComponent(bareHost)}&select=slug,is_published&limit=1`
        const res = await fetch(lookupUrl, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        })
        const sites = await res.json()

        if (Array.isArray(sites) && sites.length > 0 && sites[0].is_published) {
          const slug = sites[0].slug
          url.pathname = `/s/${slug}${url.pathname === '/' ? '' : url.pathname}`
          return NextResponse.rewrite(url)
        }
      } catch {
        // Lookup failed — fall through to normal app flow
      }
    }
  }

  // Default: normal app flow with auth
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

'use client'

import { useEffect, useState } from 'react'
import type { Site, SiteSection, RateTable, SiteIntegration, SubscriptionPlan } from '@/lib/types'

/**
 * Client component that listens for postMessage events from the editor
 * and re-renders the template with updated data.
 */

export interface PreviewState {
  site: Site | null
  sections: SiteSection[]
  rateTable: RateTable | null
  integration: SiteIntegration | null
  plan: SubscriptionPlan
}

interface PreviewListenerProps {
  initialState: PreviewState
  children: (state: PreviewState) => React.ReactNode
}

export default function PreviewListener({ initialState, children }: PreviewListenerProps) {
  const [state, setState] = useState<PreviewState>(initialState)

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== 'transitpage-update') return

      const { site, sections, rateTable, integration } = event.data

      setState((prev) => ({
        site: site ?? prev.site,
        sections: sections ?? prev.sections,
        rateTable: rateTable ?? prev.rateTable,
        integration: integration ?? prev.integration,
        plan: prev.plan, // plan doesn't change via postMessage
      }))
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return <>{children(state)}</>
}

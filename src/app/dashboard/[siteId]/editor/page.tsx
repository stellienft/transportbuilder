"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UnsplashPicker } from "@/components/unsplash-picker";
import {
  Loader2,
  Eye,
  Upload,
  Globe,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Sparkles,
  Lock,
  ExternalLink,
  Save,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Link2,
  Server,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type {
  Site,
  SiteConfig,
  SiteSection,
  SectionKey,
  SectionContentMap,
  RateTable,
  SiteIntegration,
  SubscriptionPlan,
  HeroContent,
  AboutContent,
  StatsContent,
  StatItem,
  ServicesContent,
  CalculatorContent,
  TestimonialsContent,
  ContactContent,
  FooterContent,
  ServiceItem,
  TestimonialItem,
  VehicleSurcharge,
  ZoneMultiplier,
} from "@/lib/types";

// =============================================================================
// Helpers
// =============================================================================

async function uploadFile(
  siteId: string,
  file: File
): Promise<string | null> {
  const formData = new FormData();
  formData.append("siteId", siteId);
  formData.append("file", file);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      console.error("Upload error:", err.error || err);
      return null;
    }
    const { url } = await res.json();
    return url;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
}

// =============================================================================
// Types for local state
// =============================================================================

type EditorState = {
  site: Site | null;
  sections: SiteSection[];
  rateTable: RateTable | null;
  integration: SiteIntegration | null;
  plan: SubscriptionPlan;
  loading: boolean;
  saving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  viewMode: "desktop" | "tablet" | "mobile";
};

// =============================================================================
// Collapsible Section Component
// =============================================================================

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-heading font-bold text-gray-900 hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          {title}
          {badge && (
            <Badge variant="secondary" className="text-[10px]">
              {badge}
            </Badge>
          )}
        </span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// =============================================================================
// Field helpers
// =============================================================================

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs text-gray-400 uppercase tracking-wide">
      {children}
    </Label>
  );
}

function FieldInput({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border-gray-300 text-gray-900 text-sm h-8"
      {...props}
    />
  );
}

function FieldTextarea({
  value,
  onChange,
  ...props
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.ComponentProps<"textarea">, "value" | "onChange">) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border-gray-300 text-gray-900 text-sm"
      {...props}
    />
  );
}

// =============================================================================
// Editor Page
// =============================================================================

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params.siteId as string;

  const [state, setState] = useState<EditorState>({
    site: null,
    sections: [],
    rateTable: null,
    integration: null,
    plan: "starter",
    loading: true,
    saving: false,
    lastSaved: null,
    saveError: null,
    viewMode: "desktop" as "desktop" | "tablet" | "mobile",
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // -------------------------------------------------------------------------
  // Custom domain state
  // -------------------------------------------------------------------------
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [customDomainLoading, setCustomDomainLoading] = useState(false);
  const [customDomainError, setCustomDomainError] = useState<string | null>(null);
  const [customDomainVerifyResult, setCustomDomainVerifyResult] = useState<{
    domain: string;
    sslStatus: string;
    verified: boolean;
    ownershipVerification: { type: string; value: string; method: string } | null;
  } | null>(null);
  const [customDomainInstructions, setCustomDomainInstructions] = useState<{
    cnameRecord: { type: string; name: string; value: string; ttl: string };
    txtRecord: { type: string; name: string; value: string };
  } | null>(null);

  // Connect custom domain via POST /api/domain
  const handleConnectDomain = async () => {
    if (!customDomainInput.trim()) return;
    setCustomDomainLoading(true);
    setCustomDomainError(null);
    try {
      const res = await fetch("/api/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, domain: customDomainInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCustomDomainError(data.error || data.details || "Failed to connect domain");
        return;
      }
      // Update site state with the new custom domain
      setState((s) => {
        if (!s.site) return s;
        return {
          ...s,
          site: {
            ...s.site,
            custom_domain: data.domain,
            custom_domain_verified: false,
            cloudflare_custom_hostname_id: data.customHostnameId,
          },
        };
      });
      // Store DNS instructions for display
      if (data.verificationInstructions) {
        setCustomDomainInstructions({
          cnameRecord: data.verificationInstructions.cnameRecord,
          txtRecord: data.verificationInstructions.txtRecord,
        });
      }
      setCustomDomainInput("");
    } catch (err: any) {
      setCustomDomainError(err.message || "Failed to connect domain");
    } finally {
      setCustomDomainLoading(false);
    }
  };

  // Verify custom domain via GET /api/domain
  const handleVerifyDomain = async () => {
    setCustomDomainLoading(true);
    setCustomDomainError(null);
    try {
      const res = await fetch(`/api/domain?siteId=${siteId}`);
      const data = await res.json();
      if (!res.ok) {
        setCustomDomainError(data.error || "Verification failed");
        return;
      }
      setCustomDomainVerifyResult(data);
      // Update site state if verified
      if (data.verified) {
        setState((s) => {
          if (!s.site) return s;
          return {
            ...s,
            site: { ...s.site, custom_domain_verified: true },
          };
        });
      }
      // Also update DNS instructions from ownership verification
      if (data.ownershipVerification) {
        setCustomDomainInstructions((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            txtRecord: {
              type: "TXT",
              name: `_cf-custom-hostname.${data.domain}`,
              value: data.ownershipVerification.value,
            },
          };
        });
      }
    } catch (err: any) {
      setCustomDomainError(err.message || "Verification failed");
    } finally {
      setCustomDomainLoading(false);
    }
  };

  // Remove custom domain via DELETE /api/domain
  const handleRemoveDomain = async () => {
    if (!confirm("Remove this custom domain? Your site will only be accessible via the subdomain.")) return;
    setCustomDomainLoading(true);
    setCustomDomainError(null);
    try {
      const res = await fetch("/api/domain", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCustomDomainError(data.error || "Failed to remove domain");
        return;
      }
      setState((s) => {
        if (!s.site) return s;
        return {
          ...s,
          site: {
            ...s.site,
            custom_domain: null,
            custom_domain_verified: false,
            cloudflare_custom_hostname_id: null,
          },
        };
      });
      setCustomDomainInstructions(null);
      setCustomDomainVerifyResult(null);
    } catch (err: any) {
      setCustomDomainError(err.message || "Failed to remove domain");
    } finally {
      setCustomDomainLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Hosting / VPS state
  // -------------------------------------------------------------------------

  const [hostingStatus, setHostingStatus] = useState<{
    provisioned: boolean;
    status?: string;
    ip?: string;
    plan?: string;
    planLabel?: string;
    dropletId?: string;
    name?: string;
    error?: string;
  } | null>(null);
  const [hostingLoading, setHostingLoading] = useState(false);
  const [hostingError, setHostingError] = useState<string | null>(null);

  // Fetch hosting status
  const fetchHostingStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/provision-status?siteId=${siteId}`);
      const data = await res.json();
      if (res.ok) {
        setHostingStatus(data);
        setHostingError(null);
      } else {
        setHostingError(data.error || 'Failed to check hosting status');
      }
    } catch {
      setHostingError('Failed to check hosting status');
    }
  }, [siteId]);

  // Fetch hosting status on mount
  useEffect(() => {
    if (!state.loading && state.site) {
      fetchHostingStatus();
    }
  }, [state.loading, state.site, fetchHostingStatus]);

  // Provision VPS
  const handleProvisionVps = async () => {
    setHostingLoading(true);
    setHostingError(null);
    try {
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostingError(data.error || data.details || 'Provisioning failed');
        return;
      }
      // Refresh hosting status
      await fetchHostingStatus();
    } catch (err: any) {
      setHostingError(err.message || 'Provisioning failed');
    } finally {
      setHostingLoading(false);
    }
  };

  // Deprovision VPS
  const handleDeprovisionVps = async () => {
    if (!confirm('Are you sure you want to deprovision your VPS? Your site will revert to shared hosting and the dedicated server will be deleted.')) return;
    setHostingLoading(true);
    setHostingError(null);
    try {
      const res = await fetch('/api/provision', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostingError(data.error || data.details || 'Deprovisioning failed');
        return;
      }
      setHostingStatus({ provisioned: false });
      // Also update site state to reflect unpublished
      setState((s) => {
        if (!s.site) return s;
        return {
          ...s,
          site: {
            ...s.site,
            is_published: false,
            droplet_id: null,
            droplet_ip: null,
            cloudflare_dns_id: null,
            cloudflare_custom_hostname_id: null,
          },
        };
      });
    } catch (err: any) {
      setHostingError(err.message || 'Deprovisioning failed');
    } finally {
      setHostingLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Auth check — verify user owns this site
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch site
      const { data: site } = await supabase
        .from("sites")
        .select("*")
        .eq("id", siteId)
        .single();

      // Ownership check
      if (site && site.user_id !== user.id) {
        router.push("/dashboard");
        return;
      }

      // Fetch sections
      const { data: sections } = await supabase
        .from("site_sections")
        .select("*")
        .eq("site_id", siteId)
        .order("sort_order", { ascending: true });

      // Fetch rate table
      const { data: rateTable } = await supabase
        .from("rate_tables")
        .select("*")
        .eq("site_id", siteId)
        .single();

      // Fetch integrations
      const { data: integration } = await supabase
        .from("site_integrations")
        .select("*")
        .eq("site_id", siteId)
        .single();

      // Fetch subscription plan
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("site_id", siteId)
        .single();

      setState({
        site: site as Site | null,
        sections: (sections as SiteSection[]) ?? [],
        rateTable: (rateTable as RateTable) ?? null,
        integration: (integration as SiteIntegration) ?? null,
        plan: (sub?.plan as SubscriptionPlan) ?? "starter",
        loading: false,
        saving: false,
        lastSaved: null,
        saveError: null,
        viewMode: "desktop",
      });
    }
    load();
  }, [siteId]);

  // -------------------------------------------------------------------------
  // Auto-save (1s debounce)
  // -------------------------------------------------------------------------

  const save = useCallback(async () => {
    if (!state.site) return;
    setState((s) => ({ ...s, saving: true, saveError: null }));
    const supabase = createClient();
    const errors: string[] = [];

    // Save site config
    const { error: siteErr } = await supabase
      .from("sites")
      .update({
        name: state.site.name,
        config: state.site.config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);
    if (siteErr) errors.push(`Site: ${siteErr.message}`);

    // Save sections
    for (const section of state.sections) {
      const { error: secErr } = await supabase
        .from("site_sections")
        .update({
          is_enabled: section.is_enabled,
          sort_order: section.sort_order,
          content: section.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id);
      if (secErr) errors.push(`Section ${section.section_key}: ${secErr.message}`);
    }

    // Upsert rate table (create if missing)
    if (state.rateTable) {
      const { error: rtErr } = await supabase
        .from("rate_tables")
        .update({
          base_rate_per_km: state.rateTable.base_rate_per_km,
          minimum_fee: state.rateTable.minimum_fee,
          currency: state.rateTable.currency,
          vehicle_surcharges: state.rateTable.vehicle_surcharges,
          zone_multipliers: state.rateTable.zone_multipliers,
          email_template: state.rateTable.email_template,
          email_subject: state.rateTable.email_subject,
          updated_at: new Date().toISOString(),
        })
        .eq("id", state.rateTable.id);
      if (rtErr) errors.push(`Rate table: ${rtErr.message}`);
    } else if (isProOrAbove) {
      const { data: newRateTable } = await supabase
        .from("rate_tables")
        .insert({
          site_id: siteId,
          base_rate_per_km: 2.5,
          minimum_fee: 150,
          currency: "AUD",
          vehicle_surcharges: [
            { type: "Light Truck", surcharge: 0 },
            { type: "Heavy Truck", surcharge: 50 },
            { type: "B-Double", surcharge: 100 },
          ],
          zone_multipliers: [
            { zone: "Metro", multiplier: 1 },
            { zone: "Regional", multiplier: 1.3 },
            { zone: "Remote", multiplier: 1.8 },
          ],
          email_subject: "Your Freight Quote from {{company}}",
          email_template: "Hi {{name}},\n\nBased on your shipment from {{origin}} to {{destination}} ({{distance}} km), your estimated freight cost is {{price}}.\n\nThank you for choosing {{company}}.",
        })
        .select()
        .single();
      if (newRateTable) {
        setState((s) => ({ ...s, rateTable: newRateTable as RateTable }));
      }
    }

    // Upsert integrations (create if missing)
    if (state.integration) {
      await supabase
        .from("site_integrations")
        .update({
          ga4_id: state.integration.ga4_id,
          google_place_id: state.integration.google_place_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", state.integration.id);
    } else {
      const { data: newIntegration } = await supabase
        .from("site_integrations")
        .insert({
          site_id: siteId,
          ga4_id: null,
          google_place_id: null,
        })
        .select()
        .single();
      if (newIntegration) {
        setState((s) => ({ ...s, integration: newIntegration as SiteIntegration }));
      }
    }

    setState((s) => ({ ...s, saving: false, lastSaved: new Date(), saveError: errors.length > 0 ? errors.join('; ') : null }));
  }, [state.site, state.sections, state.rateTable, state.integration, siteId]);

  // Debounced save trigger
  useEffect(() => {
    if (state.loading) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      save();
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.site, state.sections, state.rateTable, state.integration]);

  // -------------------------------------------------------------------------
  // PostMessage to preview iframe
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!iframeRef.current || !state.site) return;
    const payload = {
      type: "transitpage-update",
      site: state.site,
      sections: state.sections,
      rateTable: state.rateTable,
      integration: state.integration,
    };
    iframeRef.current.contentWindow?.postMessage(payload, window.location.origin);
  }, [state.site, state.sections, state.rateTable, state.integration]);

  // -------------------------------------------------------------------------
  // Helpers for updating state
  // -------------------------------------------------------------------------

  const updateSiteConfig = (partial: Partial<SiteConfig>) => {
    setState((s) => {
      if (!s.site) return s;
      return {
        ...s,
        site: { ...s.site, config: { ...s.site.config, ...partial } },
      };
    });
  };

  const updateSiteName = (name: string) => {
    setState((s) => {
      if (!s.site) return s;
      return { ...s, site: { ...s.site, name } };
    });
  };

  const updateSection = (
    sectionKey: SectionKey,
    content: SectionContentMap[SectionKey]
  ) => {
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec.section_key === sectionKey ? { ...sec, content } : sec
      ),
    }));
  };

  const toggleSection = (sectionKey: SectionKey) => {
    setState((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec.section_key === sectionKey
          ? { ...sec, is_enabled: !sec.is_enabled }
          : sec
      ),
    }));
  };

  const moveSection = (sectionKey: SectionKey, direction: "up" | "down") => {
    setState((s) => {
      const idx = s.sections.findIndex((sec) => sec.section_key === sectionKey);
      if (idx === -1) return s;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= s.sections.length) return s;
      const newSections = [...s.sections];
      [newSections[idx], newSections[swapIdx]] = [
        newSections[swapIdx],
        newSections[idx],
      ];
      // Update sort_order
      return {
        ...s,
        sections: newSections.map((sec, i) => ({
          ...sec,
          sort_order: i,
        })),
      };
    });
  };

  const updateRateTable = (partial: Partial<RateTable>) => {
    setState((s) => {
      if (!s.rateTable) return s;
      return { ...s, rateTable: { ...s.rateTable, ...partial } };
    });
  };

  const updateIntegration = (partial: Partial<SiteIntegration>) => {
    setState((s) => {
      if (!s.integration) return s;
      return { ...s, integration: { ...s.integration, ...partial } };
    });
  };

  // -------------------------------------------------------------------------
  // File upload handler
  // -------------------------------------------------------------------------

  const handleFileUpload = async (
    file: File,
    onUrl: (url: string) => void
  ) => {
    const url = await uploadFile(siteId, file);
    if (url) onUrl(url);
  };

  // -------------------------------------------------------------------------
  // AI Content Generation
  // -------------------------------------------------------------------------

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLocation, setAiLocation] = useState("");

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: aiInput,
          siteName: state.site?.name || "",
          templateSlug: "haulier-bold",
        }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const result = await res.json();
      const data = result.content || result;

      // Apply generated content to all sections
      setState((s) => {
        const newSections = s.sections.map((sec) => {
          const key = sec.section_key as string;
          if (data[key]) {
            return {
              ...sec,
              content: { ...sec.content, ...data[key] },
            };
          }
          return sec;
        });

        // Also update site name from footer if available
        const siteName = data.footer?.company_name || s.site!.name;

        return {
          ...s,
          sections: newSections,
          site: { ...s.site!, name: siteName },
        };
      });

      setAiOpen(false);
      setAiInput("");
      setAiLocation("");
    } catch (err) {
      console.error("AI generate error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Publish handler
  // -------------------------------------------------------------------------

  const handlePublish = async () => {
    const supabase = createClient();
    const newPublished = !state.site?.is_published;
    await supabase
      .from("sites")
      .update({
        is_published: newPublished,
        published_at: newPublished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);
    setState((s) => {
      if (!s.site) return s;
      return {
        ...s,
        site: {
          ...s.site,
          is_published: newPublished,
          published_at: newPublished ? new Date().toISOString() : null,
        },
      };
    });
  };

  // -------------------------------------------------------------------------
  // Download HTML handler
  // -------------------------------------------------------------------------

  const handleDownloadHtml = async () => {
    try {
      const res = await fetch(`/api/export-html?siteId=${siteId}`);
      if (!res.ok) throw new Error("Export failed");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${state.site?.slug || "site"}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  // -------------------------------------------------------------------------
  // Helpers to get section content
  // -------------------------------------------------------------------------

  function getSection<T extends SectionKey>(key: T): SectionContentMap[T] {
    const sec = state.sections.find((s) => s.section_key === key);
    return (sec?.content ?? {}) as SectionContentMap[T];
  }

  const isProOrAbove = state.plan === "pro" || state.plan === "premium";

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!state.site) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-gray-400">Site not found.</p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <Input
            value={state.site.name}
            onChange={(e) => updateSiteName(e.target.value)}
            className="bg-transparent border-none text-gray-900 font-heading font-bold text-sm h-8 w-48 focus-visible:ring-0 focus-visible:border-0 px-1"
          />
        </div>
        <div className="flex items-center gap-2">
          {state.saving && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {state.lastSaved && !state.saving && (
            <span className="text-xs text-gray-400">
              Saved {state.lastSaved.toLocaleTimeString()}
            </span>
          )}
          {state.saveError && (
            <span className="text-xs text-red-500 flex items-center gap-1" title={state.saveError}>
              <AlertCircle className="h-3 w-3" /> Save failed
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/preview/${siteId}`, "_blank")}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Eye className="h-3 w-3 mr-1" /> Preview
          </Button>
          <Button size="sm" onClick={handlePublish} className="bg-gray-900 hover:bg-gray-800 text-white">
            <Globe className="h-3 w-3 mr-1" />
            {state.site.is_published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadHtml}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-3 w-3 mr-1" /> HTML
          </Button>
        </div>
      </div>

      {/* ===== MAIN SPLIT PANE ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ----- LEFT PANEL ----- */}
        <div className="w-96 shrink-0 overflow-y-auto bg-white border-r border-gray-200">
          {/* ✨ AI Content Generator */}
          <div className="border-b border-gray-200">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-heading font-bold text-gray-900 hover:bg-gray-50 transition-colors"
              onClick={() => setAiOpen(!aiOpen)}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Content Generator
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${aiOpen ? "" : "-rotate-90"}`} />
            </button>
            {aiOpen && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-gray-500">
                  Describe your business and AI will fill out all sections instantly.
                </p>
                <div>
                  <FieldLabel>Business Info</FieldLabel>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="e.g. We're a same-day delivery company in Sydney specialising in furniture removals and interstate freight..."
                    rows={3}
                    className="w-full rounded-md bg-white border border-gray-300 text-gray-900 text-sm px-3 py-2 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <FieldLabel>Location (optional)</FieldLabel>
                  <FieldInput
                    value={aiLocation}
                    onChange={setAiLocation}
                    placeholder="e.g. Sydney, NSW"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiInput.trim()}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" /> Generate All Content
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* a) Site Settings */}
          <CollapsibleSection title="Site Settings" defaultOpen>
            <div className="space-y-3">
              <div>
                <FieldLabel>Site Title</FieldLabel>
                <FieldInput
                  value={state.site.config.site_title}
                  onChange={(v) => updateSiteConfig({ site_title: v })}
                />
              </div>
              <div>
                <FieldLabel>Primary Colour</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={state.site.config.primary_color}
                    onChange={(e) =>
                      updateSiteConfig({ primary_color: e.target.value })
                    }
                    className="h-8 w-8 rounded border border-gray-300 bg-transparent cursor-pointer"
                  />
                  <FieldInput
                    value={state.site.config.primary_color}
                    onChange={(v) => updateSiteConfig({ primary_color: v })}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Secondary Colour</FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={state.site.config.secondary_color}
                    onChange={(e) =>
                      updateSiteConfig({ secondary_color: e.target.value })
                    }
                    className="h-8 w-8 rounded border border-gray-300 bg-transparent cursor-pointer"
                  />
                  <FieldInput
                    value={state.site.config.secondary_color}
                    onChange={(v) => updateSiteConfig({ secondary_color: v })}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Meta Description</FieldLabel>
                <FieldTextarea
                  value={state.site.config.meta_description ?? ""}
                  onChange={(v) =>
                    updateSiteConfig({
                      meta_description: v || null,
                    })
                  }
                  rows={2}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* b) Sections */}
          <CollapsibleSection title="Sections">
            <div className="space-y-1">
              {state.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-0">
                    <button
                      type="button"
                      onClick={() =>
                        moveSection(sec.section_key as SectionKey, "up")
                      }
                      disabled={idx === 0}
                      className="text-gray-400 hover:text-gray-900 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        moveSection(sec.section_key as SectionKey, "down")
                      }
                      disabled={idx === state.sections.length - 1}
                      className="text-gray-400 hover:text-gray-900 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="flex-1 text-sm text-gray-700 capitalize">
                    {sec.section_key}
                  </span>
                  <Switch
                    checked={sec.is_enabled}
                    onCheckedChange={() =>
                      toggleSection(sec.section_key as SectionKey)
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* c) Hero Section */}
          <CollapsibleSection title="Hero Section">
            {(() => {
              const hero = getSection("hero") as HeroContent;
              return (
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Headline</FieldLabel>
                    <FieldInput
                      value={hero.headline}
                      onChange={(v) =>
                        updateSection("hero", { ...hero, headline: v })
                      }
                      placeholder="Your headline"
                    />
                  </div>
                  <div>
                    <FieldLabel>Subheadline</FieldLabel>
                    <FieldTextarea
                      value={hero.subheadline ?? ""}
                      onChange={(v) =>
                        updateSection("hero", {
                          ...hero,
                          subheadline: v || null,
                        })
                      }
                      rows={2}
                      placeholder="Optional subheadline"
                    />
                  </div>
                  <div>
                    <FieldLabel>CTA Text</FieldLabel>
                    <FieldInput
                      value={hero.cta_text ?? ""}
                      onChange={(v) =>
                        updateSection("hero", { ...hero, cta_text: v || null })
                      }
                      placeholder="Get a Quote"
                    />
                  </div>
                  <div>
                    <FieldLabel>Logo</FieldLabel>
                    <div className="flex items-center gap-2">
                      {hero.logo_url && (
                        <img
                          src={hero.logo_url}
                          alt="Logo"
                          className="h-8 w-8 object-contain rounded"
                        />
                      )}
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200">
                          <Upload className="h-3 w-3" /> Upload
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f)
                              handleFileUpload(f, (url) =>
                                updateSection("hero", {
                                  ...hero,
                                  logo_url: url,
                                })
                              );
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Hero Images</FieldLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {hero.images.map((img, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={img}
                            alt={`Hero ${i + 1}`}
                            className="h-12 w-16 object-cover rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateSection("hero", {
                                ...hero,
                                images: hero.images.filter((_, j) => j !== i),
                              })
                            }
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200">
                        <Plus className="h-3 w-3" /> Add Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f)
                            handleFileUpload(f, (url) =>
                              updateSection("hero", {
                                ...hero,
                                images: [...hero.images, url],
                              })
                            );
                        }}
                      />
                    </label>
                    <UnsplashPicker
                      label="📷 Stock Library"
                      currentUrl={hero.images[0]}
                      onSelect={(url) =>
                        updateSection("hero", {
                          ...hero,
                          images: [...hero.images, url],
                        })
                      }
                    />
                  </div>
                </div>
              );
            })()}
          </CollapsibleSection>

          {/* c) Statistics Section */}
          <CollapsibleSection title="Statistics">
            {(() => {
              const statsSection = state.sections.find((s) => s.section_key === "stats");
              const statsContent = (statsSection?.content ?? { stats: [] }) as StatsContent;
              const statsItems = statsContent.stats ?? [];
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Animated counter numbers</span>
                    <Switch
                      checked={statsSection?.is_enabled ?? true}
                      onCheckedChange={(checked) => {
                        setState((s) => ({
                          ...s,
                          sections: s.sections.map((sec) =>
                            sec.section_key === "stats" ? { ...sec, is_enabled: checked } : sec
                          ),
                        }));
                      }}
                    />
                  </div>
                  {statsItems.map((stat, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400">Stat {idx + 1}</span>
                        {statsItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newStats = statsItems.filter((_, j) => j !== idx);
                              updateSection("stats", { stats: newStats });
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel>Value</FieldLabel>
                          <FieldInput
                            value={stat.value}
                            onChange={(v) => {
                              const newStats = [...statsItems];
                              newStats[idx] = { ...newStats[idx], value: v };
                              updateSection("stats", { stats: newStats });
                            }}
                            placeholder="99.2"
                          />
                        </div>
                        <div>
                          <FieldLabel>Label</FieldLabel>
                          <FieldInput
                            value={stat.label}
                            onChange={(v) => {
                              const newStats = [...statsItems];
                              newStats[idx] = { ...newStats[idx], label: v };
                              updateSection("stats", { stats: newStats });
                            }}
                            placeholder="On-Time Rate"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <FieldLabel>Prefix</FieldLabel>
                          <FieldInput
                            value={stat.prefix ?? ""}
                            onChange={(v) => {
                              const newStats = [...statsItems];
                              newStats[idx] = { ...newStats[idx], prefix: v || undefined };
                              updateSection("stats", { stats: newStats });
                            }}
                            placeholder="$"
                          />
                        </div>
                        <div>
                          <FieldLabel>Suffix</FieldLabel>
                          <FieldInput
                            value={stat.suffix ?? ""}
                            onChange={(v) => {
                              const newStats = [...statsItems];
                              newStats[idx] = { ...newStats[idx], suffix: v || undefined };
                              updateSection("stats", { stats: newStats });
                            }}
                            placeholder="% or +"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {statsItems.length < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newStats = [...statsItems, { value: "0", label: "New Stat" }];
                        updateSection("stats", { stats: newStats });
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <Plus className="h-3 w-3" /> Add Stat
                    </button>
                  )}
                </div>
              );
            })()}
          </CollapsibleSection>

          {/* d) About Section */}
          <CollapsibleSection title="About Section">
            {(() => {
              const about = getSection("about") as AboutContent;
              return (
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Heading</FieldLabel>
                    <FieldInput
                      value={about.heading}
                      onChange={(v) =>
                        updateSection("about", { ...about, heading: v })
                      }
                      placeholder="About Us"
                    />
                  </div>
                  <div>
                    <FieldLabel>Body</FieldLabel>
                    <FieldTextarea
                      value={about.body}
                      onChange={(v) =>
                        updateSection("about", { ...about, body: v })
                      }
                      rows={4}
                      placeholder="Tell visitors about your company..."
                    />
                  </div>
                  <div>
                    <FieldLabel>Image</FieldLabel>
                    <div className="flex items-center gap-2">
                      {about.image_url && (
                        <img
                          src={about.image_url}
                          alt="About"
                          className="h-12 w-16 object-cover rounded border border-gray-300"
                        />
                      )}
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200">
                          <Upload className="h-3 w-3" /> Upload
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f)
                              handleFileUpload(f, (url) =>
                                updateSection("about", {
                                  ...about,
                                  image_url: url,
                                })
                              );
                          }}
                        />
                      </label>
                      <UnsplashPicker
                        label="📷 Stock"
                        currentUrl={about.image_url ?? undefined}
                        onSelect={(url) =>
                          updateSection("about", { ...about, image_url: url })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </CollapsibleSection>

          {/* e) Services Section */}
          <CollapsibleSection title="Services Section">
            {(() => {
              const services = getSection("services") as ServicesContent;
              const ICON_OPTIONS = [
                "truck",
                "box",
                "clock",
                "shield",
                "globe",
                "plane",
                "ship",
                "train",
                "warehouse",
                "package",
              ];
              return (
                <div className="space-y-3">
                  {services.services.map((svc: ServiceItem, i: number) => (
                    <div
                      key={i}
                      className="space-y-2 p-2 rounded bg-gray-50 border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Service {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateSection("services", {
                              ...services,
                              services: services.services.filter(
                                (_, j) => j !== i
                              ),
                            })
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <FieldInput
                        value={svc.title}
                        onChange={(v) => {
                          const updated = [...services.services];
                          updated[i] = { ...updated[i], title: v };
                          updateSection("services", {
                            ...services,
                            services: updated,
                          });
                        }}
                        placeholder="Service title"
                      />
                      <FieldTextarea
                        value={svc.description}
                        onChange={(v) => {
                          const updated = [...services.services];
                          updated[i] = { ...updated[i], description: v };
                          updateSection("services", {
                            ...services,
                            services: updated,
                          });
                        }}
                        rows={2}
                        placeholder="Description"
                      />
                      <div>
                        <FieldLabel>Icon</FieldLabel>
                        <Select
                          value={svc.icon}
                          onValueChange={(v) => {
                            const updated = [...services.services];
                            updated[i] = { ...updated[i], icon: v! };
                            updateSection("services", {
                              ...services,
                              services: updated,
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white border-gray-300 text-gray-900 text-sm h-8 w-full">
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                {icon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateSection("services", {
                        ...services,
                        services: [
                          ...services.services,
                          { icon: "truck", title: "", description: "" },
                        ],
                      })
                    }
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Service
                  </Button>
                </div>
              );
            })()}
          </CollapsibleSection>

          {/* f) Calculator Section */}
          <CollapsibleSection title="Calculator Section" badge={isProOrAbove ? state.plan : "starter"}>
            {isProOrAbove ? (
              (() => {
                const calc = getSection("calculator") as CalculatorContent;
                return (
                  <div className="space-y-3">
                    <div>
                      <FieldLabel>Heading</FieldLabel>
                      <FieldInput
                        value={calc.heading}
                        onChange={(v) =>
                          updateSection("calculator", { ...calc, heading: v })
                        }
                        placeholder="Calculate Your Rate"
                      />
                    </div>
                    <div>
                      <FieldLabel>Description</FieldLabel>
                      <FieldTextarea
                        value={calc.description ?? ""}
                        onChange={(v) =>
                          updateSection("calculator", {
                            ...calc,
                            description: v || null,
                          })
                        }
                        rows={2}
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <FieldLabel>Show Map</FieldLabel>
                      <Switch
                        checked={calc.show_map}
                        onCheckedChange={(checked: boolean) =>
                          updateSection("calculator", {
                            ...calc,
                            show_map: checked,
                          })
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-700">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Pro Feature</span>
                </div>
                <p className="text-xs text-gray-600">
                  The calculator section is available on Pro and Premium plans.
                  Upgrade to unlock distance-based rate calculators for your
                  visitors.
                </p>
                <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100">
                  <ExternalLink className="h-3 w-3 mr-1" /> Upgrade Plan
                </Button>
              </div>
            )}
          </CollapsibleSection>

          {/* g) Rate Table Editor */}
          {isProOrAbove && (
            <CollapsibleSection title="Rate Table">
              {state.rateTable ? (
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Base Rate per KM</FieldLabel>
                    <FieldInput
                      type="number"
                      step="0.01"
                      value={String(state.rateTable.base_rate_per_km)}
                      onChange={(v) =>
                        updateRateTable({ base_rate_per_km: parseFloat(v) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel>Minimum Fee</FieldLabel>
                    <FieldInput
                      type="number"
                      step="0.01"
                      value={String(state.rateTable.minimum_fee)}
                      onChange={(v) =>
                        updateRateTable({ minimum_fee: parseFloat(v) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel>Currency</FieldLabel>
                    <Select
                      value={state.rateTable.currency}
                      onValueChange={(v) => updateRateTable({ currency: v! })}
                    >
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 text-sm h-8 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["AUD", "USD", "NZD", "GBP"].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Vehicle Surcharges */}
                  <div>
                    <FieldLabel>Vehicle Surcharges</FieldLabel>
                    <div className="space-y-2">
                      {(
                        state.rateTable.vehicle_surcharges as VehicleSurcharge[]
                      ).map((vs, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <FieldInput
                            value={vs.type}
                            onChange={(v) => {
                              const list = [
                                ...state.rateTable!.vehicle_surcharges,
                              ];
                              list[i] = { ...list[i], type: v };
                              updateRateTable({ vehicle_surcharges: list });
                            }}
                            placeholder="Vehicle type"
                            className="flex-1"
                          />
                          <FieldInput
                            type="number"
                            step="0.01"
                            value={String(vs.surcharge)}
                            onChange={(v) => {
                              const list = [
                                ...state.rateTable!.vehicle_surcharges,
                              ];
                              list[i] = {
                                ...list[i],
                                surcharge: parseFloat(v) || 0,
                              };
                              updateRateTable({ vehicle_surcharges: list });
                            }}
                            className="w-20"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list =
                                state.rateTable!.vehicle_surcharges.filter(
                                  (_, j) => j !== i
                                );
                              updateRateTable({ vehicle_surcharges: list });
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateRateTable({
                            vehicle_surcharges: [
                              ...state.rateTable!.vehicle_surcharges,
                              { type: "", surcharge: 0 },
                            ],
                          })
                        }
                        className="w-full"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Surcharge
                      </Button>
                    </div>
                  </div>

                  {/* Zone Multipliers */}
                  <div>
                    <FieldLabel>Zone Multipliers</FieldLabel>
                    <div className="space-y-2">
                      {(
                        state.rateTable.zone_multipliers as ZoneMultiplier[]
                      ).map((zm, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <FieldInput
                            value={zm.zone}
                            onChange={(v) => {
                              const list = [
                                ...state.rateTable!.zone_multipliers,
                              ];
                              list[i] = { ...list[i], zone: v };
                              updateRateTable({ zone_multipliers: list });
                            }}
                            placeholder="Zone name"
                            className="flex-1"
                          />
                          <FieldInput
                            type="number"
                            step="0.1"
                            value={String(zm.multiplier)}
                            onChange={(v) => {
                              const list = [
                                ...state.rateTable!.zone_multipliers,
                              ];
                              list[i] = {
                                ...list[i],
                                multiplier: parseFloat(v) || 1,
                              };
                              updateRateTable({ zone_multipliers: list });
                            }}
                            className="w-20"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list =
                                state.rateTable!.zone_multipliers.filter(
                                  (_, j) => j !== i
                                );
                              updateRateTable({ zone_multipliers: list });
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateRateTable({
                            zone_multipliers: [
                              ...state.rateTable!.zone_multipliers,
                              { zone: "", multiplier: 1 },
                            ],
                          })
                        }
                        className="w-full"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Zone
                      </Button>
                    </div>
                  </div>

                  {/* Email Settings */}
                  <div>
                    <FieldLabel>Email Subject</FieldLabel>
                    <FieldInput
                      value={state.rateTable.email_subject ?? ""}
                      onChange={(v) =>
                        updateRateTable({ email_subject: v || null })
                      }
                      placeholder="Your Quote from..."
                    />
                  </div>
                  <div>
                    <FieldLabel>Email Template</FieldLabel>
                    <FieldTextarea
                      value={state.rateTable.email_template ?? ""}
                      onChange={(v) =>
                        updateRateTable({ email_template: v || null })
                      }
                      rows={4}
                      placeholder="Write your email template..."
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Use `{"{{origin}}"}`, `{"{{destination}}"}`, `{"{{distance}}"}`,
                      `{"{{cost}}"}`, `{"{{vehicle_type}}"}` as merge tags
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  No rate table configured. Save the site first.
                </p>
              )}
            </CollapsibleSection>
          )}

          {/* h) Testimonials Section */}
          <CollapsibleSection title="Testimonials Section">
            {(() => {
              const test = getSection("testimonials") as TestimonialsContent;
              return (
                <div className="space-y-3">
                  {test.testimonials.map((t: TestimonialItem, i: number) => (
                    <div
                      key={i}
                      className="space-y-2 p-2 rounded bg-gray-50 border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Testimonial {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateSection("testimonials", {
                              ...test,
                              testimonials: test.testimonials.filter(
                                (_, j) => j !== i
                              ),
                            })
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <FieldInput
                        value={t.name}
                        onChange={(v) => {
                          const updated = [...test.testimonials];
                          updated[i] = { ...updated[i], name: v };
                          updateSection("testimonials", {
                            ...test,
                            testimonials: updated,
                          });
                        }}
                        placeholder="Customer name"
                      />
                      <FieldInput
                        value={t.company}
                        onChange={(v) => {
                          const updated = [...test.testimonials];
                          updated[i] = { ...updated[i], company: v };
                          updateSection("testimonials", {
                            ...test,
                            testimonials: updated,
                          });
                        }}
                        placeholder="Company"
                      />
                      <FieldTextarea
                        value={t.text}
                        onChange={(v) => {
                          const updated = [...test.testimonials];
                          updated[i] = { ...updated[i], text: v };
                          updateSection("testimonials", {
                            ...test,
                            testimonials: updated,
                          });
                        }}
                        rows={2}
                        placeholder="Testimonial text"
                      />
                      <div>
                        <FieldLabel>Rating: {t.rating}</FieldLabel>
                        <Slider
                          value={[t.rating]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(v: number | readonly number[]) => {
                            const val = Array.isArray(v) ? v[0] : v;
                            const updated = [...test.testimonials];
                            updated[i] = { ...updated[i], rating: val };
                            updateSection("testimonials", {
                              ...test,
                              testimonials: updated,
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateSection("testimonials", {
                        ...test,
                        testimonials: [
                          ...test.testimonials,
                          { name: "", company: "", text: "", rating: 5 },
                        ],
                      })
                    }
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Testimonial
                  </Button>
                </div>
              );
            })()}
          </CollapsibleSection>

          {/* i) Contact Section */}
          <CollapsibleSection title="Contact Section">
            {(() => {
              const contact = getSection("contact") as ContactContent;
              return (
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Heading</FieldLabel>
                    <FieldInput
                      value={contact.heading}
                      onChange={(v) =>
                        updateSection("contact", { ...contact, heading: v })
                      }
                      placeholder="Contact Us"
                    />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <FieldInput
                      type="email"
                      value={contact.email ?? ""}
                      onChange={(v) =>
                        updateSection("contact", {
                          ...contact,
                          email: v || null,
                        })
                      }
                      placeholder="info@company.com"
                    />
                  </div>
                  <div>
                    <FieldLabel>Phone</FieldLabel>
                    <FieldInput
                      value={contact.phone ?? ""}
                      onChange={(v) =>
                        updateSection("contact", {
                          ...contact,
                          phone: v || null,
                        })
                      }
                      placeholder="+61 400 000 000"
                    />
                  </div>
                  <div>
                    <FieldLabel>Address</FieldLabel>
                    <FieldTextarea
                      value={contact.address ?? ""}
                      onChange={(v) =>
                        updateSection("contact", {
                          ...contact,
                          address: v || null,
                        })
                      }
                      rows={2}
                      placeholder="123 Main St, Sydney NSW 2000"
                    />
                  </div>
                  <div>
                    <FieldLabel>Map Embed URL</FieldLabel>
                    <FieldInput
                      value={contact.map_embed_url ?? ""}
                      onChange={(v) =>
                        updateSection("contact", {
                          ...contact,
                          map_embed_url: v || null,
                        })
                      }
                      placeholder="https://www.google.com/maps/embed?..."
                    />
                  </div>
                </div>
              );
            })()}
          </CollapsibleSection>

          {/* j) Footer Section */}
          <CollapsibleSection title="Footer Section">
            {(() => {
              const footer = getSection("footer") as FooterContent;
              return (
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Company Name</FieldLabel>
                    <FieldInput
                      value={footer.company_name}
                      onChange={(v) =>
                        updateSection("footer", { ...footer, company_name: v })
                      }
                      placeholder="Company Pty Ltd"
                    />
                  </div>
                  <div>
                    <FieldLabel>Copyright Text</FieldLabel>
                    <FieldInput
                      value={footer.copyright_text}
                      onChange={(v) =>
                        updateSection("footer", {
                          ...footer,
                          copyright_text: v,
                        })
                      }
                      placeholder="© 2024 Company. All rights reserved."
                    />
                  </div>
                </div>
              );
            })()}
          </CollapsibleSection>

          {/* k) Integrations */}
          <CollapsibleSection title="Integrations">
            {state.integration ? (
              <div className="space-y-3">
                <div>
                  <FieldLabel>GA4 Measurement ID</FieldLabel>
                  <FieldInput
                    value={state.integration.ga4_id ?? ""}
                    onChange={(v) =>
                      updateIntegration({ ga4_id: v || null })
                    }
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <FieldLabel>Google Place ID (Reviews)</FieldLabel>
                  <FieldInput
                    value={state.integration.google_place_id ?? ""}
                    onChange={(v) =>
                      updateIntegration({ google_place_id: v || null })
                    }
                    placeholder="ChIJ..."
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                No integration record found. Save the site first.
              </p>
            )}
          </CollapsibleSection>

          {/* l) Hosting / VPS */}
          <CollapsibleSection title="Hosting" badge={hostingStatus?.provisioned ? "VPS" : undefined}>
            <div className="space-y-3">
              {/* Hosting status display */}
              {!hostingStatus ? (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking hosting status...
                </div>
              ) : !hostingStatus.provisioned ? (
                /* Not provisioned */
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Shared Hosting</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Your site is hosted on our shared infrastructure. Upgrade to get a dedicated VPS for better performance.
                  </p>
                  {isProOrAbove ? (
                    <Button
                      size="sm"
                      onClick={handleProvisionVps}
                      disabled={hostingLoading}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {hostingLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Provisioning...
                        </>
                      ) : (
                        <>
                          <Server className="h-3 w-3 mr-1" /> Provision VPS
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-700">
                        <Lock className="h-3 w-3" />
                        <span className="text-xs font-medium">VPS — Pro Feature</span>
                      </div>
                      <p className="text-[10px] text-gray-600">
                        Dedicated VPS hosting is available on Pro and Premium plans.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-700 border-amber-300 hover:bg-amber-100 text-xs"
                        onClick={() => router.push('/dashboard/billing')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> Upgrade Plan
                      </Button>
                    </div>
                  )}
                </div>
              ) : hostingStatus.error === 'droplet not found' ? (
                /* Droplet was deleted externally */
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">VPS Not Found</span>
                  </div>
                  <p className="text-xs text-red-600">
                    The VPS droplet associated with this site no longer exists. It may have been deleted manually.
                  </p>
                  {hostingStatus.planLabel && (
                    <p className="text-[10px] text-gray-500">Plan: {hostingStatus.planLabel}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleDeprovisionVps}
                    disabled={hostingLoading}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-100"
                  >
                    {hostingLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                    Clean Up &amp; Reset
                  </Button>
                </div>
              ) : hostingStatus.status === 'active' ? (
                /* Active VPS */
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Dedicated VPS Active</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="text-gray-500">IP:</span>
                      <code className="font-mono text-gray-900">{hostingStatus.ip}</code>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="text-gray-500">Site:</span>
                      <code className="font-mono text-blue-600">{state.site.slug}.transportbuilder.xyz</code>
                    </div>
                    {hostingStatus.planLabel && (
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <span className="text-gray-500">Plan:</span>
                        <span>{hostingStatus.planLabel}</span>
                      </div>
                    )}
                    {hostingStatus.name && (
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <span className="text-gray-500">Droplet:</span>
                        <span>{hostingStatus.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeprovisionVps}
                      disabled={hostingLoading}
                      className="w-full border-red-300 text-red-700 hover:bg-red-50"
                    >
                      {hostingLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                      Deprovision VPS
                    </Button>
                    <p className="text-[10px] text-gray-500 mt-1">
                      This will delete the dedicated server and revert to shared hosting.
                    </p>
                  </div>
                </div>
              ) : (
                /* Provisioning (new/off/etc.) */
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                    <span className="text-sm font-medium text-amber-700">Setting up your dedicated server...</span>
                  </div>
                  <p className="text-xs text-amber-600">
                    Status: {hostingStatus.status || 'provisioning'}
                  </p>
                  {hostingStatus.planLabel && (
                    <p className="text-[10px] text-gray-500">Plan: {hostingStatus.planLabel}</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchHostingStatus}
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Refresh Status
                  </Button>
                </div>
              )}

              {/* Error display */}
              {hostingError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-xs text-red-700">{hostingError}</p>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* m) Domain & Publishing */}
          <CollapsibleSection title="Domain & Publishing">
            <div className="space-y-3">
              {/* Subdomain */}
              <div>
                <FieldLabel>Subdomain</FieldLabel>
                <div className="flex items-center gap-0">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-2 py-1.5 text-xs text-gray-500">
                    https://
                  </span>
                  <input
                    type="text"
                    value={state.site.slug}
                    readOnly
                    className="flex-1 rounded-none border border-gray-300 bg-gray-50 text-gray-900 text-sm px-2 py-1.5"
                  />
                  <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-100 px-2 py-1.5 text-xs text-gray-500">
                    .transportbuilder.xyz
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Auto-generated from your site name. Published sites are live at this URL.
                </p>
              </div>

              {/* Custom Domain (Pro+ only) */}
              {isProOrAbove ? (
                <div className="space-y-3">
                  {state.site.custom_domain ? (
                    <>
                      {/* Connected domain display */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {state.site.custom_domain}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleRemoveDomain}
                          disabled={customDomainLoading}
                          className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      </div>

                      {/* Verification status */}
                      {state.site.custom_domain_verified ? (
                        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
                          <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-green-700">Domain verified &amp; SSL active</p>
                            <p className="text-[10px] text-green-600">Your site is live at https://{state.site.custom_domain}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-amber-700">Pending verification</p>
                              <p className="text-[10px] text-amber-600">
                                {customDomainVerifyResult?.sslStatus
                                  ? `SSL Status: ${customDomainVerifyResult.sslStatus}`
                                  : "Add the DNS records below, then verify"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleVerifyDomain}
                              disabled={customDomainLoading}
                              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                            >
                              {customDomainLoading ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3 mr-1" />
                              )}
                              Verify
                            </Button>
                          </div>

                          {/* DNS instructions */}
                          <div className="rounded-md bg-gray-50 border border-gray-200 p-3 space-y-2">
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                              DNS Records to Add
                            </p>
                            <div className="space-y-2">
                              {/* CNAME record */}
                              <div className="rounded bg-white border border-gray-200 px-2.5 py-1.5">
                                <p className="text-[10px] font-medium text-gray-500">CNAME Record</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <code className="text-[10px] text-gray-900 font-mono">
                                    {customDomainInstructions?.cnameRecord.name ?? state.site.custom_domain}
                                  </code>
                                  <span className="text-[10px] text-gray-400">→</span>
                                  <code className="text-[10px] text-blue-600 font-mono">
                                    {customDomainInstructions?.cnameRecord.value ?? "proxy.transitpage.xyz"}
                                  </code>
                                </div>
                              </div>
                              {/* TXT record */}
                              <div className="rounded bg-white border border-gray-200 px-2.5 py-1.5">
                                <p className="text-[10px] font-medium text-gray-500">TXT Record (Ownership Verification)</p>
                                <div className="mt-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-400">Name:</span>
                                    <code className="text-[10px] text-gray-900 font-mono">
                                      {customDomainInstructions?.txtRecord.name ?? `_cf-custom-hostname.${state.site.custom_domain}`}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-400">Value:</span>
                                    <code className="text-[10px] text-blue-600 font-mono break-all">
                                      {customDomainInstructions?.txtRecord.value ?? state.site.cloudflare_custom_hostname_id ?? "—"}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400">
                              Add these records at your DNS provider. DNS propagation can take 5–60 minutes.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* No domain connected — show input */}
                      <div>
                        <FieldLabel>Custom Domain</FieldLabel>
                        <div className="flex items-center gap-2">
                          <FieldInput
                            value={customDomainInput}
                            onChange={setCustomDomainInput}
                            placeholder="mycompany.com"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleConnectDomain();
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={handleConnectDomain}
                            disabled={customDomainLoading || !customDomainInput.trim()}
                            className="shrink-0 bg-gray-900 hover:bg-gray-800 text-white h-8"
                          >
                            {customDomainLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Globe className="h-3 w-3 mr-1" />
                            )}
                            Connect
                          </Button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Enter your domain without the https:// prefix (e.g. mycompany.com)
                        </p>
                      </div>
                    </>
                  )}

                  {/* Error display */}
                  {customDomainError && (
                    <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
                      <p className="text-xs text-red-700">{customDomainError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Lock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Custom Domain — Pro Feature</span>
                  </div>
                  <p className="text-[10px] text-gray-600">
                    Connect your own domain on Pro and Premium plans.
                  </p>
                  <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" /> Upgrade Plan
                  </Button>
                </div>
              )}
            </div>
          </CollapsibleSection>
        </div>
        <div className="flex-1 bg-white flex flex-col">
          {/* View mode switcher */}
          <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50">
            {([
              { mode: "desktop" as const, icon: Monitor, label: "Desktop" },
              { mode: "tablet" as const, icon: Tablet, label: "Tablet" },
              { mode: "mobile" as const, icon: Smartphone, label: "Mobile" },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setState((s) => ({ ...s, viewMode: mode }))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  state.viewMode === mode
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          {/* Preview iframe */}
          <div className={`flex-1 flex items-start justify-center overflow-auto ${
            state.viewMode !== "desktop" ? "bg-gray-100" : ""
          }`}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: state.viewMode === "mobile" ? "375px" : state.viewMode === "tablet" ? "768px" : "100%",
                maxWidth: state.viewMode !== "desktop" ? `${state.viewMode === "mobile" ? 375 : 768}px` : undefined,
              }}
            >
              <iframe
                ref={iframeRef}
                src={`/preview/${siteId}`}
                className={`w-full h-full border-0 ${state.viewMode !== "desktop" ? "shadow-lg" : ""}`}
                title="Site Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

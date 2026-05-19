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
  Lock,
  ExternalLink,
  Save,
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
  const supabase = createClient();
  const path = `${siteId}/${file.name}`;
  const { error } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { upsert: true });
  if (error) {
    console.error("Upload error:", error);
    return null;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("site-assets").getPublicUrl(path);
  return publicUrl;
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
    <div className="border-b border-slate-700">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
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
    <Label className="text-xs text-slate-400 uppercase tracking-wide">
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
      className="bg-slate-800 border-slate-700 text-white text-sm h-8"
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
      className="bg-slate-800 border-slate-700 text-white text-sm"
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
  });

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // -------------------------------------------------------------------------
  // Fetch data
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Fetch site
      const { data: site } = await supabase
        .from("sites")
        .select("*")
        .eq("id", siteId)
        .single();

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
      });
    }
    load();
  }, [siteId]);

  // -------------------------------------------------------------------------
  // Auto-save (1s debounce)
  // -------------------------------------------------------------------------

  const save = useCallback(async () => {
    if (!state.site) return;
    setState((s) => ({ ...s, saving: true }));
    const supabase = createClient();

    // Save site config
    await supabase
      .from("sites")
      .update({
        name: state.site.name,
        config: state.site.config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    // Save sections
    for (const section of state.sections) {
      await supabase
        .from("site_sections")
        .update({
          is_enabled: section.is_enabled,
          sort_order: section.sort_order,
          content: section.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id);
    }

    // Save rate table if exists
    if (state.rateTable) {
      await supabase
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
    }

    // Save integrations if exists
    if (state.integration) {
      await supabase
        .from("site_integrations")
        .update({
          ga4_id: state.integration.ga4_id,
          google_place_id: state.integration.google_place_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", state.integration.id);
    }

    setState((s) => ({ ...s, saving: false, lastSaved: new Date() }));
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
    iframeRef.current.contentWindow?.postMessage(payload, "*");
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
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!state.site) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <p className="text-slate-400">Site not found.</p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-700 bg-slate-950 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <Input
            value={state.site.name}
            onChange={(e) => updateSiteName(e.target.value)}
            className="bg-transparent border-none text-white font-semibold text-sm h-8 w-48 focus-visible:ring-0 focus-visible:border-0 px-1"
          />
        </div>
        <div className="flex items-center gap-2">
          {state.saving && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {state.lastSaved && !state.saving && (
            <span className="text-xs text-slate-500">
              Saved {state.lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/preview/${siteId}`, "_blank")}
          >
            <Eye className="h-3 w-3 mr-1" /> Preview
          </Button>
          <Button size="sm" onClick={handlePublish}>
            <Globe className="h-3 w-3 mr-1" />
            {state.site.is_published ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* ===== MAIN SPLIT PANE ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ----- LEFT PANEL ----- */}
        <div className="w-96 shrink-0 overflow-y-auto bg-slate-950 border-r border-slate-700">
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
                    className="h-8 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
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
                    className="h-8 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
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
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/50"
                >
                  <div className="flex flex-col gap-0">
                    <button
                      type="button"
                      onClick={() =>
                        moveSection(sec.section_key as SectionKey, "up")
                      }
                      disabled={idx === 0}
                      className="text-slate-500 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        moveSection(sec.section_key as SectionKey, "down")
                      }
                      disabled={idx === state.sections.length - 1}
                      className="text-slate-500 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="flex-1 text-sm text-slate-300 capitalize">
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
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
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
                            className="h-12 w-16 object-cover rounded border border-slate-700"
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
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
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
                  </div>
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
                          className="h-12 w-16 object-cover rounded border border-slate-700"
                        />
                      )}
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
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
                      className="space-y-2 p-2 rounded bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
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
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-full">
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
              <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Pro Feature</span>
                </div>
                <p className="text-xs text-slate-400">
                  The calculator section is available on Pro and Premium plans.
                  Upgrade to unlock distance-based rate calculators for your
                  visitors.
                </p>
                <Button size="sm" variant="outline" className="text-amber-400 border-amber-800/50 hover:bg-amber-950/50">
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
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm h-8 w-full">
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
                    <p className="text-[10px] text-slate-500 mt-1">
                      Use `{"{{origin}}"}`, `{"{{destination}}"}`, `{"{{distance}}"}`,
                      `{"{{cost}}"}`, `{"{{vehicle_type}}"}` as merge tags
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
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
                      className="space-y-2 p-2 rounded bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
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
              <p className="text-xs text-slate-500">
                No integration record found. Save the site first.
              </p>
            )}
          </CollapsibleSection>
        </div>

        {/* ----- RIGHT PANEL (Preview) ----- */}
        <div className="flex-1 bg-white">
          <iframe
            ref={iframeRef}
            src={`/preview/${siteId}`}
            className="w-full h-full border-0"
            title="Site Preview"
          />
        </div>
      </div>
    </div>
  );
}

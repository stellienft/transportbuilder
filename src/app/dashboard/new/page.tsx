"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { getDefaultContent, getTemplateConfigDefaults } from "@/lib/default-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";
import type { Template, SectionKey, SectionContentMap } from "@/lib/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const createSiteSchema = z.object({
  name: z.string().min(1, "Site name is required").max(100),
  templateId: z.string().min(1, "Please select a template"),
});

type CreateSiteForm = z.infer<typeof createSiteSchema>;

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Template visual metadata
// ---------------------------------------------------------------------------

interface TemplateVisual {
  heroImage: string;
  primaryColor: string;
  secondaryColor: string;
  accentLabel: string;
  style: string;
}

const TEMPLATE_VISUALS: Record<string, TemplateVisual> = {
  "haulier-bold": {
    heroImage: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80",
    primaryColor: "#2563eb",
    secondaryColor: "#1e293b",
    accentLabel: "Bold Blue",
    style: "Dark & Dramatic",
  },
  "express-clean": {
    heroImage: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
    primaryColor: "#0ea5e9",
    secondaryColor: "#f8fafc",
    accentLabel: "Sky Blue",
    style: "Clean & Minimal",
  },
  "freight-pro": {
    heroImage: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80",
    primaryColor: "#dc2626",
    secondaryColor: "#111827",
    accentLabel: "Corporate Red",
    style: "Corporate & Bold",
  },
  "outback-haul": {
    heroImage: "https://images.unsplash.com/photo-1519003722824-194d44558860?w=800&q=80",
    primaryColor: "#d97706",
    secondaryColor: "#451a03",
    accentLabel: "Outback Amber",
    style: "Rustic & Warm",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewSitePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSiteForm>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: { name: "", templateId: "" },
  });

  const selectedTemplateId = watch("templateId");
  const siteName = watch("name");
  const previewSlug = slugify(siteName || "your-site");

  // Fetch templates on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTemplates((data as Template[]) ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Submit handler
  async function onSubmit(values: CreateSiteForm) {
    setSubmitting(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to create a site.");
      setSubmitting(false);
      return;
    }

    const slug = slugify(values.name);

    const template = templates.find((t) => t.id === values.templateId);
    const templateSlug = template?.slug ?? "haulier-bold";

    const defaultContent = getDefaultContent(templateSlug);
    const configDefaults = getTemplateConfigDefaults(templateSlug);

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .insert({
        user_id: user.id,
        template_id: values.templateId,
        name: values.name,
        slug,
        is_published: false,
        config: {
          primary_color: configDefaults.primary_color,
          secondary_color: configDefaults.secondary_color,
          font_heading: configDefaults.font_heading,
          font_body: configDefaults.font_body,
          favicon_url: null,
          site_title: values.name,
          meta_description: null,
          og_image_url: null,
        },
      })
      .select("id")
      .single();

    if (siteError || !site) {
      setError(siteError?.message ?? "Failed to create site.");
      setSubmitting(false);
      return;
    }

    const sectionKeys = template?.sections ?? [
      "hero",
      "about",
      "services",
      "calculator",
      "testimonials",
      "contact",
      "footer",
    ];

    const sectionInserts = (sectionKeys as SectionKey[]).map(
      (key, index) => ({
        site_id: site.id,
        section_key: key,
        is_enabled: true,
        sort_order: index,
        content: defaultContent[key] ?? {},
      })
    );

    const { error: sectionsError } = await supabase
      .from("site_sections")
      .insert(sectionInserts);

    if (sectionsError) {
      setError(sectionsError.message);
      setSubmitting(false);
      return;
    }

    router.push(`/dashboard/${site.id}/editor`);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">Create New Site</h1>
        <p className="text-gray-500 mt-1">
          Pick a template and name your site to get started.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Site name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">
            Site Name
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="name"
              placeholder="e.g. Sydney Express Transport"
              {...register("name")}
              className="bg-white border-gray-300 text-gray-900 max-w-md"
            />
            {siteName && (
              <span className="text-sm text-gray-400 shrink-0">
                → <span className="text-gray-900 font-medium">{previewSlug}</span>.transportbuilder.xyz
              </span>
            )}
          </div>
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Template selection */}
        <div className="space-y-4">
          <Label className="text-gray-700">Choose a Template</Label>
          {errors.templateId && (
            <p className="text-sm text-red-600">{errors.templateId.message}</p>
          )}

          {templates.length === 0 ? (
            <p className="text-gray-400">No templates available.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {templates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const visual = TEMPLATE_VISUALS[template.slug] ?? TEMPLATE_VISUALS["haulier-bold"];

                return (
                  <div
                    key={template.id}
                    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                      isSelected
                        ? "border-gray-900 ring-2 ring-gray-900/10 shadow-lg"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                    onClick={() => setValue("templateId", template.id)}
                  >
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 z-10 h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Hero preview image */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={visual.heroImage}
                        alt={template.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Overlay template name */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-heading font-bold text-white drop-shadow-lg">
                            {template.name}
                          </h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/25 text-white/90 backdrop-blur-sm">
                            {visual.style}
                          </span>
                        </div>
                        <p className="text-xs text-white/80 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    {/* Color swatches + section badges */}
                    <div className="p-4 bg-white space-y-3">
                      {/* Color palette */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Palette</span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-5 w-5 rounded-full border border-gray-200 shadow-sm"
                            style={{ backgroundColor: visual.primaryColor }}
                            title={`Primary: ${visual.primaryColor}`}
                          />
                          <div
                            className="h-5 w-5 rounded-full border border-gray-200 shadow-sm"
                            style={{ backgroundColor: visual.secondaryColor }}
                            title={`Secondary: ${visual.secondaryColor}`}
                          />
                          <span className="text-[10px] text-gray-500 ml-1">{visual.accentLabel}</span>
                        </div>
                      </div>

                      {/* Section badges */}
                      <div className="flex flex-wrap gap-1">
                        {(template.sections as string[]).map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-[10px] capitalize"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={submitting} className="bg-gray-900 hover:bg-gray-800 text-white">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Site"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

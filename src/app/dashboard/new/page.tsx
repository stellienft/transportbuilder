"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LayoutTemplate } from "lucide-react";
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
// Default section content factories
// ---------------------------------------------------------------------------

function getDefaultContent(key: SectionKey): SectionContentMap[SectionKey] {
  switch (key) {
    case "hero":
      return {
        headline: "",
        subheadline: null,
        cta_text: null,
        cta_link: null,
        logo_url: null,
        images: [],
      };
    case "about":
      return { heading: "", body: "", image_url: null };
    case "services":
      return { services: [] };
    case "calculator":
      return { heading: "", description: null, show_map: false };
    case "testimonials":
      return { testimonials: [] };
    case "contact":
      return {
        heading: "",
        email: null,
        phone: null,
        address: null,
        map_embed_url: null,
      };
    case "footer":
      return { company_name: "", copyright_text: "", links: [] };
    default:
      return {} as SectionContentMap[SectionKey];
  }
}

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

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to create a site.");
      setSubmitting(false);
      return;
    }

    const slug = slugify(values.name);

    // Create site
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .insert({
        user_id: user.id,
        template_id: values.templateId,
        name: values.name,
        slug,
        is_published: false,
        config: {
          primary_color: "#2563eb",
          secondary_color: "#1e293b",
          font_heading: "Inter",
          font_body: "Inter",
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

    // Get the template to know which sections to create
    const template = templates.find((t) => t.id === values.templateId);
    const sectionKeys = template?.sections ?? [
      "hero",
      "about",
      "services",
      "calculator",
      "testimonials",
      "contact",
      "footer",
    ];

    // Create site_sections for each section in the template
    const sectionInserts = (sectionKeys as SectionKey[]).map(
      (key, index) => ({
        site_id: site.id,
        section_key: key,
        is_enabled: true,
        sort_order: index,
        content: getDefaultContent(key),
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

    // Redirect to the editor
    router.push(`/dashboard/${site.id}/editor`);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Create New Site</h1>
        <p className="text-slate-400 mt-1">
          Pick a template and name your site to get started.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Site name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">
            Site Name
          </Label>
          <Input
            id="name"
            placeholder="e.g. Sydney Express Transport"
            {...register("name")}
            className="bg-slate-800 border-slate-700 text-white max-w-md"
          />
          {errors.name && (
            <p className="text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Template selection */}
        <div className="space-y-4">
          <Label className="text-white">Choose a Template</Label>
          {errors.templateId && (
            <p className="text-sm text-red-400">{errors.templateId.message}</p>
          )}

          {templates.length === 0 ? (
            <p className="text-slate-400">No templates available.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 bg-slate-800/80"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                    }`}
                    onClick={() => setValue("templateId", template.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-white text-base">
                          {template.name}
                        </CardTitle>
                        {isSelected && <Badge>Selected</Badge>}
                      </div>
                      {template.description && (
                        <CardDescription className="text-slate-400">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {/* Preview thumbnail area */}
                      <div className="aspect-video rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center">
                        {template.preview_url ? (
                          <img
                            src={template.preview_url}
                            alt={template.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <LayoutTemplate className="h-10 w-10 text-slate-600" />
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(template.sections as string[]).map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={submitting}>
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

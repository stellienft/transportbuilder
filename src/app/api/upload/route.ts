import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Allowed MIME types for upload
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const siteId = formData.get("siteId") as string | null;

    if (!file || !siteId) {
      return NextResponse.json(
        { error: "Missing file or siteId" },
        { status: 400 }
      );
    }

    // ── File type whitelist ─────────────────────────────────────────
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed. Allowed: ${[...ALLOWED_TYPES].join(", ")}` },
        { status: 400 }
      );
    }

    // ── File size check ─────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // ── Ownership check ─────────────────────────────────────────────
    const supabase = createAdminClient();
    const { data: site, error: siteErr } = await supabase
      .from("sites")
      .select("user_id")
      .eq("id", siteId)
      .single();

    if (siteErr || !site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (site.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Sanitize filename ───────────────────────────────────────────
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeExt = ext.replace(/[^a-z0-9]/g, "");
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const path = `${siteId}/${timestamp}-${randomSuffix}.${safeExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, buffer, {
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("[Upload] Storage error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("site-assets").getPublicUrl(path);

    return NextResponse.json({ url: publicUrl, path });
  } catch (err) {
    console.error("[Upload] Route error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

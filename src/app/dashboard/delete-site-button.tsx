"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function DeleteSiteButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    const supabase = createClient();

    // Delete subscriptions first (FK dependency)
    await supabase.from("subscriptions").delete().eq("site_id", siteId);
    // Delete the site (cascades sections, rate_tables, etc.)
    await supabase.from("sites").delete().eq("id", siteId);

    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs"
        >
          {deleting ? "Deleting…" : `Delete "${siteName}"?`}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      className="text-slate-400 hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-3 w-3 mr-1" />
      Delete
    </Button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      className="text-slate-400 hover:text-white hover:bg-slate-800"
      title="Log out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}

import Link from "next/link";
import { LayoutDashboard, Plus, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function DashboardSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 border-r border-slate-800">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-800">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          TP
        </div>
        <span className="text-lg font-semibold text-white">TransitPage</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Site
        </Link>
        <Link
          href="/dashboard/account"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <User className="h-4 w-4" />
          Account
        </Link>
      </nav>

      {/* User info & logout */}
      <div className="border-t border-slate-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-slate-300">
              {user?.email ?? "User"}
            </p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardSidebar />
      <main className="pl-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

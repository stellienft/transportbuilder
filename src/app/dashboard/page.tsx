import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, ExternalLink, Pencil } from "lucide-react";
import type { Site, Subscription } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's sites
  const { data: sites } = await supabase
    .from("sites")
    .select("*, subscriptions!site_id(plan, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch templates for name resolution
  const { data: templates } = await supabase
    .from("templates")
    .select("id, name, slug");

  const templateMap = new Map(templates?.map((t) => [t.id, t.name]) ?? []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Sites</h1>
          <p className="text-slate-400 mt-1">
            Manage your transport company landing pages
          </p>
        </div>
        <Link href="/dashboard/new">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Site
          </Button>
        </Link>
      </div>

      {/* Sites grid or empty state */}
      {!sites || sites.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center">
              <Plus className="h-8 w-8 text-slate-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-white">
                No sites yet
              </h3>
              <p className="text-slate-400 max-w-sm">
                Create your first transport company landing page and get online
                in minutes.
              </p>
            </div>
            <Link href="/dashboard/new">
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create your first site
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site: Site & { subscriptions?: Subscription[] }) => {
            const subscription = site.subscriptions?.[0];
            return (
              <Card
                key={site.id}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white">{site.name}</CardTitle>
                    <Badge
                      variant={site.is_published ? "default" : "secondary"}
                    >
                      {site.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-400">
                    {templateMap.get(site.template_id) ?? "Unknown template"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Plan:</span>
                    <Badge variant="outline" className="capitalize">
                      {subscription?.plan ?? "starter"}
                    </Badge>
                  </div>
                  {site.custom_domain && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span>Domain:</span>
                      <span className="text-slate-300">
                        {site.custom_domain}
                      </span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  <Link href={`/dashboard/${site.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  {site.is_published && site.custom_domain && (
                    <a
                      href={`https://${site.custom_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </a>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

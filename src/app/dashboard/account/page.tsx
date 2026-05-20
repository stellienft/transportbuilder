import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AccountEditor } from "./account-editor";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <AccountEditor
      userId={user.id}
      email={user.email ?? ""}
      emailVerified={!!user.email_confirmed_at}
      profile={profile}
    />
  );
}

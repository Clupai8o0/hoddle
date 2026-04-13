import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded_at) {
    redirect("/onboarding");
  }

  return (
    <>
      <AppNav
        userName={profile?.full_name ?? "You"}
        avatarUrl={profile?.avatar_url}
      />
      {children}
    </>
  );
}

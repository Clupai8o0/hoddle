import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/app-nav";
import { QueryProvider } from "@/components/providers/query-provider";

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

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarded_at, full_name, avatar_url, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ]);

  if (!profile?.onboarded_at) {
    if (profile?.role === "mentor") {
      redirect("/mentor-onboarding");
    }
    redirect("/onboarding");
  }

  return (
    <QueryProvider>
      <AppNav
        userName={profile?.full_name ?? "You"}
        avatarUrl={profile?.avatar_url}
        userId={user.id}
        initialUnreadCount={unreadCount ?? 0}
      />
      {children}
    </QueryProvider>
  );
}

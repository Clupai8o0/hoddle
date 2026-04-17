import { createClient } from "@/lib/supabase/server";
import { BrowseNav } from "@/components/layout/browse-nav";
import { FeedbackWidget } from "@/components/patterns/feedback-widget";

/**
 * Layout for publicly browsable pages: /forums, /stories, /content.
 * Auth is optional — unauthenticated visitors can read everything;
 * write actions (post, reply, submit story) redirect to login at the page level.
 */
export default async function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navUser: {
    name: string;
    avatarUrl?: string | null;
    userId: string;
    unreadCount: number;
  } | null = null;

  if (user) {
    const [{ data: profile }, { count: unreadCount }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .is("read_at", null),
    ]);

    if (profile) {
      navUser = {
        name: profile.full_name ?? "You",
        avatarUrl: profile.avatar_url,
        userId: user.id,
        unreadCount: unreadCount ?? 0,
      };
    }
  }

  return (
    <>
      <BrowseNav user={navUser} />
      {children}
      {/* Widget checks user (not navUser) — safe even if profile row is missing,
          since the server action derives identity directly from the session. */}
      {user && <FeedbackWidget />}
    </>
  );
}

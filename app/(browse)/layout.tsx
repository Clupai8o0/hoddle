import { createClient } from "@/lib/supabase/server";
import { BrowseNav } from "@/components/layout/browse-nav";

/**
 * Layout for publicly browsable pages: /forums, /stories.
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

  let navUser: { name: string; avatarUrl?: string | null } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      navUser = { name: profile.full_name ?? "You", avatarUrl: profile.avatar_url };
    }
  }

  return (
    <>
      <BrowseNav user={navUser} />
      {children}
    </>
  );
}

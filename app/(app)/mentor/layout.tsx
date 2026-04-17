import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MentorSidebar } from "@/components/layout/mentor-sidebar";

export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mentor") {
    redirect("/dashboard");
  }

  const { data: mentor } = await supabase
    .from("mentors")
    .select("headline, verified_at")
    .eq("profile_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-10 lg:px-16 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <MentorSidebar
              name={profile.full_name ?? "Mentor"}
              headline={mentor?.headline ?? null}
              isVerified={!!mentor?.verified_at}
              avatarUrl={profile.avatar_url}
            />
          </aside>

          {/* Main content */}
          <main className="lg:col-span-9 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

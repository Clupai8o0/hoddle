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
      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <MentorSidebar
              name={profile.full_name ?? "Mentor"}
              headline={mentor?.headline ?? null}
              isVerified={!!mentor?.verified_at}
            />
          </aside>

          {/* Main content */}
          <main className="lg:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
}

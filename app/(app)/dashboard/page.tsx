// Phase 1 – §5 Student Dashboard (placeholder until that section is implemented)
// Full dashboard spec: todo.md §5 and docs/design/student_dashboard/

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <main className="min-h-screen bg-surface px-8 py-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-4xl text-primary mb-4">
          Hey {firstName}, welcome to Hoddle.
        </h1>
        <p className="font-body text-on-surface-variant text-lg leading-relaxed">
          Your dashboard is on its way. Mentor recommendations, goal tracking,
          and your personal journey will appear here once Phase 1 is fully
          complete.
        </p>
      </div>
    </main>
  );
}

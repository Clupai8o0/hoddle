import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./profile-edit-form";

export const metadata = { title: "Edit Profile — Hoddle" };

export default async function EditStudentProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: onboarding }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, country_of_origin, university, year_of_study, avatar_url, role")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("onboarding_responses")
      .select("goals, challenges, fields_of_interest")
      .eq("profile_id", user!.id)
      .maybeSingle(),
  ]);

  // Mentors have their own profile edit page
  if (profile?.role === "mentor") redirect("/mentor/profile/edit");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-10 py-8 sm:py-12 lg:py-16 space-y-6 sm:space-y-8">
      <header>
        <Link
          href="/dashboard"
          className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          ← Back to dashboard
        </Link>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mt-6 mb-1">
          Your profile
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Edit Profile</h1>
        <p className="font-body text-on-surface-variant mt-2">
          Update your goals, challenges, and areas of interest so your mentor
          recommendations stay relevant.
        </p>
      </header>

      <ProfileEditForm
        defaultValues={{
          full_name: profile?.full_name ?? "",
          country_of_origin: profile?.country_of_origin ?? "",
          university: profile?.university ?? "",
          year_of_study: profile?.year_of_study ?? 1,
          goals: onboarding?.goals ?? [],
          challenges: onboarding?.challenges ?? [],
          fields_of_interest: onboarding?.fields_of_interest ?? [],
        }}
        currentAvatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}

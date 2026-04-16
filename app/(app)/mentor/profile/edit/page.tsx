import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./edit-profile-form";

export const metadata = { title: "Edit Profile — Hoddle" };

export default async function EditMentorProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: mentor }, { data: profile }] = await Promise.all([
    supabase
      .from("mentors")
      .select("headline, current_position, bio, expertise, hometown, social_links")
      .eq("profile_id", user!.id)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user!.id)
      .single(),
  ]);

  if (!mentor) redirect("/mentor");

  return (
    <div className="space-y-8">
      <header>
        <p className="font-body text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant mb-1">
          Your profile
        </p>
        <h1 className="font-display font-bold text-3xl text-primary">Edit Profile</h1>
        <p className="font-body text-on-surface-variant mt-2">
          This information appears on your public mentor profile.
        </p>
      </header>

      <EditProfileForm
        defaultValues={{
          full_name: profile?.full_name ?? "",
          headline: mentor.headline ?? "",
          current_position: mentor.current_position ?? "",
          bio: mentor.bio ?? "",
          expertise: mentor.expertise ?? [],
          hometown: mentor.hometown ?? "",
          social_links: {
            linkedin: mentor.social_links?.linkedin ?? "",
            twitter: mentor.social_links?.twitter ?? "",
            instagram: mentor.social_links?.instagram ?? "",
            website: mentor.social_links?.website ?? "",
          },
        }}
        currentAvatarUrl={profile?.avatar_url ?? null}
      />
    </div>
  );
}

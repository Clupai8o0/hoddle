import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { createAdminClient } from "@/lib/supabase/admin";
import { EditMentorClient } from "./edit-mentor-client";

export const metadata = { title: "Edit Mentor — Admin — Hoddle" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMentorPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: mentor } = await admin
    .from("mentors")
    .select(
      `profile_id, slug, headline, bio, expertise, hometown,
       current_position, verified_at,
       profiles!mentors_profile_id_fkey(full_name, avatar_url, country_of_origin, university)`,
    )
    .eq("profile_id", id)
    .single();

  if (!mentor) notFound();

  const profile = mentor.profiles as {
    full_name: string | null;
    avatar_url: string | null;
    country_of_origin: string | null;
    university: string | null;
  };

  return (
    <Container className="py-16">
      <div className="max-w-2xl">
        <nav className="font-body text-sm text-on-surface-variant mb-3">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          {" / "}
          <Link
            href="/admin/mentors"
            className="hover:text-primary transition-colors"
          >
            Mentors
          </Link>
          {" / "}
          <Link
            href={`/admin/mentors/${id}`}
            className="hover:text-primary transition-colors"
          >
            {profile.full_name ?? mentor.slug}
          </Link>
          {" / "}
          <span className="text-on-surface">Edit</span>
        </nav>

        <h1 className="font-display text-4xl font-bold text-primary mb-2">
          Edit mentor
        </h1>
        <p className="font-body text-on-surface-variant text-lg mb-10">
          Update {profile.full_name ?? "this mentor"}&apos;s profile details.
        </p>

        <EditMentorClient
          profileId={id}
          defaultValues={{
            full_name: profile.full_name ?? "",
            headline: mentor.headline ?? "",
            current_position: mentor.current_position ?? "",
            bio: mentor.bio ?? "",
            expertise: mentor.expertise ?? [],
            hometown: mentor.hometown ?? "",
            country_of_origin: profile.country_of_origin ?? "",
            university: profile.university ?? "",
            verified: !!mentor.verified_at,
          }}
          currentAvatarUrl={profile.avatar_url}
        />
      </div>
    </Container>
  );
}

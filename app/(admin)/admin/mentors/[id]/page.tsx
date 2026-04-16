import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createAdminClient } from "@/lib/supabase/admin";
import { VerifyMentorButton } from "./verify-mentor-button";

export const metadata = { title: "Mentor Review — Admin — Hoddle" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMentorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: mentor } = await admin
    .from("mentors")
    .select(
      `profile_id, slug, headline, bio, expertise, hometown,
       current_position, verified_at, created_at,
       profiles!mentors_profile_id_fkey(full_name, avatar_url, role, country_of_origin, university)`,
    )
    .eq("profile_id", id)
    .single();

  if (!mentor) notFound();

  const profile = mentor.profiles as {
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    country_of_origin: string | null;
    university: string | null;
  };

  const isVerified = !!mentor.verified_at;

  return (
    <Container className="py-16">
      <nav className="font-body text-sm text-on-surface-variant mb-6">
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
        <span className="text-on-surface">
          {profile.full_name ?? mentor.slug}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left column — profile */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-start gap-5">
            <div className="relative w-16 h-16 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Mentor"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="font-display font-semibold text-xl text-primary">
                  {(profile.full_name ?? "?")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-primary leading-tight">
                {profile.full_name ?? "Unnamed mentor"}
              </h1>
              {mentor.headline && (
                <p className="font-body text-on-surface-variant text-lg mt-1">
                  {mentor.headline}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-secondary bg-secondary-container rounded-full px-3 py-1.5">
                    <CheckCircle size={12} strokeWidth={1.5} aria-hidden="true" />
                    Verified mentor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-on-surface-variant bg-surface-container-highest rounded-full px-3 py-1.5">
                    <Clock size={12} strokeWidth={1.5} aria-hidden="true" />
                    Awaiting verification
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {mentor.bio ? (
            <section>
              <h2 className="font-display font-semibold text-lg text-on-surface mb-3">
                Bio
              </h2>
              <p className="font-body text-on-surface leading-relaxed">
                {mentor.bio}
              </p>
            </section>
          ) : (
            <p className="font-body text-on-surface-variant italic">
              No bio added yet.
            </p>
          )}

          {/* Details grid */}
          <section>
            <h2 className="font-display font-semibold text-lg text-on-surface mb-4">
              Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
              {[
                { label: "Current position", value: mentor.current_position },
                { label: "Hometown", value: mentor.hometown },
                {
                  label: "Country of origin",
                  value: profile.country_of_origin,
                },
                { label: "University", value: profile.university },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="font-body text-xs text-on-surface-variant uppercase tracking-[0.08em] mb-1">
                    {label}
                  </dt>
                  <dd className="font-body text-on-surface">
                    {value ?? (
                      <span className="text-on-surface-variant italic">
                        Not set
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Expertise */}
          {mentor.expertise && mentor.expertise.length > 0 && (
            <section>
              <h2 className="font-display font-semibold text-lg text-on-surface mb-3">
                Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((tag) => (
                  <span
                    key={tag}
                    className="font-body text-sm text-on-surface bg-surface-container rounded-md px-3 py-1.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — actions */}
        <aside>
          <div className="bg-surface-container rounded-xl p-6 sticky top-8">
            <h2 className="font-display font-semibold text-base text-on-surface mb-6">
              Verification
            </h2>

            {isVerified && mentor.verified_at ? (
              <div className="space-y-4">
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  Verified on{" "}
                  {new Date(mentor.verified_at).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  . This mentor appears as verified to students.
                </p>
                <VerifyMentorButton
                  profileId={mentor.profile_id}
                  currentlyVerified={true}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                  Review the profile above, then verify this mentor to make them
                  visible to students.
                </p>
                <VerifyMentorButton
                  profileId={mentor.profile_id}
                  currentlyVerified={false}
                />
              </div>
            )}
          </div>
          <Link
            href={`/admin/mentors/${mentor.profile_id}/edit`}
            className="block mt-4 bg-surface-container rounded-xl p-6 text-center font-body font-medium text-primary hover:bg-primary-container transition-colors"
          >
            Edit profile
          </Link>
        </aside>
      </div>
    </Container>
  );
}

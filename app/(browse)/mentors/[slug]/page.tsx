import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Tag } from "@/components/ui/tag";
import { FollowButton } from "@/components/patterns/follow-button";
import { MessageMentorButton } from "@/components/patterns/messages/message-mentor-button";
import { QuestionForm } from "./question-form";
import { FIELDS_OF_INTEREST } from "@/lib/validation/onboarding";
import { getFollowStatus } from "@/lib/actions/mentor-follows";
import { CheckCircle, MapPin, Briefcase, Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const expertiseLabel = (value: string) =>
  FIELDS_OF_INTEREST.find((f) => f.value === value)?.label ?? value;

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentors")
    .select("headline, profiles!mentors_profile_id_fkey(full_name)")
    .eq("slug", slug)
    .not("verified_at", "is", null)
    .maybeSingle();

  if (!data) return { title: "Mentor — Hoddle" };
  const profile = data.profiles as { full_name: string | null } | null;
  const name = profile?.full_name ?? "Mentor";
  return {
    title: `${name} — Hoddle`,
    description: data.headline ?? undefined,
  };
}

export default async function MentorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch mentor + profile
  const { data: mentor } = await supabase
    .from("mentors")
    .select(
      `profile_id, slug, headline, bio, expertise, hometown, current_position,
       verified_at, accepting_questions,
       profiles!mentors_profile_id_fkey (
         full_name, avatar_url, university, country_of_origin
       )`
    )
    .eq("slug", slug)
    .not("verified_at", "is", null)
    .maybeSingle();

  if (!mentor) notFound();

  const profile = mentor.profiles as {
    full_name: string | null;
    avatar_url: string | null;
    university: string | null;
    country_of_origin: string | null;
  } | null;

  const name = profile?.full_name ?? "Mentor";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  // Fetch current user to check follow status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch published content, upcoming session, and follow status in parallel
  const now = new Date().toISOString();
  const [{ data: contentItems }, { data: upcomingSession }, isFollowing] = await Promise.all([
    supabase
      .from("content_items")
      .select("id, type, title, slug, excerpt, published_at, view_count")
      .eq("mentor_id", mentor.profile_id)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(6),
    supabase
      .from("live_sessions")
      .select("id, title, scheduled_at, duration_minutes, description")
      .eq("mentor_id", mentor.profile_id)
      .eq("status", "scheduled")
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    user ? getFollowStatus(mentor.profile_id) : Promise.resolve(false),
  ]);

  const nextSession = upcomingSession ?? null;

  return (
    <Container className="py-12 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">
        {/* ── Left column ── */}
        <div>
          {/* Hero: avatar + identity */}
          <div className="flex flex-col sm:flex-row gap-7 mb-10">
            {/* Avatar */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-primary-container flex-shrink-0 flex items-center justify-center shadow-ambient">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 112px, 144px"
                  priority
                />
              ) : (
                <Image
                  src="/images/mentor-avatar-placeholder.webp"
                  alt="Mentor profile photo"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 112px, 144px"
                />
              )}
            </div>

            {/* Identity */}
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-3xl font-bold text-primary leading-tight">
                  {name}
                </h1>
                {mentor.verified_at && (
                  <span className="inline-flex items-center gap-1 bg-secondary text-on-secondary rounded-full px-2.5 py-1 text-[11px] font-body font-semibold">
                    <CheckCircle size={11} strokeWidth={2} aria-hidden="true" />
                    Verified
                  </span>
                )}
              </div>
              {user && (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <FollowButton
                    mentorProfileId={mentor.profile_id}
                    initialFollowing={isFollowing}
                  />
                  <MessageMentorButton
                    mentorProfileId={mentor.profile_id}
                    mentorName={name}
                  />
                </div>
              )}
              {mentor.headline && (
                <p className="font-body text-base text-on-surface-variant leading-snug max-w-md">
                  {mentor.headline}
                </p>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-1">
                {profile?.university && (
                  <span className="inline-flex items-center gap-1.5 font-body text-sm text-on-surface-variant">
                    <Briefcase size={13} strokeWidth={1.5} aria-hidden="true" />
                    {profile.university}
                  </span>
                )}
                {mentor.hometown && (
                  <span className="inline-flex items-center gap-1.5 font-body text-sm text-on-surface-variant">
                    <MapPin size={13} strokeWidth={1.5} aria-hidden="true" />
                    {mentor.hometown}
                  </span>
                )}
                {mentor.current_position && (
                  <span className="inline-flex items-center gap-1.5 font-body text-sm text-on-surface-variant">
                    <Briefcase size={13} strokeWidth={1.5} aria-hidden="true" />
                    {mentor.current_position}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expertise chips */}
          {mentor.expertise.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                Areas of expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((tag) => (
                  <Tag key={tag} variant="default">
                    {expertiseLabel(tag)}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {mentor.bio && (
            <div className="mb-12">
              <h2 className="font-display text-xl font-bold text-primary mb-4">
                My story
              </h2>
              <div className="font-body text-base text-on-surface leading-relaxed whitespace-pre-line">
                {mentor.bio}
              </div>
            </div>
          )}

          {/* Published content */}
          {contentItems && contentItems.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold text-primary mb-6">
                Published content
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contentItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/content/${item.slug}`}
                    className="group flex flex-col gap-2 p-5 rounded-xl bg-surface-container-lowest hover:shadow-ambient hover:-translate-y-px transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span className="font-body text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      {item.type}
                    </span>
                    <p className="font-display font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    {item.excerpt && (
                      <p className="font-body text-sm text-on-surface-variant line-clamp-2">
                        {item.excerpt}
                      </p>
                    )}
                    {item.view_count > 0 && (
                      <p className="font-body text-xs text-on-surface-variant mt-auto pt-1">
                        {item.view_count.toLocaleString()} views
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <aside className="flex flex-col gap-6">
          {/* Upcoming session card */}
          {nextSession ? (
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-ambient">
              <h2 className="font-display text-base font-bold text-primary mb-4">
                Upcoming Q&amp;A session
              </h2>
              <p className="font-display font-semibold text-on-surface mb-1">
                {nextSession.title}
              </p>
              <div className="flex items-center gap-1.5 mb-3">
                <Calendar size={13} strokeWidth={1.5} className="text-on-surface-variant" aria-hidden="true" />
                <span className="font-body text-sm text-on-surface-variant">
                  {formatSessionDate(nextSession.scheduled_at)}
                </span>
                <span className="font-body text-sm text-on-surface-variant">
                  · {nextSession.duration_minutes} min
                </span>
              </div>
              {nextSession.description && (
                <p className="font-body text-sm text-on-surface-variant leading-snug mb-5 line-clamp-3">
                  {nextSession.description}
                </p>
              )}

              {/* Question form */}
              {mentor.accepting_questions && (
                <div>
                  <p className="font-body text-sm font-medium text-on-surface mb-3">
                    Submit a question for this session
                  </p>
                  {user ? (
                    <QuestionForm sessionId={nextSession.id} />
                  ) : (
                    <Link
                      href="/login"
                      className="block w-full text-center font-body text-sm font-semibold text-primary border border-primary/30 rounded-xl py-3 hover:bg-primary-container transition-colors"
                    >
                      Sign in to ask a question
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-container-lowest p-6">
              <h2 className="font-display text-base font-bold text-primary mb-2">
                Live sessions
              </h2>
              <p className="font-body text-sm text-on-surface-variant">
                No upcoming sessions scheduled yet. Check back soon.
              </p>
            </div>
          )}

          {/* Back to mentors */}
          <Link
            href="/mentors"
            className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors text-center"
          >
            ← Back to all mentors
          </Link>
        </aside>
      </div>
    </Container>
  );
}

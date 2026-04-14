import Link from "next/link";
import { UserPlus, CheckCircle, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Mentors — Admin — Hoddle" };

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminMentorsPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const showPending = filter === "pending";

  const admin = createAdminClient();

  const [mentorsResult, invitesResult] = await Promise.all([
    admin
      .from("mentors")
      .select(
        `profile_id, slug, headline, verified_at, created_at,
         profiles(full_name, avatar_url, role)`,
      )
      .order("created_at", { ascending: false }),
    admin
      .from("mentor_invites")
      .select("id, email, accepted_at, expires_at, created_at")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const mentors = mentorsResult.data ?? [];
  const pendingInvites = invitesResult.data ?? [];

  return (
    <Container className="py-16">
      <pre className="mb-4 p-3 bg-yellow-100 text-yellow-900 text-xs rounded">
        DEBUG v3 | mentors: {mentors.length} | error: {mentorsResult.error ? JSON.stringify(mentorsResult.error) : "none"}
      </pre>
      {mentorsResult.error && (
        <pre className="mb-6 p-4 bg-red-50 text-red-800 text-xs rounded overflow-auto">
          {JSON.stringify(mentorsResult.error, null, 2)}
        </pre>
      )}
      <header className="flex items-start justify-between mb-10">
        <div>
          <nav className="font-body text-sm text-on-surface-variant mb-3">
            <Link href="/admin" className="hover:text-primary transition-colors">
              Admin
            </Link>
            {" / "}
            <span className="text-on-surface">Mentors</span>
          </nav>
          <h1 className="font-display text-4xl font-bold text-primary">
            Mentors
          </h1>
        </div>
        <Button variant="primary" size="default" asChild>
          <Link href="/admin/mentors/invite">
            <UserPlus size={16} strokeWidth={1.5} aria-hidden="true" />
            Invite mentor
          </Link>
        </Button>
      </header>

      {/* Tab strip */}
      <div className="flex gap-1 mb-8 bg-surface-container-low rounded-lg p-1 w-fit">
        <Link
          href="/admin/mentors"
          className={`font-body text-sm font-medium px-4 py-2 rounded-md transition-colors ${
            !showPending
              ? "bg-surface text-primary shadow-ambient"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          All mentors ({mentors.length})
        </Link>
        <Link
          href="/admin/mentors?filter=pending"
          className={`font-body text-sm font-medium px-4 py-2 rounded-md transition-colors ${
            showPending
              ? "bg-surface text-primary shadow-ambient"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Pending invites ({pendingInvites.length})
        </Link>
      </div>

      {showPending ? (
        <PendingInvitesTable invites={pendingInvites} />
      ) : (
        <MentorsTable mentors={mentors} />
      )}
    </Container>
  );
}

// ---------------------------------------------------------------------------

type MentorRow = {
  profile_id: string;
  slug: string;
  headline: string | null;
  verified_at: string | null;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null; role: string } | null;
};

function MentorsTable({ mentors }: { mentors: MentorRow[] }) {
  if (mentors.length === 0) {
    return (
      <p className="font-body text-on-surface-variant text-center py-16">
        No mentors yet. Invite the first one.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {mentors.map((mentor) => (
        <Link
          key={mentor.profile_id}
          href={`/admin/mentors/${mentor.profile_id}`}
          className="group flex items-center justify-between bg-surface-container rounded-xl px-6 py-5 transition-all duration-200 hover:shadow-ambient hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
              <span className="font-display font-semibold text-sm text-primary">
                {(mentor.profiles?.full_name ?? "?")[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-body font-medium text-on-surface group-hover:text-primary transition-colors">
                {mentor.profiles?.full_name ?? "Unnamed mentor"}
              </p>
              {mentor.headline && (
                <p className="font-body text-sm text-on-surface-variant">
                  {mentor.headline}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mentor.verified_at ? (
              <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-secondary bg-secondary-container rounded-full px-3 py-1.5">
                <CheckCircle size={12} strokeWidth={1.5} aria-hidden="true" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-on-surface-variant bg-surface-container-highest rounded-full px-3 py-1.5">
                <Clock size={12} strokeWidth={1.5} aria-hidden="true" />
                Unverified
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

type InviteRow = {
  id: string;
  email: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

function PendingInvitesTable({ invites }: { invites: InviteRow[] }) {
  if (invites.length === 0) {
    return (
      <p className="font-body text-on-surface-variant text-center py-16">
        No pending invites.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => {
        const expiresDate = new Date(invite.expires_at).toLocaleDateString(
          "en-AU",
          { day: "numeric", month: "short", year: "numeric" },
        );
        return (
          <div
            key={invite.id}
            className="flex items-center justify-between bg-surface-container rounded-xl px-6 py-5"
          >
            <div>
              <p className="font-body font-medium text-on-surface">
                {invite.email}
              </p>
              <p className="font-body text-sm text-on-surface-variant">
                Expires {expiresDate}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-on-surface-variant bg-surface-container-highest rounded-full px-3 py-1.5">
              <Clock size={12} strokeWidth={1.5} aria-hidden="true" />
              Pending
            </span>
          </div>
        );
      })}
    </div>
  );
}

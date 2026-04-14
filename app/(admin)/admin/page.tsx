import Link from "next/link";
import { Users, UserPlus, Clock, BookOpen } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin — Hoddle" };

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [
    { count: pendingInvites },
    { count: unverifiedMentors },
    { count: pendingStories },
  ] = await Promise.all([
    supabase
      .from("mentor_invites")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("mentors")
      .select("profile_id", { count: "exact", head: true })
      .is("verified_at", null),
    supabase
      .from("success_stories")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const cards = [
    {
      href: "/admin/mentors",
      icon: Users,
      label: "All mentors",
      description: "Review profiles and manage verification status.",
      badge: unverifiedMentors ?? 0,
      badgeLabel: "awaiting verification",
    },
    {
      href: "/admin/mentors/invite",
      icon: UserPlus,
      label: "Invite a mentor",
      description: "Send a token-gated signup link to a prospective mentor.",
      badge: null,
      badgeLabel: null,
    },
    {
      href: "/admin/mentors?filter=pending",
      icon: Clock,
      label: "Pending invites",
      description: "Invites sent but not yet accepted.",
      badge: pendingInvites ?? 0,
      badgeLabel: "outstanding",
    },
    {
      href: "/admin/stories",
      icon: BookOpen,
      label: "Success stories",
      description: "Review and approve student story submissions.",
      badge: pendingStories ?? 0,
      badgeLabel: "awaiting review",
    },
  ];

  return (
    <Container className="py-16">
      <header className="mb-12">
        <h1 className="font-display text-4xl font-bold text-primary mb-2">
          Admin
        </h1>
        <p className="font-body text-on-surface-variant text-lg">
          Manage mentor invitations, verification, and content moderation.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(({ href, icon: Icon, label, description, badge, badgeLabel }) => (
          <Link
            key={href}
            href={href}
            className="group block bg-surface-container rounded-xl p-8 transition-all duration-200 hover:shadow-ambient hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-11 h-11 rounded-lg bg-primary-container flex items-center justify-center">
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="text-primary"
                  aria-hidden="true"
                />
              </div>
              {badge !== null && badge > 0 && (
                <span className="font-body text-xs font-semibold text-on-secondary bg-secondary rounded-full px-2.5 py-1">
                  {badge} {badgeLabel}
                </span>
              )}
            </div>
            <h2 className="font-display font-semibold text-xl text-on-surface mb-2 group-hover:text-primary transition-colors">
              {label}
            </h2>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              {description}
            </p>
          </Link>
        ))}
      </div>
    </Container>
  );
}

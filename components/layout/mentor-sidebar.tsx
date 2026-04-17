"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Inbox,
  UserCog,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/mentor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/mentor/content", label: "My Content", icon: FileText, exact: false },
  { href: "/mentor/sessions", label: "Sessions", icon: Calendar, exact: false },
  { href: "/mentor/inbox", label: "Inbox", icon: Inbox, exact: false },
  { href: "/mentor/profile/edit", label: "Edit Profile", icon: UserCog, exact: false },
];

interface MentorSidebarProps {
  name: string;
  headline: string | null;
  isVerified: boolean;
  avatarUrl?: string | null;
}

export function MentorSidebar({ name, headline, isVerified, avatarUrl }: MentorSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="lg:sticky lg:top-[72px] flex flex-col gap-2">
      {/* Identity — hidden on mobile to avoid duplicating AppNav */}
      <div className="hidden lg:block bg-surface-container rounded-xl p-5 mb-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="font-display font-semibold text-sm text-primary">
                {name[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-body font-semibold text-sm text-on-surface truncate">
              {name}
            </p>
            {headline && (
              <p className="font-body text-xs text-on-surface-variant truncate leading-snug mt-0.5">
                {headline}
              </p>
            )}
          </div>
        </div>
        {isVerified ? (
          <div className="flex items-center gap-1.5 font-body text-xs font-semibold text-secondary">
            <CheckCircle size={12} strokeWidth={1.5} aria-hidden="true" />
            Verified mentor
          </div>
        ) : (
          <p className="font-body text-xs text-on-surface-variant">
            Awaiting verification
          </p>
        )}
      </div>

      {/* Nav links — horizontal scroll tab bar on mobile, vertical list on desktop */}
      <nav
        aria-label="Mentor navigation"
        className={cn(
          // Mobile: horizontal scrolling tab strip
          "flex flex-row gap-1 overflow-x-auto -mx-1 px-1 pb-1",
          // Desktop: vertical stack
          "lg:flex-col lg:gap-0 lg:overflow-visible lg:mx-0 lg:px-0 lg:pb-0",
        )}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href) && !(exact && pathname !== href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg font-body text-sm font-medium transition-colors duration-150 whitespace-nowrap",
                "px-3 py-2 lg:px-4 lg:py-3 lg:gap-3",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                isActive
                  ? "bg-primary-container text-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                className={isActive ? "text-primary" : "text-on-surface-variant"}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

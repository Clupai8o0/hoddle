"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { GlassNav, NavLink } from "@/components/layout/glass-nav";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { signOut } from "@/lib/actions/auth";

export interface BrowseNavProps {
  user: {
    name: string;
    avatarUrl?: string | null;
    userId: string;
    unreadCount: number;
  } | null;
}

/**
 * Nav for public (browse) pages — forums, stories, content.
 * Renders the same links as AppNav but gracefully handles unauthenticated visitors.
 */
export function BrowseNav({ user }: BrowseNavProps) {
  const pathname = usePathname();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <GlassNav
      brand={
        <Link
          href={user ? "/dashboard" : "/"}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
          aria-label="Hoddle"
        >
          <Image
            src="/logo-light.png"
            alt="Hoddle"
            width={56}
            height={56}
            className="object-contain w-10 h-10 sm:w-14 sm:h-14"
            priority
          />
        </Link>
      }
      links={
        <>
          {user ? (
            <>
              <NavLink href="/dashboard" active={pathname === "/dashboard"}>
                Dashboard
              </NavLink>
              <NavLink href="/mentors" active={pathname.startsWith("/mentors")}>
                Mentors
              </NavLink>
              <NavLink href="/content" active={pathname.startsWith("/content")}>
                Library
              </NavLink>
              <NavLink href="/forums" active={pathname.startsWith("/forums")}>
                Forums
              </NavLink>
              <NavLink href="/stories" active={pathname.startsWith("/stories")}>
                Stories
              </NavLink>
              <NavLink href="/sessions" active={pathname.startsWith("/sessions")}>
                Sessions
              </NavLink>
              <NavLink href="/messages" active={pathname.startsWith("/messages")}>
                Messages
              </NavLink>
              <NavLink href="/search" active={pathname.startsWith("/search")}>
                Search
              </NavLink>
            </>
          ) : (
            <>
              <NavLink href="/about" active={pathname === "/about"}>
                About
              </NavLink>
              <NavLink href="/mentors" active={pathname.startsWith("/mentors")}>
                Mentors
              </NavLink>
              <NavLink href="/forums" active={pathname.startsWith("/forums")}>
                Forums
              </NavLink>
              <NavLink href="/stories" active={pathname.startsWith("/stories")}>
                Stories
              </NavLink>
              <NavLink href="/sessions" active={pathname.startsWith("/sessions")}>
                Sessions
              </NavLink>
            </>
          )}
        </>
      }
      actions={
        user ? (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search — hidden on mobile, available via the mobile menu */}
            <Link
              href="/search"
              aria-label="Search"
              className={`hidden md:flex items-center justify-center w-8 h-8 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm ${
                pathname.startsWith("/search")
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Search size={17} strokeWidth={1.5} />
            </Link>

            {/* Notification bell */}
            <NotificationBell
              userId={user.userId}
              initialUnreadCount={user.unreadCount}
            />

            {/* User identity */}
            <div className="flex items-center gap-2.5">
              <Avatar
                name={user.name}
                src={user.avatarUrl ?? undefined}
                size="sm"
              />
              <span className="font-body text-sm font-medium text-on-surface hidden md:block">
                {firstName}
              </span>
            </div>

            {/* Sign out — hidden on mobile, available via the mobile menu footer */}
            <form action={signOut} className="hidden md:block">
              <button
                type="submit"
                className="flex items-center gap-1.5 font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
                aria-label="Sign out"
              >
                <LogOut size={15} strokeWidth={1.5} />
                <span className="hidden lg:block">Sign out</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Join free</Link>
            </Button>
          </div>
        )
      }
      mobileMenuFooter={
        user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                name={user.name}
                src={user.avatarUrl ?? undefined}
                size="sm"
              />
              <span className="font-body text-sm font-medium text-on-surface truncate">
                {firstName}
              </span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm px-3 py-2"
              >
                <LogOut size={15} strokeWidth={1.5} />
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="flex-1">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="flex-1">
              <Link href="/signup">Join free</Link>
            </Button>
          </div>
        )
      }
    />
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { GlassNav, NavLink } from "@/components/layout/glass-nav";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

export interface BrowseNavProps {
  user: { name: string; avatarUrl?: string | null } | null;
}

/**
 * Nav for public (browse) pages — forums, stories.
 * Renders the same links as AppNav but gracefully handles unauthenticated visitors.
 */
export function BrowseNav({ user }: BrowseNavProps) {
  const pathname = usePathname();

  return (
    <GlassNav
      brand={
        <Link
          href={user ? "/dashboard" : "/"}
          className="font-display font-bold text-xl text-primary tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
        >
          Hoddle
        </Link>
      }
      links={
        <>
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
        </>
      }
      actions={
        user ? (
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
            >
              <Avatar name={user.name} src={user.avatarUrl ?? undefined} size="sm" />
              <span className="font-body text-sm font-medium text-on-surface hidden sm:block">
                {user.name.split(" ")[0]}
              </span>
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
                aria-label="Sign out"
              >
                <LogOut size={15} strokeWidth={1.5} />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Join free</Link>
            </Button>
          </div>
        )
      }
    />
  );
}

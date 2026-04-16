"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { GlassNav, NavLink } from "@/components/layout/glass-nav";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { signOut } from "@/lib/actions/auth";

export interface AppNavProps {
  userName: string;
  avatarUrl?: string | null;
  userId: string;
  initialUnreadCount?: number;
  initialUnreadMessageCount?: number;
}

export function AppNav({
  userName,
  avatarUrl,
  userId,
  initialUnreadCount = 0,
  initialUnreadMessageCount = 0,
}: AppNavProps) {
  const activePath = usePathname();
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <GlassNav
      brand={
        <Link
          href="/dashboard"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
          aria-label="Hoddle dashboard"
        >
          <Image
            src="/logo-light.png"
            alt="Hoddle"
            width={56}
            height={56}
            className="object-contain"
            priority
          />
        </Link>
      }
      links={
        <>
          <NavLink href="/dashboard" active={activePath === "/dashboard"}>
            Dashboard
          </NavLink>
          <NavLink href="/mentors" active={activePath.startsWith("/mentors")}>
            Mentors
          </NavLink>
          <NavLink href="/content" active={activePath.startsWith("/content")}>
            Library
          </NavLink>
          <NavLink href="/forums" active={activePath.startsWith("/forums")}>
            Forums
          </NavLink>
          <NavLink href="/stories" active={activePath.startsWith("/stories")}>
            Stories
          </NavLink>
          <NavLink href="/sessions" active={activePath.startsWith("/sessions")}>
            Sessions
          </NavLink>
          <NavLink href="/messages" active={activePath.startsWith("/messages")}>
            Messages
            {initialUnreadMessageCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center bg-primary text-on-primary text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {initialUnreadMessageCount > 99 ? "99+" : initialUnreadMessageCount}
              </span>
            )}
          </NavLink>
        </>
      }
      actions={
        <div className="flex items-center gap-4">
          {/* Search */}
          <Link
            href="/search"
            aria-label="Search"
            className={`flex items-center justify-center w-8 h-8 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm ${
              activePath.startsWith("/search")
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Search size={17} strokeWidth={1.5} />
          </Link>

          {/* Notification bell */}
          <NotificationBell userId={userId} initialUnreadCount={initialUnreadCount} />

          {/* User identity */}
          <div className="flex items-center gap-2.5">
            <Avatar
              name={userName}
              src={avatarUrl ?? undefined}
              size="sm"
            />
            <span className="font-body text-sm font-medium text-on-surface hidden sm:block">
              {firstName}
            </span>
          </div>

          {/* Sign out — server action via form */}
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
      }
    />
  );
}

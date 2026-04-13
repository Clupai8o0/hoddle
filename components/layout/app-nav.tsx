import Link from "next/link";
import { LogOut } from "lucide-react";
import { GlassNav, NavLink } from "@/components/layout/glass-nav";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/actions/auth";

export interface AppNavProps {
  userName: string;
  avatarUrl?: string | null;
  /** Current pathname to derive the active nav link */
  activePath?: string;
}

export function AppNav({ userName, avatarUrl, activePath = "/dashboard" }: AppNavProps) {
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <GlassNav
      brand={
        <Link
          href="/dashboard"
          className="font-display font-bold text-xl text-primary tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
        >
          Hoddle
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
          <NavLink href="/sessions" active={activePath.startsWith("/sessions")}>
            Sessions
          </NavLink>
        </>
      }
      actions={
        <div className="flex items-center gap-4">
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

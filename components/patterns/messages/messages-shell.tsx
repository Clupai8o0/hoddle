"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * Client wrapper that decides which messages pane is visible on mobile.
 *
 * Desktop (md+): always renders the sidebar + main pane side-by-side.
 * Mobile: shows the sidebar on `/messages` (conversation index) and the
 *   main pane on `/messages/:id` or `/messages/new`.
 */
export function MessagesShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const inConversation =
    pathname !== "/messages" && pathname.startsWith("/messages");

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface">
      <aside
        className={cn(
          "w-full md:w-72 shrink-0 flex-col border-r border-surface-container overflow-y-auto",
          inConversation ? "hidden md:flex" : "flex",
        )}
      >
        {sidebar}
      </aside>
      <main
        className={cn(
          "flex-1 flex-col overflow-hidden",
          inConversation ? "flex" : "hidden md:flex",
        )}
      >
        {children}
      </main>
    </div>
  );
}

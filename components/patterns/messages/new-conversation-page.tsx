"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { getOrCreateConversation } from "@/lib/actions/messages";
import type { ChatParticipant } from "@/lib/types/messages";

export interface NewConversationPageProps {
  currentUserRole: "student" | "mentor" | "admin";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role: ChatParticipant["role"]): string {
  if (role === "mentor") return "Mentor";
  if (role === "admin") return "Admin";
  return "Student";
}

export function NewConversationPage({
  currentUserRole,
}: NewConversationPageProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatParticipant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const searchableRoles: ChatParticipant["role"][] =
    currentUserRole === "student"
      ? ["mentor", "admin"]
      : ["mentor", "student", "admin"];

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .ilike("full_name", `%${val.trim()}%`)
        .in("role", searchableRoles)
        .limit(8);

      setResults((data as ChatParticipant[] | null) ?? []);
      setIsSearching(false);
    }, 300);
  }

  function handleSelect(profile: ChatParticipant) {
    setError(null);
    startTransition(async () => {
      const result = await getOrCreateConversation({
        otherProfileId: profile.id,
      });
      if (result.ok) {
        router.push(`/messages/${result.data.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  const showEmptyState = !isSearching && query.trim() && results.length === 0;
  const showResults = results.length > 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-on-surface">
            New conversation
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            {currentUserRole === "student"
              ? "Search for a mentor by name to start a conversation"
              : "Search for a student or mentor by name"}
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            <Search size={16} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder={
              currentUserRole === "student"
                ? "Search mentors…"
                : "Search users…"
            }
            aria-label="Search for a user to message"
            autoFocus
            className="w-full pl-9 pr-4 py-3 bg-surface-container-low rounded-xl font-body text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition"
          />
        </div>

        {/* Spinner */}
        {isSearching && (
          <div
            className="flex items-center justify-center gap-1.5 mt-6"
            aria-live="polite"
            aria-label="Searching"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        )}

        {/* Results */}
        {showResults && !isSearching && (
          <ul
            className="mt-3 flex flex-col"
            aria-label="Search results"
            aria-live="polite"
          >
            {results.map((profile) => {
              const name = profile.full_name ?? "Unknown";
              const initials = getInitials(profile.full_name);

              return (
                <li key={profile.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(profile)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-container-low transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                      {profile.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-sm font-bold text-on-surface-variant select-none">
                          {initials}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col min-w-0">
                      <span className="font-body text-sm font-semibold text-on-surface truncate">
                        {name}
                      </span>
                      <span className="font-body text-xs text-on-surface-variant">
                        {roleLabel(profile.role)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Empty state */}
        {showEmptyState && !isSearching && (
          <p
            className="font-body text-sm text-on-surface-variant text-center mt-6"
            aria-live="polite"
          >
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        {/* Idle empty state */}
        {!query && !isSearching && (
          <p className="font-body text-sm text-on-surface-variant text-center mt-6">
            {currentUserRole === "student"
              ? "Search for a mentor by name to start a conversation"
              : "Search for a student or mentor by name"}
          </p>
        )}

        {/* Error */}
        {error && (
          <p
            className="font-body text-sm text-on-surface-variant text-center mt-4"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

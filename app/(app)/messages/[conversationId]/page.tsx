import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/actions/messages";
import { ConversationClient } from "@/components/patterns/messages/conversation-client";
import type { ChatParticipant } from "@/lib/types/messages";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function untyped(client: unknown): SupabaseClient<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as SupabaseClient<any>;
}

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: convoRaw } = await untyped(supabase)
    .from("conversations")
    .select("id, participant_one, participant_two")
    .eq("id", conversationId)
    .maybeSingle();

  const convo = convoRaw as {
    id: string;
    participant_one: string;
    participant_two: string;
  } | null;

  if (!convo) notFound();

  const otherParticipantId =
    convo.participant_one === user.id
      ? convo.participant_two
      : convo.participant_one;

  // Fetch both participants' profiles in parallel
  const [{ data: currentProfile }, { data: otherProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .eq("id", otherParticipantId)
      .single(),
  ]);

  if (!otherProfile) notFound();

  const messagesResult = await getMessages({ conversationId, limit: 30 });
  const { messages: initialMessages, hasMore } = messagesResult.ok
    ? messagesResult.data
    : { messages: [], hasMore: false };

  const currentUserProfile: ChatParticipant = {
    id: user.id,
    full_name: currentProfile?.full_name ?? null,
    avatar_url: currentProfile?.avatar_url ?? null,
    role: (currentProfile?.role ?? "student") as "student" | "mentor" | "admin",
  };

  const otherParticipant: ChatParticipant = {
    id: otherProfile.id,
    full_name: otherProfile.full_name,
    avatar_url: otherProfile.avatar_url,
    role: otherProfile.role as "student" | "mentor" | "admin",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-container flex items-center gap-3 bg-surface">
        <Link
          href="/messages"
          className="md:hidden flex items-center justify-center w-9 h-9 -ml-1 rounded-sm text-on-surface-variant hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
        </Link>
        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center font-display text-sm font-bold text-on-surface-variant shrink-0">
          {otherProfile.full_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-on-surface truncate">
            {otherProfile.full_name ?? "Unknown"}
          </p>
          <p className="font-body text-xs text-on-surface-variant capitalize">
            {otherProfile.role}
          </p>
        </div>
      </div>

      {/* Shared state: realtime + optimistic updates live here */}
      <ConversationClient
        conversationId={conversationId}
        initialMessages={initialMessages}
        initialHasMore={hasMore}
        currentUserId={user.id}
        currentUserProfile={currentUserProfile}
        otherParticipant={otherParticipant}
      />
    </div>
  );
}

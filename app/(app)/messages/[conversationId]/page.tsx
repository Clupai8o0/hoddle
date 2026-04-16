import { redirect, notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/lib/actions/messages";
import { MessageThread } from "@/components/patterns/messages/message-thread";
import { ComposeInput } from "@/components/patterns/messages/compose-input";
import type { ChatParticipant } from "@/lib/types/messages";

/**
 * Escape hatch for tables not yet reflected in database.types.ts.
 * Remove once types are regenerated after migration.
 */
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

  // conversations table is not yet in generated types — use untyped helper as in lib/actions/messages.ts
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

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", otherParticipantId)
    .single();

  if (!otherProfile) notFound();

  const messagesResult = await getMessages({ conversationId, limit: 30 });
  const { messages: initialMessages, hasMore } = messagesResult.ok
    ? messagesResult.data
    : { messages: [], hasMore: false };

  const otherParticipant: ChatParticipant = {
    id: otherProfile.id,
    full_name: otherProfile.full_name,
    avatar_url: otherProfile.avatar_url,
    role: otherProfile.role as "student" | "mentor" | "admin",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-container flex items-center gap-3 bg-surface">
        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center font-display text-sm font-bold text-on-surface-variant">
          {otherProfile.full_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-body text-sm font-semibold text-on-surface">
            {otherProfile.full_name ?? "Unknown"}
          </p>
          <p className="font-body text-xs text-on-surface-variant capitalize">
            {otherProfile.role}
          </p>
        </div>
      </div>

      {/* Messages */}
      <MessageThread
        conversationId={conversationId}
        initialMessages={initialMessages}
        currentUserId={user.id}
        otherParticipant={otherParticipant}
        hasMore={hasMore}
      />

      {/* Compose */}
      <ComposeInput conversationId={conversationId} />
    </div>
  );
}

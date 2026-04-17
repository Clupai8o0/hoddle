import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "@/components/patterns/messages/conversation-list";
import { MessagesShell } from "@/components/patterns/messages/messages-shell";
import { getConversations } from "@/lib/actions/messages";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const convsResult = await getConversations({ limit: 20 });
  const conversations = convsResult.ok ? convsResult.data.conversations : [];

  return (
    <MessagesShell
      sidebar={
        <>
          <div className="px-5 py-5 border-b border-surface-container">
            <h1 className="font-display text-xl font-bold text-primary">
              Messages
            </h1>
          </div>
          <ConversationList
            initialConversations={conversations}
            currentUserId={user.id}
          />
        </>
      }
    >
      {children}
    </MessagesShell>
  );
}

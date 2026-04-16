import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "@/components/patterns/messages/conversation-list";
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-surface-container overflow-y-auto">
        <div className="px-5 py-5 border-b border-surface-container">
          <h1 className="font-display text-xl font-bold text-primary">
            Messages
          </h1>
        </div>
        <ConversationList
          initialConversations={conversations}
          currentUserId={user.id}
        />
      </aside>
      {/* Conversation pane */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

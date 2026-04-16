import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewConversationPage } from "@/components/patterns/messages/new-conversation-page";

export default async function NewMessagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h2 className="font-display text-2xl font-bold text-primary mb-6">
          New conversation
        </h2>
        <NewConversationPage
          currentUserRole={
            (profile?.role ?? "student") as "student" | "mentor" | "admin"
          }
        />
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { FeedbackWidget } from "@/components/patterns/feedback-widget";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      {children}
      {user && <FeedbackWidget />}
    </>
  );
}

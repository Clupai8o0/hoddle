import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { PreferencesForm } from "./preferences-form";

export const metadata = { title: "Notification preferences — Hoddle" };

export default async function NotificationPreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_enabled, in_app_enabled, types_muted")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <Container className="py-10 sm:py-16 max-w-2xl">
      <div className="mb-8 sm:mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary mb-2">
          Notification preferences
        </h1>
        <p className="font-body text-on-surface-variant">
          Choose what you hear about and how.
        </p>
      </div>

      <PreferencesForm
        emailEnabled={prefs?.email_enabled ?? true}
        inAppEnabled={prefs?.in_app_enabled ?? true}
        typesMuted={(prefs?.types_muted as string[]) ?? []}
      />
    </Container>
  );
}

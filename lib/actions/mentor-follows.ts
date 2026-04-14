"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/actions/notifications";
import { revalidatePath } from "next/cache";

// ── Toggle follow ──────────────────────────────────────────────────────────────

export async function toggleFollow(
  mentorProfileId: string,
): Promise<{ ok: true; following: boolean } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Can't follow yourself
  if (user.id === mentorProfileId) {
    return { ok: false, error: "You can't follow yourself." };
  }

  const { data: existing } = await supabase
    .from("mentor_follows")
    .select("mentor_id")
    .eq("follower_id", user.id)
    .eq("mentor_id", mentorProfileId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("mentor_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("mentor_id", mentorProfileId);
    revalidatePath(`/mentors`);
    return { ok: true, following: false };
  } else {
    await supabase.from("mentor_follows").insert({
      follower_id: user.id,
      mentor_id: mentorProfileId,
    });
    revalidatePath(`/mentors`);
    return { ok: true, following: true };
  }
}

// ── Check follow status ────────────────────────────────────────────────────────

export async function getFollowStatus(
  mentorProfileId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("mentor_follows")
    .select("mentor_id")
    .eq("follower_id", user.id)
    .eq("mentor_id", mentorProfileId)
    .maybeSingle();

  return !!data;
}

// ── Notify followers when new content is published ─────────────────────────────

export async function notifyFollowersOfContent(
  mentorProfileId: string,
  contentTitle: string,
  contentSlug: string,
  mentorName: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: followers } = await supabase
    .from("mentor_follows")
    .select("follower_id")
    .eq("mentor_id", mentorProfileId);

  if (!followers || followers.length === 0) return;

  for (const { follower_id } of followers) {
    void notify(follower_id, "new_content_from_mentor_you_follow", {
      mentor_name: mentorName,
      content_title: contentTitle,
      content_slug: contentSlug,
    });
  }
}

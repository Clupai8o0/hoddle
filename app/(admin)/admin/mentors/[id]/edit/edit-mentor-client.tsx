"use client";

import { AdminMentorForm } from "../../admin-mentor-form";

interface EditMentorClientProps {
  profileId: string;
  defaultValues: {
    full_name: string;
    headline: string;
    current_position: string;
    bio: string;
    expertise: string[];
    hometown: string;
    country_of_origin: string;
    university: string;
    verified: boolean;
  };
  currentAvatarUrl: string | null;
}

export function EditMentorClient({
  profileId,
  defaultValues,
  currentAvatarUrl,
}: EditMentorClientProps) {
  return (
    <AdminMentorForm
      mode="edit"
      profileId={profileId}
      defaultValues={defaultValues}
      currentAvatarUrl={currentAvatarUrl}
    />
  );
}

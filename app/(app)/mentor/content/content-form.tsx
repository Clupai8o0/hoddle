"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentItemSchema, type ContentItemInput } from "@/lib/validation/content-item";
import { createContentItem, updateContentItem, publishContentItem, unpublishContentItem } from "@/lib/actions/content-items";
import { TiptapEditor } from "@/components/patterns/tiptap-editor";
import { Button } from "@/components/ui/button";
const TYPE_OPTIONS = [
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "resource", label: "Resource" },
] as const;

interface ContentFormProps {
  /** If provided, editing an existing item. */
  existing?: {
    id: string;
    type: string;
    title: string;
    excerpt: string | null;
    body: unknown;
    video_url: string | null;
    hero_image_url: string | null;
    published_at: string | null;
  };
}

export function ContentForm({ existing }: ContentFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contentItemSchema),
    defaultValues: {
      type: (existing?.type as ContentItemInput["type"]) ?? "article",
      title: existing?.title ?? "",
      excerpt: existing?.excerpt ?? "",
      body: (existing?.body as string | undefined) ?? undefined,
      video_url: existing?.video_url ?? "",
      hero_image_url: existing?.hero_image_url ?? "",
    },
  });

  const typeVal = watch("type");

  async function onSubmit(data: ContentItemInput) {
    setServerError(null);
    if (existing) {
      const result = await updateContentItem(existing.id, data);
      if (!result.ok) { setServerError(result.error); return; }
      router.refresh();
    } else {
      const result = await createContentItem(data);
      if (!result.ok) { setServerError(result.error); return; }
      router.push(`/mentor/content/${result.id}/edit`);
    }
  }

  async function handlePublishToggle() {
    if (!existing) return;
    setPublishError(null);
    const action = existing.published_at ? unpublishContentItem : publishContentItem;
    const result = await action({ id: existing.id });
    if (!result.ok) { setPublishError(result.error); return; }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {/* Type selector */}
      <div>
        <label className="font-body text-sm font-medium text-on-surface block mb-2">
          Content type
        </label>
        <div className="flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                value={opt.value}
                {...register("type")}
                className="accent-primary"
              />
              <span className="font-body text-sm text-on-surface">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content-title" className="font-body text-sm font-medium text-on-surface">
          Title
        </label>
        <input
          id="content-title"
          type="text"
          placeholder="Give your content a clear, descriptive title"
          className="w-full rounded-lg border border-outline/20 bg-surface px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          {...register("title")}
        />
        {errors.title && (
          <p className="font-body text-xs text-error">{errors.title.message}</p>
        )}
      </div>

      {/* Excerpt */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content-excerpt" className="font-body text-sm font-medium text-on-surface">
          Excerpt <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <textarea
          id="content-excerpt"
          rows={2}
          placeholder="A one-to-two sentence summary shown on the library card"
          className="w-full rounded-lg border border-outline/20 bg-surface px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          {...register("excerpt")}
        />
        {errors.excerpt && (
          <p className="font-body text-xs text-error">{errors.excerpt.message}</p>
        )}
      </div>

      {/* Hero image URL */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="hero-image-url" className="font-body text-sm font-medium text-on-surface">
          Hero image URL <span className="text-on-surface-variant font-normal">(optional)</span>
        </label>
        <input
          id="hero-image-url"
          type="url"
          placeholder="https://…"
          className="w-full rounded-lg border border-outline/20 bg-surface px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          {...register("hero_image_url")}
        />
        <p className="font-body text-xs text-on-surface-variant">
          Image upload via Supabase Storage is coming in a future sprint.
        </p>
        {errors.hero_image_url && (
          <p className="font-body text-xs text-error">{errors.hero_image_url.message}</p>
        )}
      </div>

      {/* Video URL (video type only) */}
      {typeVal === "video" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="video-url" className="font-body text-sm font-medium text-on-surface">
            Video URL
          </label>
          <input
            id="video-url"
            type="url"
            placeholder="YouTube or Vimeo URL"
            className="w-full rounded-lg border border-outline/20 bg-surface px-4 py-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register("video_url")}
          />
          {errors.video_url && (
            <p className="font-body text-xs text-error">{errors.video_url.message}</p>
          )}
        </div>
      )}

      {/* Body editor (article type only) */}
      {typeVal === "article" && (
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-on-surface">
            Body
          </label>
          <Controller
            name="body"
            control={control}
            render={({ field }) => (
              <TiptapEditor
                value={(field.value as unknown as import("@tiptap/core").JSONContent) ?? null}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      )}

      {serverError && (
        <p className="font-body text-sm text-error">{serverError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : existing ? "Save changes" : "Create draft"}
        </Button>

        {existing && (
          <Button
            type="button"
            variant="secondary"
            onClick={handlePublishToggle}
          >
            {existing.published_at ? "Unpublish" : "Publish"}
          </Button>
        )}

        {publishError && (
          <p className="font-body text-sm text-error">{publishError}</p>
        )}
      </div>
    </form>
  );
}

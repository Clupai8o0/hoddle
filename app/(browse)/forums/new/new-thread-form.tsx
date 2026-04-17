"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newThreadSchema, type NewThreadFormInput } from "@/lib/validation/forum";
import { createThread } from "@/lib/actions/forums";
import { Button } from "@/components/ui/button";

type CategoryOption = { slug: string; name: string };

interface NewThreadFormProps {
  categories: CategoryOption[];
  defaultCategory?: string;
  isMentor: boolean;
}

export function NewThreadForm({
  categories,
  defaultCategory,
  isMentor,
}: NewThreadFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewThreadFormInput>({
    resolver: zodResolver(newThreadSchema),
    defaultValues: {
      category_slug: defaultCategory ?? "",
      title: "",
      body: "",
      is_anonymous: false,
    },
  });

  const bodyValue = watch("body");
  const titleValue = watch("title");

  async function onSubmit(data: NewThreadFormInput) {
    setServerError(null);
    const result = await createThread(data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push(`/forums/${result.category}/${result.slug}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Category */}
      <div className="space-y-2">
        <label
          htmlFor="category_slug"
          className="block font-body text-sm font-semibold text-on-surface"
        >
          Category <span className="text-error">*</span>
        </label>
        <select
          id="category_slug"
          {...register("category_slug")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
        >
          <option value="">Select a category…</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_slug && (
          <p className="text-sm text-error font-body">
            {errors.category_slug.message}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label
            htmlFor="title"
            className="block font-body text-sm font-semibold text-on-surface"
          >
            Title <span className="text-error">*</span>
          </label>
          <span className="text-xs text-on-surface-variant font-body">
            {titleValue.length}/200
          </span>
        </div>
        <input
          id="title"
          type="text"
          placeholder="What do you want to ask or discuss?"
          {...register("title")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
        />
        {errors.title && (
          <p className="text-sm text-error font-body">{errors.title.message}</p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label
            htmlFor="body"
            className="block font-body text-sm font-semibold text-on-surface"
          >
            Details <span className="text-error">*</span>
          </label>
          <span className="text-xs text-on-surface-variant font-body">
            {bodyValue.length}/10,000
          </span>
        </div>
        <textarea
          id="body"
          rows={8}
          placeholder="Share the full context — the more detail you give, the better the community can help."
          {...register("body")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 resize-none"
        />
        {errors.body && (
          <p className="text-sm text-error font-body">{errors.body.message}</p>
        )}
      </div>

      {/* Anonymous option */}
      {!isMentor && (
        <label htmlFor="is_anonymous" className="flex items-start gap-3 cursor-pointer select-none">
          <input
            id="is_anonymous"
            type="checkbox"
            {...register("is_anonymous")}
            className="w-4 h-4 rounded accent-primary mt-0.5"
          />
          <span className="font-body text-sm text-on-surface-variant">
            Post anonymously — your name won&apos;t be shown to other students
          </span>
        </label>
      )}

      {serverError && (
        <p className="text-sm text-error font-body bg-error/10 px-4 py-3 rounded-xl">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Posting…" : "Post discussion"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

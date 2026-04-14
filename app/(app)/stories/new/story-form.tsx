"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  submitSuccessStorySchema,
  MILESTONE_OPTIONS,
  type SubmitSuccessStoryInput,
} from "@/lib/validation/success-story";
import { submitSuccessStory } from "@/lib/actions/success-stories";
import { Button } from "@/components/ui/button";

export function StoryForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SubmitSuccessStoryInput>({
    resolver: zodResolver(submitSuccessStorySchema),
    defaultValues: {
      title: "",
      body: "",
      milestones: [],
      hero_image_url: "",
    },
  });

  const bodyValue = watch("body");
  const titleValue = watch("title");
  const selectedMilestones = watch("milestones");

  async function onSubmit(data: SubmitSuccessStoryInput) {
    setServerError(null);
    const result = await submitSuccessStory(data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    router.push("/stories?submitted=1");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label
            htmlFor="title"
            className="block font-body text-sm font-semibold text-on-surface"
          >
            Story title <span className="text-error" aria-hidden="true">*</span>
          </label>
          <span className="text-xs text-on-surface-variant font-body" aria-live="polite">
            {titleValue.length}/200
          </span>
        </div>
        <input
          id="title"
          type="text"
          placeholder="e.g. How I went from failing my first essay to topping the class"
          {...register("title")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
        />
        {errors.title && (
          <p className="text-sm text-error font-body" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <label
            htmlFor="body"
            className="block font-body text-sm font-semibold text-on-surface"
          >
            Your story <span className="text-error" aria-hidden="true">*</span>
          </label>
          <span className="text-xs text-on-surface-variant font-body" aria-live="polite">
            {bodyValue.length}/10,000
          </span>
        </div>
        <textarea
          id="body"
          rows={12}
          placeholder="Share what brought you to Melbourne, the challenges you faced, and the moments that changed everything. The more honest and specific, the more it will resonate."
          {...register("body")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 resize-none leading-relaxed"
        />
        {errors.body && (
          <p className="text-sm text-error font-body" role="alert">
            {errors.body.message}
          </p>
        )}
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        <div>
          <p className="font-body text-sm font-semibold text-on-surface mb-1">
            Your milestones <span className="text-error" aria-hidden="true">*</span>
          </p>
          <p className="font-body text-xs text-on-surface-variant">
            Select the achievements that define your story (choose 1–6).
          </p>
        </div>
        <Controller
          name="milestones"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Milestones">
              {MILESTONE_OPTIONS.map((milestone) => {
                const checked = field.value.includes(milestone);
                return (
                  <button
                    key={milestone}
                    type="button"
                    onClick={() => {
                      if (checked) {
                        field.onChange(field.value.filter((m) => m !== milestone));
                      } else if (field.value.length < 6) {
                        field.onChange([...field.value, milestone]);
                      }
                    }}
                    aria-pressed={checked}
                    className={[
                      "px-4 py-2 rounded-full font-body text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      checked
                        ? "bg-secondary text-on-secondary"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest",
                      field.value.length >= 6 && !checked
                        ? "opacity-50 cursor-not-allowed"
                        : "",
                    ].join(" ")}
                  >
                    {milestone}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.milestones && (
          <p className="text-sm text-error font-body" role="alert">
            {errors.milestones.message}
          </p>
        )}
        {selectedMilestones.length > 0 && (
          <p className="text-xs text-on-surface-variant font-body">
            {selectedMilestones.length} of 6 selected
          </p>
        )}
      </div>

      {/* Hero image URL (optional) */}
      <div className="space-y-2">
        <label
          htmlFor="hero_image_url"
          className="block font-body text-sm font-semibold text-on-surface"
        >
          Hero image URL{" "}
          <span className="font-normal text-on-surface-variant">(optional)</span>
        </label>
        <p className="font-body text-xs text-on-surface-variant">
          Paste a direct link to a photo that represents your story (e.g. from
          Google Drive or Dropbox with public sharing enabled).
        </p>
        <input
          id="hero_image_url"
          type="url"
          placeholder="https://…"
          {...register("hero_image_url")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
        />
        {errors.hero_image_url && (
          <p className="text-sm text-error font-body" role="alert">
            {errors.hero_image_url.message}
          </p>
        )}
      </div>

      {serverError && (
        <p
          className="text-sm text-error font-body bg-error/10 px-4 py-3 rounded-xl"
          role="alert"
        >
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? "Submitting…" : "Submit for review"}
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

      <p className="font-body text-xs text-on-surface-variant leading-relaxed">
        Stories are reviewed by our team before being published. We&apos;ll
        notify you when yours goes live.
      </p>
    </form>
  );
}

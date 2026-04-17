"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { newPostSchema, type NewPostFormInput } from "@/lib/validation/forum";
import { createPost } from "@/lib/actions/forums";

interface ReplyFormProps {
  threadId: string;
  threadPath: string;
  locked: boolean;
  isAuthenticated: boolean;
  isMentor: boolean;
}

export function ReplyForm({ threadId, threadPath, locked, isAuthenticated, isMentor }: ReplyFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<NewPostFormInput>({
    resolver: zodResolver(newPostSchema),
    defaultValues: { thread_id: threadId, body: "", is_anonymous: false },
  });

  const bodyValue = watch("body");

  async function onSubmit(data: NewPostFormInput) {
    setServerError(null);
    const result = await createPost(data, threadPath);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    reset({ thread_id: threadId, body: "", is_anonymous: false });
  }

  if (locked) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant/20 px-6 py-4 z-40">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-on-surface-variant font-body text-center py-2">
            This thread is locked.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant/20 px-6 py-4 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <p className="font-body text-sm text-on-surface-variant">
            Join the discussion — sign in to reply.
          </p>
          <a
            href="/login"
            className="font-body text-sm font-semibold text-primary hover:underline shrink-0"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant/20 px-6 py-4 z-40">
      <div className="max-w-3xl mx-auto">
        {serverError && (
          <p className="text-xs text-error font-body mb-2">{serverError}</p>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("thread_id")} />
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <div className="relative">
                <textarea
                  {...register("body")}
                  rows={1}
                  placeholder="Share your experience or ask a follow-up…"
                  className="w-full bg-surface-container-high rounded-2xl px-6 py-4 font-body text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[56px] border-0"
                />
                {bodyValue.length > 4000 && (
                  <span className="absolute bottom-2 right-4 text-[10px] text-on-surface-variant font-body">
                    {bodyValue.length}/5,000
                  </span>
                )}
              </div>

              {!isMentor && (
                <label
                  htmlFor="reply_is_anonymous"
                  className="flex items-center gap-2 cursor-pointer select-none w-fit"
                >
                  <input
                    id="reply_is_anonymous"
                    type="checkbox"
                    {...register("is_anonymous")}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="font-body text-xs text-on-surface-variant">
                    Post anonymously
                  </span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || bodyValue.trim().length === 0}
              aria-label="Send reply"
              className="bg-primary text-on-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-ambient hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
            >
              {isSubmitting ? (
                <Loader2 strokeWidth={1.5} className="w-5 h-5 animate-spin" />
              ) : (
                <Send strokeWidth={1.5} className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

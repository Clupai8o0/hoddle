"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { newPostSchema, type NewPostInput } from "@/lib/validation/forum";
import { createPost } from "@/lib/actions/forums";

interface ReplyFormProps {
  threadId: string;
  threadPath: string;
  locked: boolean;
}

export function ReplyForm({ threadId, threadPath, locked }: ReplyFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<NewPostInput>({
    resolver: zodResolver(newPostSchema),
    defaultValues: { thread_id: threadId, body: "" },
  });

  const bodyValue = watch("body");

  async function onSubmit(data: NewPostInput) {
    setServerError(null);
    const result = await createPost(data, threadPath);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    reset({ thread_id: threadId, body: "" });
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

  return (
    <div className="fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-md border-t border-surface-variant/20 px-6 py-4 z-40">
      <div className="max-w-3xl mx-auto">
        {serverError && (
          <p className="text-xs text-error font-body mb-2">{serverError}</p>
        )}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-end gap-4"
        >
          <input type="hidden" {...register("thread_id")} />
          <div className="flex-1 relative">
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
          <button
            type="submit"
            disabled={isSubmitting || bodyValue.trim().length === 0}
            aria-label="Send reply"
            className="bg-primary text-on-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-ambient hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            <Send strokeWidth={1.5} className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

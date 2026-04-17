"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { editThreadSchema, type EditThreadInput } from "@/lib/validation/forum";
import { editThread, deleteThread } from "@/lib/actions/forums";

interface EditThreadControlsProps {
  threadId: string;
  initialTitle: string;
  initialBody: string;
  threadPath: string;
  categoryPath: string;
}

export function EditThreadControls({
  threadId,
  initialTitle,
  initialBody,
  threadPath,
  categoryPath,
}: EditThreadControlsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "editing" | "confirming-delete">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<EditThreadInput>({
    resolver: zodResolver(editThreadSchema),
    defaultValues: { id: threadId, title: initialTitle, body: initialBody },
  });

  async function onEdit(data: EditThreadInput) {
    setServerError(null);
    const result = await editThread(data, threadPath);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setMode("idle");
  }

  async function onDelete() {
    setServerError(null);
    const result = await deleteThread(threadId, categoryPath);
    if (!result.ok) {
      setServerError(result.error);
      setMode("idle");
      return;
    }
    router.push(categoryPath);
  }

  if (mode === "idle") {
    return (
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => setMode("editing")}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-body"
          aria-label="Edit thread"
        >
          <Pencil strokeWidth={1.5} className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => setMode("confirming-delete")}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-error transition-colors font-body"
          aria-label="Delete thread"
        >
          <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    );
  }

  if (mode === "confirming-delete") {
    return (
      <div className="mt-6 space-y-3">
        <p className="text-sm text-on-surface-variant font-body">
          Delete this thread? All replies will also be removed. This cannot be undone.
        </p>
        {serverError && (
          <p className="text-xs text-error font-body">{serverError}</p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error/10 text-error text-sm font-body font-medium hover:bg-error/20 transition-colors"
          >
            <Trash2 strokeWidth={1.5} className="w-4 h-4" />
            Delete thread
          </button>
          <button
            onClick={() => setMode("idle")}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body"
          >
            <X strokeWidth={1.5} className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // editing mode
  return (
    <form onSubmit={handleSubmit(onEdit)} className="mt-6 space-y-4">
      <input type="hidden" {...register("id")} />
      <div className="space-y-2">
        <label htmlFor="edit-thread-title" className="block font-body text-sm font-semibold text-on-surface">
          Title
        </label>
        <input
          id="edit-thread-title"
          type="text"
          {...register("title")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
        />
        {errors.title && (
          <p className="text-xs text-error font-body">{errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="edit-thread-body" className="block font-body text-sm font-semibold text-on-surface">
          Details
        </label>
        <textarea
          id="edit-thread-body"
          {...register("body")}
          rows={8}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 resize-none"
        />
        {errors.body && (
          <p className="text-xs text-error font-body">{errors.body.message}</p>
        )}
      </div>
      {serverError && (
        <p className="text-xs text-error font-body">{serverError}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-body font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Check strokeWidth={1.5} className="w-4 h-4" />
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setMode("idle")}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body"
        >
          <X strokeWidth={1.5} className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

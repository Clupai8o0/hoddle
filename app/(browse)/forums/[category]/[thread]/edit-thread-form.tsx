"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
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
  const [isDeleting, setIsDeleting] = useState(false);

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
    setIsDeleting(true);
    const result = await deleteThread(threadId, categoryPath);
    if (!result.ok) {
      setServerError(result.error);
      setIsDeleting(false);
      return;
    }
    router.push("/forums");
  }

  if (mode === "idle") {
    return (
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-outline-variant">
        <button
          onClick={() => setMode("editing")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body text-sm font-medium"
          aria-label="Edit thread"
        >
          <Pencil strokeWidth={1.5} className="w-4 h-4" />
          Edit post
        </button>
        <button
          onClick={() => setMode("confirming-delete")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant hover:bg-error-container hover:text-error transition-colors font-body text-sm font-medium"
          aria-label="Delete thread"
        >
          <Trash2 strokeWidth={1.5} className="w-4 h-4" />
          Delete
        </button>
      </div>
    );
  }

  if (mode === "confirming-delete") {
    return (
      <div className="mt-8 pt-6 border-t border-outline-variant space-y-4">
        <div className="bg-error-container rounded-2xl px-5 py-4">
          <p className="font-body text-sm text-on-surface font-medium mb-1">
            Delete this thread?
          </p>
          <p className="font-body text-sm text-on-surface-variant">
            All replies will also be removed. This cannot be undone.
          </p>
        </div>
        {serverError && (
          <p className="text-sm text-error font-body bg-error-container px-4 py-3 rounded-xl">
            {serverError}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-error text-on-primary text-sm font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:pointer-events-none"
          >
            {isDeleting ? (
              <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 strokeWidth={1.5} className="w-4 h-4" />
            )}
            {isDeleting ? "Deleting…" : "Delete thread"}
          </button>
          <button
            onClick={() => setMode("idle")}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors font-body text-sm disabled:opacity-50"
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
    <form onSubmit={handleSubmit(onEdit)} className="mt-8 pt-6 border-t border-outline-variant space-y-5">
      <input type="hidden" {...register("id")} />

      <div className="space-y-2">
        <label
          htmlFor="edit-thread-title"
          className="block font-body text-sm font-semibold text-on-surface"
        >
          Title
        </label>
        <input
          id="edit-thread-title"
          type="text"
          {...register("title")}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border-0"
        />
        {errors.title && (
          <p className="text-sm text-error font-body">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="edit-thread-body"
          className="block font-body text-sm font-semibold text-on-surface"
        >
          Details
        </label>
        <textarea
          id="edit-thread-body"
          {...register("body")}
          rows={10}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 resize-none"
        />
        {errors.body && (
          <p className="text-sm text-error font-body">{errors.body.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-error font-body bg-error-container px-4 py-3 rounded-xl">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <Loader2 strokeWidth={1.5} className="w-4 h-4 animate-spin" />
          ) : (
            <Check strokeWidth={1.5} className="w-4 h-4" />
          )}
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setMode("idle")}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface transition-colors font-body text-sm disabled:opacity-50"
        >
          <X strokeWidth={1.5} className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

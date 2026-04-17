"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { editPostSchema, type EditPostInput } from "@/lib/validation/forum";
import { editPost, deletePost } from "@/lib/actions/forums";

interface EditPostFormProps {
  postId: string;
  initialBody: string;
  threadPath: string;
}

export function EditPostControls({
  postId,
  initialBody,
  threadPath,
}: EditPostFormProps) {
  const [mode, setMode] = useState<"idle" | "editing" | "confirming-delete">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<EditPostInput>({
    resolver: zodResolver(editPostSchema),
    defaultValues: { id: postId, body: initialBody },
  });

  async function onEdit(data: EditPostInput) {
    setServerError(null);
    const result = await editPost(data, threadPath);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setMode("idle");
  }

  async function onDelete() {
    setServerError(null);
    setIsDeleting(true);
    const result = await deletePost(postId, threadPath);
    if (!result.ok) {
      setServerError(result.error);
      setIsDeleting(false);
    }
  }

  if (mode === "idle") {
    return (
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-outline-variant">
        <button
          onClick={() => setMode("editing")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body text-sm font-medium"
          aria-label="Edit post"
        >
          <Pencil strokeWidth={1.5} className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => setMode("confirming-delete")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-colors font-body text-sm font-medium"
          aria-label="Delete post"
        >
          <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    );
  }

  if (mode === "confirming-delete") {
    return (
      <div className="mt-4 pt-4 border-t border-outline-variant space-y-3">
        <p className="text-sm text-on-surface-variant font-body">
          Delete this reply? This cannot be undone.
        </p>
        {serverError && (
          <p className="text-sm text-error font-body bg-error-container px-3 py-2 rounded-lg">
            {serverError}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-on-primary text-sm font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:pointer-events-none"
          >
            {isDeleting ? (
              <Loader2 strokeWidth={1.5} className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 strokeWidth={1.5} className="w-3.5 h-3.5" />
            )}
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
          <button
            onClick={() => setMode("idle")}
            disabled={isDeleting}
            className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body disabled:opacity-50"
          >
            <X strokeWidth={1.5} className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // editing mode
  return (
    <form onSubmit={handleSubmit(onEdit)} className="mt-4 pt-4 border-t border-outline-variant space-y-3">
      <input type="hidden" {...register("id")} />
      <textarea
        {...register("body")}
        rows={5}
        className="w-full bg-surface-container rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 resize-none"
      />
      {errors.body && (
        <p className="text-sm text-error font-body">{errors.body.message}</p>
      )}
      {serverError && (
        <p className="text-sm text-error font-body bg-error-container px-3 py-2 rounded-lg">
          {serverError}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSubmitting ? (
            <Loader2 strokeWidth={1.5} className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check strokeWidth={1.5} className="w-3.5 h-3.5" />
          )}
          {isSubmitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setMode("idle")}
          disabled={isSubmitting}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors font-body disabled:opacity-50"
        >
          <X strokeWidth={1.5} className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </form>
  );
}

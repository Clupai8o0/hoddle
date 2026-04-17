"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, X, Check } from "lucide-react";
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
  const [mode, setMode] = useState<"idle" | "editing" | "confirming-delete">(
    "idle",
  );
  const [serverError, setServerError] = useState<string | null>(null);

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
    const result = await deletePost(postId, threadPath);
    if (!result.ok) {
      setServerError(result.error);
      setMode("idle");
    }
  }

  if (mode === "idle") {
    return (
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => setMode("editing")}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-body"
          aria-label="Edit post"
        >
          <Pencil strokeWidth={1.5} className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => setMode("confirming-delete")}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-error transition-colors font-body"
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
      <div className="mt-4 space-y-3">
        <p className="text-sm text-on-surface-variant font-body">
          Delete this post? This cannot be undone.
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
            Delete
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
    <form onSubmit={handleSubmit(onEdit)} className="mt-4 space-y-3">
      <input type="hidden" {...register("id")} />
      <textarea
        {...register("body")}
        rows={4}
        className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 border-0 resize-none"
      />
      {errors.body && (
        <p className="text-xs text-error font-body">{errors.body.message}</p>
      )}
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
          {isSubmitting ? "Saving…" : "Save"}
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

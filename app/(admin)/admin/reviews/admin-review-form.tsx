"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, CheckCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StarRowInput } from "@/components/ui/star-row";
import {
  createReview,
  updateReview,
  uploadReviewAvatar,
  removeReviewAvatar,
} from "@/lib/actions/admin-reviews";

interface AdminReviewFormProps {
  mode: "create" | "edit";
  reviewId?: string;
  defaultValues?: {
    author_name: string;
    author_context: string;
    rating: number;
    content: string;
    published: boolean;
    display_order: number;
  };
  currentAvatarUrl?: string | null;
}

export function AdminReviewForm({
  mode,
  reviewId,
  defaultValues,
  currentAvatarUrl,
}: AdminReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Avatar state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  // Fields
  const [authorName, setAuthorName] = useState(defaultValues?.author_name ?? "");
  const [authorContext, setAuthorContext] = useState(defaultValues?.author_context ?? "");
  const [rating, setRating] = useState<number>(defaultValues?.rating ?? 5);
  const [content, setContent] = useState(defaultValues?.content ?? "");
  const [published, setPublished] = useState(defaultValues?.published ?? true);
  const [displayOrder, setDisplayOrder] = useState<number>(defaultValues?.display_order ?? 0);

  function setPreview(objectUrl: string | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (objectUrl) previewUrlRef.current = objectUrl;
    setAvatarPreview(objectUrl);
  }

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!authorName.trim()) errs.author_name = "Name is required.";
    if (authorName.length > 120) errs.author_name = "Max 120 characters.";
    if (authorContext.length > 160) errs.author_context = "Max 160 characters.";
    if (rating < 1 || rating > 5) errs.rating = "Pick 1–5 stars.";
    if (content.trim().length < 10) errs.content = "At least 10 characters.";
    if (content.length > 400) errs.content = "Max 400 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleAvatarChangeEdit(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !reviewId) return;

    setPreview(URL.createObjectURL(file));
    setAvatarError(null);
    setAvatarUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadReviewAvatar(reviewId, formData);
    setAvatarUploading(false);

    if (!result.ok) {
      setAvatarError(result.error);
      setPreview(null);
      return;
    }
    setAvatarUrl(result.avatarUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAvatarChangeCreate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAvatarFile(file);
    setPreview(URL.createObjectURL(file));
    setAvatarError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemoveAvatar() {
    if (!reviewId) return;
    setAvatarError(null);
    setAvatarUploading(true);
    const result = await removeReviewAvatar(reviewId);
    setAvatarUploading(false);
    if (!result.ok) {
      setAvatarError(result.error);
      return;
    }
    setAvatarUrl(null);
    setPreview(null);
  }

  function handleSubmit() {
    if (!validate()) return;
    setServerError(null);
    setSaved(false);

    const payload = {
      author_name: authorName.trim(),
      author_context: authorContext.trim(),
      rating,
      content: content.trim(),
      published,
      display_order: displayOrder,
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createReview(payload);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        if (pendingAvatarFile) {
          const formData = new FormData();
          formData.append("file", pendingAvatarFile);
          const avatarResult = await uploadReviewAvatar(result.id, formData);
          if (!avatarResult.ok) {
            setAvatarError(`Review created but photo upload failed: ${avatarResult.error}`);
            return;
          }
        }
        router.push("/admin/reviews");
      } else {
        if (!reviewId) {
          setServerError("Missing review ID.");
          return;
        }
        const result = await updateReview(reviewId, payload);
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
      }
    });
  }

  const displayAvatar = avatarPreview ?? avatarUrl;

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-4">
        <h2 className="font-display font-semibold text-lg text-on-surface">Photo</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-container-high flex-shrink-0">
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt={`${authorName || "Reviewer"} avatar`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
                <Camera size={28} strokeWidth={1.5} aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={mode === "edit" ? handleAvatarChangeEdit : handleAvatarChangeCreate}
              aria-label="Upload review photo"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="default"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUploading ? "Uploading..." : displayAvatar ? "Replace photo" : "Upload photo"}
              </Button>
              {mode === "edit" && avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="font-body text-sm text-on-surface-variant hover:text-error inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary rounded-sm"
                >
                  <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
            <p className="font-body text-xs text-on-surface-variant">
              JPEG, PNG or WebP · max 2 MB
            </p>
            {avatarError && (
              <p className="font-body text-xs text-error" role="alert">
                {avatarError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-6">
        <h2 className="font-display font-semibold text-lg text-on-surface">Identity</h2>

        <Input
          label="Author name"
          placeholder="e.g. Priya Sharma"
          value={authorName}
          onChange={(e) => {
            setAuthorName(e.target.value);
            clearError("author_name");
            setSaved(false);
          }}
          error={errors.author_name}
          autoFocus
        />

        <div>
          <Input
            label="Context"
            placeholder="e.g. First-year Commerce, Monash"
            value={authorContext}
            onChange={(e) => {
              setAuthorContext(e.target.value);
              clearError("author_context");
              setSaved(false);
            }}
            error={errors.author_context}
          />
          <p className="font-body text-xs text-on-surface-variant mt-1.5 text-right">
            {authorContext.length}/160
          </p>
        </div>
      </div>

      {/* Review content */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-6">
        <h2 className="font-display font-semibold text-lg text-on-surface">Review</h2>

        <div>
          <p className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase mb-2">
            Rating
          </p>
          <StarRowInput value={rating} onChange={setRating} />
          {errors.rating && (
            <p className="font-body text-sm text-error mt-1" role="alert">
              {errors.rating}
            </p>
          )}
        </div>

        <div>
          <Textarea
            label="Content"
            placeholder="What did this student say about Hoddle?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              clearError("content");
              setSaved(false);
            }}
            error={errors.content}
            rows={5}
          />
          <p className="font-body text-xs text-on-surface-variant mt-1.5 text-right">
            {content.length}/400
          </p>
        </div>
      </div>

      {/* Publishing */}
      <div className="bg-surface-container rounded-xl p-6 lg:p-8 space-y-6">
        <h2 className="font-display font-semibold text-lg text-on-surface">Publishing</h2>

        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => {
              setPublished(e.target.checked);
              setSaved(false);
            }}
            className="mt-1 w-5 h-5 rounded accent-primary cursor-pointer"
          />
          <div>
            <p className="font-body font-medium text-on-surface">Published</p>
            <p className="font-body text-sm text-on-surface-variant">
              Published reviews appear on the homepage. Drafts are hidden from the public.
            </p>
          </div>
        </label>

        <div>
          <label
            htmlFor="display_order"
            className="font-body text-sm font-medium text-on-surface tracking-[0.08em] uppercase"
          >
            Display order
          </label>
          <input
            id="display_order"
            type="number"
            value={displayOrder}
            onChange={(e) => {
              setDisplayOrder(Number.parseInt(e.target.value, 10) || 0);
              setSaved(false);
            }}
            className="mt-2 w-32 min-h-[48px] px-4 py-3 font-body text-base text-on-surface bg-surface-container-low rounded-md outline-none border-none focus:ring-2 focus:ring-tertiary"
          />
          <p className="font-body text-xs text-on-surface-variant mt-1.5">
            Lower numbers appear first. Ties break by newest.
          </p>
        </div>
      </div>

      {serverError && (
        <p className="font-body text-sm text-error" role="alert">
          {serverError}
        </p>
      )}

      {saved && (
        <div className="flex items-center gap-2 font-body text-sm text-secondary" role="status">
          <CheckCircle size={16} strokeWidth={1.5} aria-hidden="true" />
          Changes saved.
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="primary" size="lg" onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create review"
              : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push("/admin/reviews")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

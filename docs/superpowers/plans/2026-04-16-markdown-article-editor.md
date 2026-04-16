# Markdown Article Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Tiptap JSON with Markdown for article bodies — with a custom Write/Preview editor, image uploads, YouTube/Vimeo/Maps embeds, and full SEO on the article detail page.

**Architecture:** Store `body` as `text` (Markdown string) in Postgres. Replace `TiptapEditor` with a custom `MarkdownEditor` (textarea + toolbar + Write/Preview tabs). Replace `TiptapRenderer` with a `MarkdownRenderer` using `react-markdown` + `remark-gfm` + custom components for images, links, and embeds. Extend the existing `getVideoEmbedUrl` utility to also detect Google Maps. Add full Open Graph + JSON-LD structured data to the article detail page.

**Tech Stack:** `react-markdown`, `remark-gfm`, Next.js Image, Supabase Storage, Tailwind CSS v4 tokens.

---

## File Map

| Action | File |
|---|---|
| Create | `supabase/migrations/20260416000002_content_body_markdown.sql` |
| Modify | `lib/supabase/database.types.ts` — body: string \| null on content_items |
| Modify | `lib/validation/content-item.ts` — body: z.string().optional() |
| Modify | `lib/actions/content-items.ts` — remove Json cast on body |
| Create | `lib/actions/upload-content-image.ts` — image upload server action |
| Modify | `lib/utils/video-embed.ts` — add Google Maps embed detection |
| Create | `components/ui/markdown-editor.tsx` — Write/Preview textarea editor |
| Create | `components/patterns/markdown-renderer.tsx` — react-markdown with embed/image/link components |
| Modify | `app/globals.css` — add prose-hoddle @layer component styles |
| Modify | `app/(app)/mentor/content/content-form.tsx` — swap TiptapEditor for MarkdownEditor |
| Modify | `app/(browse)/content/[slug]/page.tsx` — swap TiptapRenderer for MarkdownRenderer, full SEO |
| Delete | `components/patterns/tiptap-editor.tsx` |
| Delete | `components/patterns/tiptap-renderer.tsx` |

---

### Task 1: Database migration + storage bucket

**Files:**
- Create: `supabase/migrations/20260416000002_content_body_markdown.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260416000002_content_body_markdown.sql

-- Change body from jsonb to text for Markdown storage.
-- Existing jsonb content becomes NULL (Tiptap JSON is not valid Markdown).
alter table public.content_items
  alter column body drop default,
  alter column body type text using null;

-- ── content-images storage bucket ──────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-images',
  'content-images',
  true,
  5242880,
  array['image/webp','image/jpeg','image/png','image/gif']
)
on conflict (id) do nothing;

-- Public read
create policy "content_images_public_read"
  on storage.objects for select
  using (bucket_id = 'content-images');

-- Mentors can write to their own folder: content-images/{their_uid}/...
create policy "content_images_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "content_images_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "content_images_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'content-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

- [ ] **Step 2: Apply migration (requires Docker / Supabase SQL editor)**

Run: `npx supabase db reset`

If Docker is not running, paste the SQL directly into the Supabase SQL editor and run it there.

- [ ] **Step 3: Update database.types.ts manually**

In `lib/supabase/database.types.ts`, find the `content_items` table block. Change `body` from `Json | null` to `string | null` in Row, Insert, and Update:

```typescript
// Row
body: string | null

// Insert
body?: string | null

// Update
body?: string | null
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260416000002_content_body_markdown.sql lib/supabase/database.types.ts
git commit -m "feat(db): change content_items.body to text for markdown, add content-images bucket"
```

---

### Task 2: Install packages

- [ ] **Step 1: Install**

Run: `npm install react-markdown remark-gfm`

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-markdown and remark-gfm"
```

---

### Task 3: Extend video-embed utility to handle Google Maps

**Files:**
- Modify: `lib/utils/video-embed.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
/**
 * Parse a YouTube, Vimeo, or Google Maps embed URL and return a safe embed URL.
 * Returns null if the URL is not a recognised embeddable URL.
 */
export function getVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    // YouTube: youtube.com/watch?v=ID or youtu.be/ID
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.slice(1);
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    // Vimeo: vimeo.com/ID
    if (parsed.hostname === "vimeo.com" || parsed.hostname === "www.vimeo.com") {
      const videoId = parsed.pathname.replace(/^\//, "");
      if (/^\d+$/.test(videoId))
        return `https://player.vimeo.com/video/${videoId}`;
    }

    // Google Maps — only accept the /maps/embed path (the embed URL from "Share → Embed a map")
    if (
      (parsed.hostname === "www.google.com" || parsed.hostname === "google.com") &&
      parsed.pathname.startsWith("/maps/embed")
    ) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Compile check + commit**

```bash
npx tsc --noEmit
git add lib/utils/video-embed.ts
git commit -m "feat(utils): add Google Maps embed detection to getVideoEmbedUrl"
```

---

### Task 4: Update validation schema and server action

**Files:**
- Modify: `lib/validation/content-item.ts`
- Modify: `lib/actions/content-items.ts`

- [ ] **Step 1: Update body validation**

In `lib/validation/content-item.ts`, replace:
```typescript
body: z.unknown().optional(),
```
With:
```typescript
body: z.string().optional(),
```

- [ ] **Step 2: Update server action — remove Json cast**

In `lib/actions/content-items.ts`:

Remove the import:
```typescript
import type { Json } from "@/lib/supabase/database.types";
```

Find every occurrence of:
```typescript
body: (parsed.data.body as Json | undefined) ?? null,
```
Replace with:
```typescript
body: parsed.data.body ?? null,
```

- [ ] **Step 3: Compile check + commit**

```bash
npx tsc --noEmit
git add lib/validation/content-item.ts lib/actions/content-items.ts
git commit -m "feat(validation): change content body from JSONContent to markdown string"
```

---

### Task 5: Image upload server action

**Files:**
- Create: `lib/actions/upload-content-image.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/actions/upload-content-image.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadContentImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "mentor") return { ok: false, error: "Not authorised." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file provided." };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, WebP, and GIF are allowed." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 5 MB." };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${user.id}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("content-images")
    .upload(path, buffer, { contentType: file.type });

  if (uploadError) {
    return { ok: false, error: `Upload failed: ${uploadError.message}` };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("content-images").getPublicUrl(path);

  return { ok: true, url: publicUrl };
}
```

- [ ] **Step 2: Compile check + commit**

```bash
npx tsc --noEmit
git add lib/actions/upload-content-image.ts
git commit -m "feat(actions): add uploadContentImage server action"
```

---

### Task 6: MarkdownEditor component

**Files:**
- Create: `components/ui/markdown-editor.tsx`

- [ ] **Step 1: Create the component**

```typescript
// components/ui/markdown-editor.tsx
"use client";

import { useRef, useState } from "react";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Link2, Image as ImageIcon, Eye, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { uploadContentImage } from "@/lib/actions/upload-content-image";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [PreviewContent, setPreviewContent] = useState<React.FC<{ content: string }> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPreview() {
    if (PreviewContent) return;
    const { MarkdownRenderer } = await import("@/components/patterns/markdown-renderer");
    setPreviewContent(() => function Preview({ content }: { content: string }) {
      return <MarkdownRenderer content={content} />;
    });
  }

  function insert(before: string, after = "", defaultText = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || defaultText;
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function insertLine(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    });
  }

  function insertLink() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value.slice(start, end) || "link text";
    const md = `[${text}](https://)`;
    const next = value.slice(0, start) + md + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      // Select the placeholder URL so user can type immediately
      const urlStart = start + text.length + 3;
      textarea.setSelectionRange(urlStart, urlStart + 8);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadContentImage(fd);
    setUploading(false);
    if (!result.ok) { setUploadError(result.error); return; }
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    onChange(value.slice(0, cursor) + `\n![Image](${result.url})\n` + value.slice(cursor));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const toolbar: ({ label: string; icon: React.ReactNode; action: () => void } | null)[] = [
    { label: "Bold", icon: <Bold size={14} strokeWidth={1.5} />, action: () => insert("**", "**", "bold text") },
    { label: "Italic", icon: <Italic size={14} strokeWidth={1.5} />, action: () => insert("_", "_", "italic text") },
    null,
    { label: "Heading 2", icon: <Heading2 size={14} strokeWidth={1.5} />, action: () => insertLine("## ") },
    { label: "Heading 3", icon: <Heading3 size={14} strokeWidth={1.5} />, action: () => insertLine("### ") },
    null,
    { label: "Bullet list", icon: <List size={14} strokeWidth={1.5} />, action: () => insertLine("- ") },
    { label: "Ordered list", icon: <ListOrdered size={14} strokeWidth={1.5} />, action: () => insertLine("1. ") },
    null,
    { label: "Blockquote", icon: <Quote size={14} strokeWidth={1.5} />, action: () => insertLine("> ") },
    { label: "Horizontal rule", icon: <Minus size={14} strokeWidth={1.5} />, action: () => insert("\n---\n") },
    null,
    { label: "Link", icon: <Link2 size={14} strokeWidth={1.5} />, action: insertLink },
    { label: "Insert image", icon: <ImageIcon size={14} strokeWidth={1.5} />, action: () => fileInputRef.current?.click() },
  ];

  return (
    <div className="rounded-xl border border-outline/20 bg-surface-container overflow-hidden">
      {/* Tab bar + toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline/10 bg-surface-container-low">
        <div className="flex items-center gap-0.5">
          {tab === "write" && toolbar.map((item, i) =>
            item === null ? (
              <span key={i} className="w-px h-4 bg-outline/20 mx-1" aria-hidden="true" />
            ) : (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                onClick={item.action}
                disabled={uploading}
                className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
              >
                {item.icon}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-1 bg-surface-container-high rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md font-body text-xs font-medium transition-colors",
              tab === "write" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <Pencil size={12} strokeWidth={1.5} aria-hidden="true" />
            Write
          </button>
          <button
            type="button"
            onClick={() => { setTab("preview"); loadPreview(); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md font-body text-xs font-medium transition-colors",
              tab === "preview" ? "bg-surface text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            <Eye size={12} strokeWidth={1.5} aria-hidden="true" />
            Preview
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleImageUpload}
        aria-label="Upload image"
      />

      {tab === "write" && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Write in Markdown…\n\nPaste a YouTube, Vimeo, or Google Maps embed URL on its own line to embed it."}
          className="w-full min-h-[400px] px-5 py-4 font-body text-sm text-on-surface bg-transparent leading-relaxed resize-y focus:outline-none placeholder:text-on-surface-variant/40"
        />
      )}

      {tab === "preview" && (
        <div className="min-h-[400px] px-5 py-4">
          {value.trim() ? (
            PreviewContent ? (
              <div className="prose-hoddle">
                <PreviewContent content={value} />
              </div>
            ) : (
              <p className="font-body text-sm text-on-surface-variant">Loading preview…</p>
            )
          ) : (
            <p className="font-body text-sm text-on-surface-variant italic">Nothing to preview yet.</p>
          )}
        </div>
      )}

      {uploading && (
        <p className="px-5 pb-3 font-body text-xs text-on-surface-variant">Uploading image…</p>
      )}
      {uploadError && (
        <p className="px-5 pb-3 font-body text-xs text-error" role="alert">{uploadError}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Compile check + commit**

```bash
npx tsc --noEmit
git add components/ui/markdown-editor.tsx
git commit -m "feat(ui): add MarkdownEditor with toolbar, Write/Preview, and image upload"
```

---

### Task 7: MarkdownRenderer + prose-hoddle styles

**Files:**
- Create: `components/patterns/markdown-renderer.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create MarkdownRenderer**

```typescript
// components/patterns/markdown-renderer.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import Link from "next/link";
import { getVideoEmbedUrl } from "@/lib/utils/video-embed";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function EmbedFrame({ src }: { src: string }) {
  return (
    <span className="block relative w-full aspect-video my-6 rounded-xl overflow-hidden bg-surface-container-high not-prose">
      <iframe
        src={src}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        title="Embedded content"
      />
    </span>
  );
}

const components: Components = {
  img({ src, alt }) {
    if (!src) return null;
    return (
      <span className="block relative w-full aspect-video my-6 rounded-xl overflow-hidden bg-surface-container-high">
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 700px"
        />
      </span>
    );
  },

  // Detect bare embed URLs on their own line
  p({ children, node }) {
    const childArray = node?.children ?? [];
    if (childArray.length === 1) {
      const child = childArray[0];
      // Bare URL text (e.g. https://youtube.com/...)
      if (child.type === "text") {
        const text = ((child as unknown) as { value: string }).value.trim();
        const embedUrl = getVideoEmbedUrl(text);
        if (embedUrl) return <EmbedFrame src={embedUrl} />;
      }
      // Autolinked URL where link text === href
      if (child.type === "element" && ((child as unknown) as { tagName: string }).tagName === "a") {
        const a = (child as unknown) as { properties?: { href?: string }; children?: Array<{ value?: string }> };
        const href = a.properties?.href ?? "";
        const text = a.children?.[0]?.value ?? "";
        if (text === href || text === "") {
          const embedUrl = getVideoEmbedUrl(href);
          if (embedUrl) return <EmbedFrame src={embedUrl} />;
        }
      }
    }
    return <p>{children}</p>;
  },

  a({ href, children }) {
    if (!href) return <span>{children}</span>;
    const isExternal = /^https?:\/\/|^\/\//.test(href);
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return <Link href={href}>{children}</Link>;
  },
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      className={className}
    >
      {content}
    </ReactMarkdown>
  );
}
```

- [ ] **Step 2: Add prose-hoddle to globals.css**

At the end of `app/globals.css`, add:

```css
@layer components {
  .prose-hoddle {
    color: var(--color-on-surface);
    font-family: var(--font-body);
    line-height: 1.75;
    font-size: 1rem;

    h2 {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.5rem;
      line-height: 1.3;
      color: var(--color-primary);
      margin-top: 2.5rem;
      margin-bottom: 0.75rem;
    }
    h3 {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 1.2rem;
      line-height: 1.4;
      color: var(--color-on-surface);
      margin-top: 2rem;
      margin-bottom: 0.5rem;
    }
    h4 {
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 1rem;
      color: var(--color-on-surface);
      margin-top: 1.5rem;
      margin-bottom: 0.25rem;
    }
    p { margin-bottom: 1.25rem; }
    a {
      color: var(--color-tertiary);
      text-decoration: underline;
      text-underline-offset: 3px;
      transition: color 150ms;
      &:hover { color: var(--color-primary); }
    }
    strong { font-weight: 700; color: var(--color-on-surface); }
    em { font-style: italic; }
    ul {
      list-style-type: disc;
      padding-left: 1.5rem;
      margin-bottom: 1.25rem;
      li { margin-bottom: 0.375rem; }
    }
    ol {
      list-style-type: decimal;
      padding-left: 1.5rem;
      margin-bottom: 1.25rem;
      li { margin-bottom: 0.375rem; }
    }
    blockquote {
      border-left: 3px solid var(--color-tertiary);
      margin: 1.5rem 0;
      padding: 0.75rem 1.25rem;
      background-color: var(--color-surface-container);
      border-radius: 0 0.5rem 0.5rem 0;
      color: var(--color-on-surface-variant);
      font-style: italic;
      p:last-child { margin-bottom: 0; }
    }
    code {
      font-family: ui-monospace, monospace;
      font-size: 0.875em;
      background-color: var(--color-surface-container-high);
      color: var(--color-on-surface);
      padding: 0.15em 0.4em;
      border-radius: 0.25rem;
    }
    pre {
      background-color: var(--color-surface-container-high);
      border-radius: 0.75rem;
      padding: 1.25rem;
      overflow-x: auto;
      margin-bottom: 1.25rem;
      code { background: none; padding: 0; font-size: 0.875rem; }
    }
    hr {
      border: none;
      border-top: 1px solid var(--color-outline-variant);
      margin: 2.5rem 0;
      opacity: 0.4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
      th {
        background-color: var(--color-surface-container);
        font-weight: 600;
        text-align: left;
        padding: 0.625rem 1rem;
        border-bottom: 2px solid var(--color-outline-variant);
      }
      td {
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--color-outline-variant);
      }
      tr:last-child td { border-bottom: none; }
    }
    img { max-width: 100%; border-radius: 0.75rem; }
  }
}
```

- [ ] **Step 3: Compile check + commit**

```bash
npx tsc --noEmit
git add components/patterns/markdown-renderer.tsx app/globals.css
git commit -m "feat(patterns): add MarkdownRenderer with embed/image/link support and prose-hoddle styles"
```

---

### Task 8: Update content form — swap TiptapEditor for MarkdownEditor

**Files:**
- Modify: `app/(app)/mentor/content/content-form.tsx`

- [ ] **Step 1: Replace imports**

Remove:
```typescript
import { TiptapEditor } from "@/components/patterns/tiptap-editor";
import type { JSONContent } from "@tiptap/core";
```

Add:
```typescript
import { MarkdownEditor } from "@/components/ui/markdown-editor";
```

- [ ] **Step 2: Update defaultValues**

Change:
```typescript
body: (existing?.body as JSONContent) ?? undefined,
```
To:
```typescript
body: (existing?.body as string) ?? "",
```

- [ ] **Step 3: Replace TiptapEditor Controller**

Find:
```tsx
<Controller
  name="body"
  control={control}
  render={({ field }) => (
    <TiptapEditor
      value={(field.value as JSONContent) ?? null}
      onChange={field.onChange}
    />
  )}
/>
```

Replace with:
```tsx
<Controller
  name="body"
  control={control}
  render={({ field }) => (
    <MarkdownEditor
      value={(field.value as string) ?? ""}
      onChange={field.onChange}
    />
  )}
/>
```

- [ ] **Step 4: Compile check + commit**

```bash
npx tsc --noEmit
git add app/(app)/mentor/content/content-form.tsx
git commit -m "feat(content): replace TiptapEditor with MarkdownEditor in content form"
```

---

### Task 9: Update article detail page — MarkdownRenderer + full SEO

**Files:**
- Modify: `app/(browse)/content/[slug]/page.tsx`

- [ ] **Step 1: Replace Tiptap imports**

Remove:
```typescript
import { TiptapRenderer } from "@/components/patterns/tiptap-renderer";
import type { JSONContent } from "@tiptap/core";
```

Add:
```typescript
import { MarkdownRenderer } from "@/components/patterns/markdown-renderer";
```

- [ ] **Step 2: Replace the renderer in JSX**

Find:
```tsx
{/* Rich-text body (Tiptap JSON) */}
{item.body && (
  <div className="prose-hoddle">
    <TiptapRenderer
      content={item.body as JSONContent}
    />
  </div>
)}
```

Replace with:
```tsx
{/* Article body — Markdown */}
{item.body && (
  <div className="prose-hoddle">
    <MarkdownRenderer content={item.body} />
  </div>
)}
```

- [ ] **Step 3: Update generateMetadata data query**

Change `.select("title, excerpt")` to `.select("title, excerpt, hero_image_url")`.

- [ ] **Step 4: Replace generateMetadata with full SEO version**

```typescript
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_items")
    .select("title, excerpt, hero_image_url")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .maybeSingle();
  if (!data) return { title: "Content — Hoddle" };

  const title = `${data.title} — Hoddle`;
  const description = data.excerpt ?? "Advice and stories from a Hoddle mentor.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(data.hero_image_url
        ? { images: [{ url: data.hero_image_url, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(data.hero_image_url ? { images: [data.hero_image_url] } : {}),
    },
  };
}
```

- [ ] **Step 5: Add Article JSON-LD structured data**

At the top of the `ContentArticlePage` return statement, before `<ViewTracker>`, add a JSON-LD script. Use `JSON.stringify` with `<`/`>` replaced by their unicode escapes to prevent script injection:

```tsx
{/* Article structured data */}
<script
  type="application/ld+json"
  // JSON.stringify is safe here: we replace < and > with unicode escapes
  // to prevent premature </script> tag injection from user-provided strings.
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.title,
      description: item.excerpt ?? undefined,
      image: item.hero_image_url ?? undefined,
      datePublished: item.published_at,
      author: { "@type": "Person", name: mentorName },
      publisher: { "@type": "Organization", name: "Hoddle Melbourne" },
    }).replace(/</g, "\\u003c").replace(/>/g, "\\u003e"),
  }}
/>
```

(`mentorName` is whatever variable the page already uses to render the mentor's name.)

- [ ] **Step 6: Compile check + commit**

```bash
npx tsc --noEmit
git add app/(browse)/content/[slug]/page.tsx
git commit -m "feat(content): swap TiptapRenderer for MarkdownRenderer, add OG + JSON-LD SEO"
```

---

### Task 10: Remove Tiptap files and packages

**Files:**
- Delete: `components/patterns/tiptap-editor.tsx`
- Delete: `components/patterns/tiptap-renderer.tsx`

- [ ] **Step 1: Delete files + uninstall packages**

```bash
rm components/patterns/tiptap-editor.tsx
rm components/patterns/tiptap-renderer.tsx
npm uninstall @tiptap/react @tiptap/starter-kit
```

- [ ] **Step 2: Compile check — must be fully clean**

```bash
npx tsc --noEmit
```

If there are errors, a file still imports Tiptap. Find and fix each one before committing.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove Tiptap editor and renderer, uninstall tiptap packages"
```

---

## Self-Review

**Spec coverage:**
- ✅ Markdown body — stored as `text`, edited and rendered as Markdown
- ✅ Image inserts — upload button in toolbar → Supabase `content-images` bucket → `![Image](url)` inserted at cursor
- ✅ Links — external links open in new tab with `rel="noopener noreferrer"`; internal links use Next.js `<Link>`
- ✅ YouTube embeds — bare URL on its own line renders as privacy-enhanced `<iframe>`
- ✅ Vimeo embeds — bare URL on its own line renders as `<iframe>`
- ✅ Google Maps — paste the embed URL from Maps "Share → Embed a map" on its own line
- ✅ Renders well — `prose-hoddle` uses Hoddle CSS tokens, correct heading/list/blockquote/code typography
- ✅ Write/Preview toggle — lazy-loaded preview, no server-side bloat
- ✅ SEO — Open Graph, Twitter Card, Article JSON-LD (with `<`/`>` escaped to prevent XSS), robots noindex removed
- ✅ Security — JSON-LD injection prevented with `.replace(/</g, "\\u003c").replace(/>/g, "\\u003e")`

**Out of scope (correct):**
- Google Maps regular share URLs are not auto-converted — authors paste the embed URL from Maps' embed dialog. This is noted in the editor placeholder.
- Task 10 (Tiptap removal) must run last — earlier tasks still reference Tiptap until they are replaced.

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

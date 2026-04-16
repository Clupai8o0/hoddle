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
    if (!src || typeof src !== "string") return null;
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

  p({ children, node }) {
    const childArray = node?.children ?? [];
    if (childArray.length === 1) {
      const child = childArray[0];
      if (child.type === "text") {
        const text = ((child as unknown) as { value: string }).value.trim();
        const embedUrl = getVideoEmbedUrl(text);
        if (embedUrl) return <EmbedFrame src={embedUrl} />;
      }
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
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

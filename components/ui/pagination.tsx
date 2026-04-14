import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  /** Current 1-based page number */
  page: number;
  /** Total number of items across all pages */
  total: number;
  /** Items per page */
  pageSize: number;
  /** Base path + any existing query params (e.g. "/content?type=article") */
  basePath: string;
  /** Query param name to use for the page number. Default: "page" */
  paramName?: string;
}

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
  paramName = "page",
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function href(p: number): string {
    const sep = basePath.includes("?") ? "&" : "?";
    return `${basePath}${sep}${paramName}=${p}`;
  }

  // Build page window: always show first, last, current ±1, with ellipsis gaps
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-12"
    >
      {/* Previous */}
      {hasPrev ? (
        <Link
          href={href(page - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg font-body text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} strokeWidth={1.5} />
          Prev
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 font-body text-sm text-on-surface-variant/40 cursor-not-allowed">
          <ChevronLeft size={15} strokeWidth={1.5} />
          Prev
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 text-center font-body text-sm text-on-surface-variant"
            >
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={`w-9 h-9 flex items-center justify-center rounded-lg font-body text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                p === page
                  ? "bg-primary text-surface font-semibold"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {/* Next */}
      {hasNext ? (
        <Link
          href={href(page + 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg font-body text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Next page"
        >
          Next
          <ChevronRight size={15} strokeWidth={1.5} />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 font-body text-sm text-on-surface-variant/40 cursor-not-allowed">
          Next
          <ChevronRight size={15} strokeWidth={1.5} />
        </span>
      )}
    </nav>
  );
}

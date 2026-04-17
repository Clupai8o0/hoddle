import { Fragment, type ReactNode } from "react";

/**
 * Render forum post body with support for:
 *   - `> quoted line` → styled <blockquote>
 *   - `@Mention` tokens → styled span (word-boundary match)
 *
 * Intentionally small — this is not a full markdown parser. We only
 * need quote blocks and mention highlights to support the forum's
 * flexible interaction patterns.
 */
export function renderPostBody(body: string): ReactNode {
  const lines = body.split("\n");
  const blocks: ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith(">")) {
      // Consume consecutive quote lines as a single blockquote.
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={`q-${i}`}
          className="my-3 border-l-4 border-primary/30 pl-4 py-1 text-on-surface-variant italic"
        >
          {quoteLines.map((q, idx) => (
            <Fragment key={idx}>
              {renderMentions(q)}
              {idx < quoteLines.length - 1 && <br />}
            </Fragment>
          ))}
        </blockquote>,
      );
      continue;
    }

    // Group consecutive non-quote lines into a single paragraph block
    // (preserving newlines inside with <br>).
    const paraLines: string[] = [];
    while (i < lines.length && !lines[i].startsWith(">")) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={`p-${i}`} className="whitespace-pre-wrap">
        {paraLines.map((p, idx) => (
          <Fragment key={idx}>
            {renderMentions(p)}
            {idx < paraLines.length - 1 && "\n"}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <div className="space-y-3">{blocks}</div>;
}

/**
 * Split a line into text + highlighted mention spans.
 * Matches `@` followed by a word character run (letters, digits,
 * underscore, dot, hyphen) — e.g. @priya.k, @samridh-limbu.
 */
function renderMentions(text: string): ReactNode[] {
  // Capture group puts matched mentions into the split result at odd
  // indices so we can style them inline without a stateful regex test.
  const parts = text.split(/(@[\w][\w.\-]*)/g);
  return parts.map((part, idx) =>
    part.startsWith("@") ? (
      <span
        key={idx}
        className="text-primary font-medium bg-primary/5 rounded px-1 py-0.5"
      >
        {part}
      </span>
    ) : (
      <Fragment key={idx}>{part}</Fragment>
    ),
  );
}

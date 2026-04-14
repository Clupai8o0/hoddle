/**
 * Generates a URL-safe slug from a title string.
 * Appends a base-36 timestamp to guarantee uniqueness.
 */
export function generateSlug(title: string, maxLength = 60): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, maxLength);
  return `${base}-${Date.now().toString(36)}`;
}

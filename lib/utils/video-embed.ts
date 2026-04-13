/**
 * Parse a YouTube or Vimeo URL and return a safe embed URL.
 * Returns null if the URL is not a recognised video URL.
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

    return null;
  } catch {
    return null;
  }
}

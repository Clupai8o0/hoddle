function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") {
      return parsed.searchParams.get("v");
    }
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnailUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

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

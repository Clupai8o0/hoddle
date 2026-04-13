"use client";

import { useEffect, useRef } from "react";
import { incrementViewCount } from "@/lib/actions/content-items";

export function ViewTracker({ contentId }: { contentId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      incrementViewCount(contentId);
    }
  }, [contentId]);
  return null;
}

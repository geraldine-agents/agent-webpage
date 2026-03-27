"use client";

import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    const payload = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${window.screen.width}x${window.screen.height}`,
      device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      path: window.location.pathname,
    };

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }, []);

  return null;
}

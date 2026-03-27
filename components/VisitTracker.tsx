"use client";

import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const payload = {
      timezone,
      screen: `${window.screen.width}x${window.screen.height}`,
      device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      path: window.location.pathname,
      visitedAt: new Date().toLocaleString("en-GB", { timeZone: timezone, dateStyle: "full", timeStyle: "short" }),
    };

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }, []);

  return null;
}

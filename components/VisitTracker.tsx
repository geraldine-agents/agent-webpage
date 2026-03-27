"use client";

import { useEffect, useRef } from "react";

const SECTION_LABELS: Record<string, string> = {
  projects: "Featured Projects",
  book: "Book a Call",
  recruiter: "Recruiter Chat",
  cv: "CV",
  demo: "Live AI Demo",
};

export default function VisitTracker() {
  const messageIdRef = useRef<number | null>(null);
  const originalTextRef = useRef<string>("");
  const clicksRef = useRef<string[]>([]);
  const sectionsRef = useRef<string[]>([]);
  const maxScrollRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // Send initial visit notification
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const payload = {
      timezone,
      screen: `${window.screen.width}x${window.screen.height}`,
      device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      path: window.location.pathname,
      visitedAt: new Date().toLocaleString("en-GB", {
        timeZone: timezone,
        dateStyle: "full",
        timeStyle: "short",
      }),
    };

    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.messageId) messageIdRef.current = data.messageId;
        if (data.text) originalTextRef.current = data.text;
      });

    // Track link and button clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      const button = target.closest("button");

      let label: string | null = null;

      if (anchor) {
        const href = anchor.href || "";
        if (href.includes("linkedin")) label = "LinkedIn";
        else if (href.includes("mailto")) label = `Email`;
        else if (href.includes("calendar")) label = "Schedule a Call";
        else {
          const text = anchor.innerText.trim();
          if (text) label = text;
        }
      } else if (button) {
        const text = button.innerText.trim();
        if (text) label = text;
      }

      if (label && !clicksRef.current.includes(label)) {
        clicksRef.current.push(label);
      }
    };

    // Track scroll depth
    const handleScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;
    };

    // Track sections viewed via IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const label = SECTION_LABELS[id];
            if (label && !sectionsRef.current.includes(label)) {
              sectionsRef.current.push(label);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    Object.keys(SECTION_LABELS).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Send update when visitor leaves
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && messageIdRef.current) {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeOnPage = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        navigator.sendBeacon(
          "/api/notify/update",
          new Blob(
            [
              JSON.stringify({
                messageId: messageIdRef.current,
                originalText: originalTextRef.current,
                clicks: clicksRef.current,
                sections: sectionsRef.current,
                scrollDepth: maxScrollRef.current,
                timeOnPage,
              }),
            ],
            { type: "application/json" }
          )
        );
      }
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return null;
}

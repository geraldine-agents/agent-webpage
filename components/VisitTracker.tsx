"use client";

import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    fetch("/api/notify", { method: "POST" });
  }, []);

  return null;
}

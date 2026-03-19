"use client";

import { useState } from "react";
import Image from "next/image";

export default function CVViewer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] transition-colors duration-200 text-[0.85rem] text-[#a1a1aa]"
      >
        <svg
          className="w-4 h-4 text-[#52525b]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>{isOpen ? "Hide CV" : "View CV"}</span>
        <span className={`text-[#52525b] text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
            <span className="text-[0.85rem] text-[#e2e8f0] font-medium">Curriculum Vitae</span>
          </div>

          {/* CV Image */}
          <div className="overflow-auto max-h-[750px] flex justify-center bg-[#09090b] p-6">
            <Image
              src="/cv_geraldine.png"
              alt="Curriculum Vitae"
              width={700}
              height={990}
              className="shadow-2xl max-w-full h-auto"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function CVViewer() {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(700);

  useEffect(() => {
    const update = () => {
      setWidth(Math.min(window.innerWidth - 80, 700));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700/60 bg-[#0d0d1f] hover:border-slate-600 hover:bg-[#0f0f22] transition-all text-sm text-slate-300 group"
      >
        <svg
          className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors"
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
        <span className="group-hover:text-slate-200 transition-colors">
          {isOpen ? "Hide CV" : "View CV"}
        </span>
        <span
          className={`text-slate-500 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Controls header — no download button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-[#0d0d1f]">
            <span className="text-sm text-slate-300 font-medium">Curriculum Vitae</span>
            {numPages > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber <= 1}
                  className="px-2.5 py-1 text-xs rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-xs text-slate-500">
                  {pageNumber} / {numPages}
                </span>
                <button
                  onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                  disabled={pageNumber >= numPages}
                  className="px-2.5 py-1 text-xs rounded border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Canvas-rendered PDF — no browser PDF toolbar or download button */}
          <div className="overflow-auto max-h-[750px] flex justify-center bg-[#0a0a0f] p-6">
            <Document
              file="/cv_geraldine.pdf"
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setPageNumber(1);
              }}
              loading={
                <div className="flex items-center gap-2 text-slate-500 text-sm py-12">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading CV…
                </div>
              }
              error={
                <div className="text-red-400 text-sm py-12">
                  Could not load CV. Please try refreshing the page.
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={true}
                width={width}
                className="shadow-2xl"
              />
            </Document>
          </div>
        </div>
      )}
    </div>
  );
}

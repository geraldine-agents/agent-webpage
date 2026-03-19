import dynamic from "next/dynamic";
import Chat from "@/components/Chat";
import RecruiterChat from "@/components/RecruiterChat";

const CVViewer = dynamic(() => import("@/components/CVViewer"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 py-12">
      {/* ── Profile header ──────────────────────────────────────────── */}
      <header className="w-full max-w-3xl mx-auto mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-violet-500/20">
              GL
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>

          {/* Name + badges */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold gradient-text">
                Geraldine Lomeli
              </h1>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Available for hire
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Remote · USD
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-3">
              AI & ML Engineer · 6+ years data experience · Agentic systems, LLM orchestration, MLOps
            </p>

            {/* Links */}
            <div className="flex flex-wrap gap-3">
<a
                href="https://www.linkedin.com/in/geraldine-lomeli/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors group"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="group-hover:underline">LinkedIn</span>
              </a>
              <a
                href="mailto:geralwrks@gmail.com"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors group"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="group-hover:underline">Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Skill chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "LangChain",
            "LangGraph",
            "Groq",
            "Gemini",
            "RAG",
            "Agentic Loops",
            "Python",
            "TypeScript",
            "Spark",
            "MLOps",
            "FastAPI",
            "AWS",
          ].map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/60 text-slate-400 border border-slate-700/50"
            >
              {skill}
            </span>
          ))}
        </div>
      </header>

      {/* ── SECTION 1: Recruiter Agent (primary) ────────────────────── */}
      <section id="recruiter" className="w-full max-w-3xl mx-auto mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
          </span>
          <h2 className="text-lg font-semibold text-slate-200">Ask Me Anything</h2>
          <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
            AI recruiter assistant · Always available
          </span>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-[#0d0d1f] p-5">
          <RecruiterChat />
        </div>
      </section>

      {/* ── SECTION 2: CV Viewer ─────────────────────────────────────── */}
      <section id="cv" className="w-full max-w-3xl mx-auto mb-16">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-200">Curriculum Vitae</h2>
          <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
            View inline
          </span>
        </div>
        <CVViewer />
      </section>

      {/* ── SECTION 3: Live AI Agent Demo (existing) ─────────────────── */}
      <section id="demo" className="w-full max-w-3xl mx-auto mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h2 className="text-lg font-semibold text-slate-200">Live AI Agent Demo</h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
            Powered by llama-3.3-70b on Groq
          </span>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {[
            { icon: "🔧", label: "Tool Use", desc: "5 live tools" },
            { icon: "♾️", label: "Agentic Loop", desc: "Multi-step reasoning" },
            { icon: "⚡", label: "Streaming", desc: "Real-time SSE" },
            { icon: "🔒", label: "Secure", desc: "Your key, your data" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-lg bg-[#0d0d1f] border border-slate-700/40 p-3 text-center"
            >
              <div className="text-lg mb-1">{f.icon}</div>
              <div className="text-xs font-medium text-slate-300">{f.label}</div>
              <div className="text-xs text-slate-600 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>

        <Chat />
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="w-full max-w-3xl mx-auto mt-16 pt-8 border-t border-slate-800/50 text-center">
        <p className="text-xs text-slate-600">
          Built with Next.js 14 · TypeScript · Tailwind CSS · Groq SDK
        </p>
        <p className="text-xs text-slate-700 mt-1">
          Source available on GitHub · Deploy to Vercel in one click
        </p>
      </footer>
    </main>
  );
}

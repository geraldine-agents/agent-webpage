import dynamic from "next/dynamic";
import Chat from "@/components/Chat";
import RecruiterChat from "@/components/RecruiterChat";

const CVViewer = dynamic(() => import("@/components/CVViewer"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-16">
      {/* ── Profile header ──────────────────────────────────────────── */}
      <header className="w-full max-w-[960px] mx-auto mb-20 fade-in">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-base font-semibold text-[#e2e8f0]">
            GL
          </div>

          {/* Name + content */}
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline gap-3 mb-3">
              <h1 className="hero-name">Geraldine Lomeli</h1>
              <span className="px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.08em] rounded bg-white/[0.05] text-[#a1a1aa] border border-white/[0.08]">
                Available
              </span>
              <span className="px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.08em] rounded bg-white/[0.05] text-[#a1a1aa] border border-white/[0.08]">
                Remote · USD
              </span>
            </div>

            <p className="text-[0.9rem] text-[#a1a1aa] leading-[1.7] mb-1.5 max-w-lg">
              I build production AI agents and ML systems that deliver measurable business outcomes.
            </p>
            <p className="text-[0.75rem] text-[#52525b] mb-5">
              MSc Data Science (NLP) · BSc Physics · 6+ years data experience
            </p>

            {/* Links */}
            <div className="flex flex-wrap gap-5">
              <a
                href="https://www.linkedin.com/in/geraldine-lomeli/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[0.8rem] text-[#52525b] hover:text-[#a1a1aa] transition-colors duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a
                href="mailto:geralwrks@gmail.com"
                className="flex items-center gap-1.5 text-[0.8rem] text-[#52525b] hover:text-[#a1a1aa] transition-colors duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
            </div>
          </div>
        </div>

        {/* Skill chips */}
        <div className="mt-8 flex flex-wrap gap-2">
          {[
            "LangChain", "LangGraph", "Groq", "Gemini", "RAG",
            "Agentic Loops", "Python", "TypeScript", "Spark", "MLOps", "FastAPI", "AWS",
          ].map((skill) => (
            <span
              key={skill}
              className="px-[10px] py-[4px] text-[0.75rem] rounded-[6px] bg-white/[0.05] text-[#a1a1aa] border border-white/[0.08]"
            >
              {skill}
            </span>
          ))}
        </div>
      </header>

      {/* ── SECTION 1: Featured Projects ─────────────────────────────── */}
      <section id="projects" className="w-full max-w-[960px] mx-auto mb-20">
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-[0.9rem] font-semibold text-[#e2e8f0]">Featured Projects</h2>
          <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[#52525b]">Selected work</span>
        </div>

        <div className="flex flex-col gap-4">
          {/* Project 1 */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.05] transition-colors duration-200">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-[0.9rem] font-semibold text-[#e2e8f0]">AI Quotation Agent</h3>
                <p className="text-[0.75rem] text-[#52525b] mt-0.5">IT Infrastructure & Digital Services</p>
              </div>
              <span className="flex-shrink-0 px-2.5 py-1 text-[0.7rem] rounded-[6px] bg-white/[0.05] text-[#a1a1aa] border border-white/[0.08]">
                96% faster
              </span>
            </div>
            <p className="text-[0.85rem] text-[#a1a1aa] leading-[1.7] mb-4">
              Architected a high-performance agentic system that autonomously orchestrates real-time product queries via GraphQL and REST APIs, cutting quotation time from 2 hours to 5 minutes.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["LangChain ReAct", "LLaMA 3.3", "Groq", "GraphQL", "REST APIs"].map((t) => (
                <span key={t} className="px-[10px] py-[3px] text-[0.72rem] rounded-[6px] bg-white/[0.05] text-[#52525b] border border-white/[0.08]">{t}</span>
              ))}
            </div>
          </div>

          {/* Project 2 */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.05] transition-colors duration-200">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-[0.9rem] font-semibold text-[#e2e8f0]">Agentic B2C Pricing Engine</h3>
                <p className="text-[0.75rem] text-[#52525b] mt-0.5">IT Infrastructure & Digital Services</p>
              </div>
              <span className="flex-shrink-0 px-2.5 py-1 text-[0.7rem] rounded-[6px] bg-white/[0.05] text-[#a1a1aa] border border-white/[0.08]">
                +8% conversion
              </span>
            </div>
            <p className="text-[0.85rem] text-[#a1a1aa] leading-[1.7] mb-4">
              Engineered an autonomous pricing engine that adjusts SKU prices based on real-time market signals, delivering a direct 8% lift in conversion rates.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Gemini 2.5 Flash", "LangChain", "Agentic Loops", "Python"].map((t) => (
                <span key={t} className="px-[10px] py-[3px] text-[0.72rem] rounded-[6px] bg-white/[0.05] text-[#52525b] border border-white/[0.08]">{t}</span>
              ))}
            </div>
          </div>

          {/* Project 3 */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.05] transition-colors duration-200">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-[0.9rem] font-semibold text-[#e2e8f0]">Clinical Data Lakehouse</h3>
                <p className="text-[0.75rem] text-[#52525b] mt-0.5">B2C Medical Laboratory</p>
              </div>
              <span className="flex-shrink-0 px-2.5 py-1 text-[0.7rem] rounded-[6px] bg-white/[0.05] text-[#a1a1aa] border border-white/[0.08]">
                20k+ patients
              </span>
            </div>
            <p className="text-[0.85rem] text-[#a1a1aa] leading-[1.7] mb-4">
              Architected a clinical data lakehouse spanning 20k+ patients across 200+ studies, with AI-ready ETL pipelines for large-scale predictive modeling and an intelligent recommendation engine for personalized lab analyses.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Data Lakehouse", "ETL Pipelines", "Recommendation Engine", "BigQuery", "Python"].map((t) => (
                <span key={t} className="px-[10px] py-[3px] text-[0.72rem] rounded-[6px] bg-white/[0.05] text-[#52525b] border border-white/[0.08]">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: Book a Call ───────────────────────────────────── */}
      <section id="book" className="w-full max-w-[960px] mx-auto mb-20">
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-[0.9rem] font-semibold text-[#e2e8f0]">Book a Call</h2>
          <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[#52525b]">Schedule time with me</span>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-[0.85rem] text-[#a1a1aa] leading-[1.7] mb-1">
              Interested in working together? Pick a time that works for you — I&apos;m open to introductory calls, technical discussions, and interviews.
            </p>
          </div>
          <a
            href="https://calendar.app.google/ULxkX2oiLEPHgmfs5"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#6366f1] hover:bg-[#818cf8] text-white text-[0.85rem] font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule a call
          </a>
        </div>
      </section>

      {/* ── SECTION 3: Recruiter Agent ───────────────────────────────── */}
      <section id="recruiter" className="w-full max-w-[960px] mx-auto mb-20">
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-[0.9rem] font-semibold text-[#e2e8f0]">Ask Me Anything</h2>
          <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[#52525b]">AI recruiter assistant</span>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6">
          <RecruiterChat />
        </div>
      </section>

      {/* ── SECTION 4: CV Viewer ─────────────────────────────────────── */}
      <section id="cv" className="w-full max-w-[960px] mx-auto mb-20">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="text-[0.9rem] font-semibold text-[#e2e8f0]">Curriculum Vitae</h2>
          <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[#52525b]">View inline</span>
        </div>
        <CVViewer />
      </section>

      {/* ── SECTION 5: Live AI Agent Demo ────────────────────────────── */}
      <section id="demo" className="w-full max-w-[960px] mx-auto mb-20">
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-[0.9rem] font-semibold text-[#e2e8f0]">Live AI Agent Demo</h2>
          <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[#52525b]">llama-3.3-70b · Groq</span>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Tool Use", desc: "5 live tools" },
            { label: "Agentic Loop", desc: "Multi-step reasoning" },
            { label: "Streaming", desc: "Real-time SSE" },
            { label: "Secure", desc: "Your key, your data" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center"
            >
              <div className="text-[0.8rem] font-medium text-[#e2e8f0] mb-0.5">{f.label}</div>
              <div className="text-[0.72rem] text-[#52525b]">{f.desc}</div>
            </div>
          ))}
        </div>

        <Chat />
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="w-full max-w-[960px] mx-auto mt-20 pt-8 border-t border-white/[0.06] text-center">
        <p className="text-[0.75rem] text-[#52525b]">
          Built with Next.js 14 · TypeScript · Tailwind CSS · Groq SDK
        </p>
        <p className="text-[0.75rem] text-[#52525b] mt-1">
          <a href="mailto:geralwrks@gmail.com" className="hover:text-[#a1a1aa] transition-colors duration-200">
            geralwrks@gmail.com
          </a>
        </p>
      </footer>
    </main>
  );
}

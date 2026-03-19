"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToolStatus = "running" | "done";

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  status: ToolStatus;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  {
    label: "Her background",
    prompt: "Give me a quick summary of Geraldine's experience and what she specializes in.",
  },
  {
    label: "Strongest AI/ML skills",
    prompt: "What are Geraldine's strongest technical skills for an AI/ML engineering role?",
  },
  {
    label: "Availability",
    prompt: "Is Geraldine currently available for new opportunities, and what are her working preferences?",
  },
  {
    label: "How to reach her",
    prompt: "How can I get in touch with Geraldine to discuss a role?",
  },
];

// ── Markdown-lite renderer ────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="bg-[#0d0d1f] border border-slate-700 rounded-lg p-3 my-2 overflow-x-auto text-sm text-violet-300 font-mono">$1</pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-[#0d0d1f] text-violet-300 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-300">$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-slate-100 mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-slate-100 mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-slate-100 mt-4 mb-2">$1</h1>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br/>");
}

// ── Main RecruiterChat component ──────────────────────────────────────────────

export default function RecruiterChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = { role: "user", text: text.trim() };
      const assistantMsg: Message = {
        role: "assistant",
        text: "",
        toolCalls: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsLoading(true);

      const history = [
        ...messages,
        { role: "user" as const, text: text.trim() },
      ].map((m) => ({
        role: m.role,
        content: m.text || " ",
      }));

      try {
        const res = await fetch("/api/recruiter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            if (event.type === "text_delta") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  return [
                    ...updated.slice(0, -1),
                    { ...last, text: last.text + (event.text as string) },
                  ];
                }
                return updated;
              });
            } else if (event.type === "done") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  return [...updated.slice(0, -1), { ...last, isStreaming: false }];
                }
                return updated;
              });
            } else if (event.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  return [
                    ...updated.slice(0, -1),
                    {
                      ...last,
                      text: `⚠️ ${event.message as string}`,
                      isStreaming: false,
                    },
                  ];
                }
                return updated;
              });
            }
          }
        }
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            return [
              ...updated.slice(0, -1),
              {
                ...last,
                text: `⚠️ Network error: ${err instanceof Error ? err.message : String(err)}`,
                isStreaming: false,
              },
            ];
          }
          return updated;
        });
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [messages, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <section className="w-full">
      {/* Welcome + suggested prompts */}
      {messages.length === 0 && (
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-4">
            Hi! I&apos;m Geraldine&apos;s AI assistant. Ask me anything about her experience, skills, projects, or availability.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.prompt)}
                disabled={isLoading}
                className="text-left px-4 py-3 rounded-xl border border-slate-700/60 bg-[#0d0d1f] hover:border-violet-500/40 hover:bg-[#0f0f22] transition-all text-sm text-slate-300 group"
              >
                <span className="font-medium text-slate-200 group-hover:text-violet-300 transition-colors block mb-0.5">
                  {p.label}
                </span>
                <span className="text-xs text-slate-500 line-clamp-2">{p.prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="mb-4 space-y-4 min-h-[200px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-violet-600/80 text-white text-sm">
                  {msg.text}
                </div>
              ) : (
                <div className="w-full rounded-xl bg-[#0d0d1f] border border-slate-700/50 p-4">
                  {msg.text ? (
                    <div
                      className={`text-sm text-slate-300 leading-relaxed prose-invert ${msg.isStreaming ? "cursor-blink" : ""}`}
                      dangerouslySetInnerHTML={{
                        __html: `<p class="mt-0">${renderMarkdown(msg.text)}</p>`,
                      }}
                    />
                  ) : msg.isStreaming ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <svg className="w-4 h-4 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-xs">Thinking…</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="relative rounded-xl border border-slate-700/60 bg-[#0d0d1f] focus-within:border-violet-500/40 transition-colors">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Geraldine's experience, skills, availability… (Enter to send)"
          disabled={isLoading}
          rows={3}
          className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <span className="text-xs text-slate-600">
            {input.length > 0 ? `${input.length} chars` : ""}
          </span>
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all font-medium"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Thinking</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clear chat */}
      {messages.length > 0 && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Clear conversation
          </button>
        </div>
      )}
    </section>
  );
}

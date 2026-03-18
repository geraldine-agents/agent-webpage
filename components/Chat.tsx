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
    label: "🌤 Weather + Wikipedia",
    prompt: "What's the weather in Tokyo and what are the top things to do there?",
  },
  {
    label: "🧮 Compound Interest",
    prompt: "If I invest $10,000 at 7% compound interest for 20 years, how much will I have?",
  },
  {
    label: "📚 LLMs Explained",
    prompt: "Tell me about large language models and transformer architecture",
  },
  {
    label: "📰 HN AI News",
    prompt: "What's trending in AI and ML on Hacker News today?",
  },
];

const TOOL_LABELS: Record<string, string> = {
  get_weather: "🌤 Weather",
  get_wikipedia: "📚 Wikipedia",
  calculate: "🧮 Calculator",
  get_current_datetime: "🕐 DateTime",
  get_news: "📰 Hacker News",
};

// ── Markdown-lite renderer ────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="bg-[#0d0d1f] border border-slate-700 rounded-lg p-3 my-2 overflow-x-auto text-sm text-emerald-300 font-mono">$1</pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-[#0d0d1f] text-cyan-300 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-100 font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="text-slate-300">$1</em>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-slate-100 mt-3 mb-1">$1</h3>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-slate-100 mt-4 mb-2">$1</h2>')
    // H1
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-slate-100 mt-4 mb-2">$1</h1>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-slate-300">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-300">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, "<br/>");
}

// ── ToolCard component ────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = tool.status === "running";

  let resultPreview = "";
  if (tool.result) {
    try {
      const parsed = JSON.parse(tool.result);
      resultPreview = JSON.stringify(parsed, null, 2);
    } catch {
      resultPreview = tool.result;
    }
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2 my-1 text-sm transition-all duration-300 ${
        isRunning
          ? "border-amber-500/50 bg-amber-500/5 tool-running"
          : "border-emerald-500/40 bg-emerald-500/5"
      }`}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 text-left"
      >
        {isRunning ? (
          <svg
            className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-emerald-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        <span
          className={`font-medium ${isRunning ? "text-amber-300" : "text-emerald-300"}`}
        >
          {TOOL_LABELS[tool.name] || tool.name}
        </span>
        <span className="text-slate-500 text-xs ml-1">
          {isRunning ? "running…" : "done"}
        </span>
        <span className="ml-auto text-slate-600 text-xs">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-2">
          <div>
            <span className="text-slate-500 text-xs uppercase tracking-wide">Input</span>
            <pre className="text-xs text-slate-300 mt-1 overflow-x-auto bg-[#0a0a14] rounded p-2">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          {resultPreview && (
            <div>
              <span className="text-slate-500 text-xs uppercase tracking-wide">Result</span>
              <pre className="text-xs text-slate-300 mt-1 overflow-x-auto bg-[#0a0a14] rounded p-2 max-h-48">
                {resultPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Chat component ───────────────────────────────────────────────────────

export default function Chat() {
  const [apiKey, setApiKey] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if server has a key configured
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setHasServerKey(!!data.hasServerKey))
      .catch(() => {});
  }, []);

  // Load API key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("groq_api_key");
    if (saved) {
      setApiKey(saved);
      setKeySaved(true);
    }
  }, []);

  // Ready to chat: either server has a key or user has saved one
  const canChat = hasServerKey || keySaved;

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("groq_api_key", apiKey.trim());
      setKeySaved(true);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem("groq_api_key");
    setApiKey("");
    setKeySaved(false);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !canChat || isLoading) return;

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

      // Build history for API (exclude current streaming message)
      const history = [
        ...messages,
        { role: "user" as const, text: text.trim() },
      ].map((m) => ({
        role: m.role,
        content: m.text || " ",
      }));

      try {
        const body: { messages: typeof history; apiKey?: string } = { messages: history };
        if (apiKey.trim()) body.apiKey = apiKey.trim();

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
            } else if (event.type === "tool_use") {
              const newTool: ToolCall = {
                id: event.id as string,
                name: event.name as string,
                input: (event.input as Record<string, unknown>) || {},
                status: "running",
              };
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  return [
                    ...updated.slice(0, -1),
                    {
                      ...last,
                      toolCalls: [...(last.toolCalls || []), newTool],
                    },
                  ];
                }
                return updated;
              });
            } else if (event.type === "tool_result") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  const updatedTools = (last.toolCalls || []).map((t) =>
                    t.id === (event.id as string)
                      ? { ...t, result: event.result as string, status: "done" as ToolStatus }
                      : t
                  );
                  return [
                    ...updated.slice(0, -1),
                    { ...last, toolCalls: updatedTools },
                  ];
                }
                return updated;
              });
            } else if (event.type === "done") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  return [
                    ...updated.slice(0, -1),
                    { ...last, isStreaming: false },
                  ];
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
                      text: `⚠️ Error: ${event.message as string}`,
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
    [messages, apiKey, canChat, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <section className="w-full max-w-3xl mx-auto">
      {/* API Key section — hidden when server provides a key */}
      {!hasServerKey && (
        <div className="mb-6 rounded-xl border border-slate-700/50 bg-[#0d0d1f] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🔑</span>
            <span className="text-sm font-medium text-slate-300">
              Groq API Key
            </span>
            {keySaved && (
              <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Saved locally
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={keyVisible ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
                placeholder="gsk_..."
                className="w-full bg-[#0a0a14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors pr-10"
              />
              <button
                onClick={() => setKeyVisible((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {keyVisible ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={saveApiKey}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium"
            >
              Save
            </button>
            {keySaved && (
              <button
                onClick={clearApiKey}
                className="px-3 py-2 border border-slate-700 hover:border-red-500/50 hover:text-red-400 text-slate-400 text-sm rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Your key is stored only in your browser&apos;s localStorage and sent directly to Groq. Never stored on any server.
          </p>
        </div>
      )}

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Try these examples
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => canChat ? sendMessage(p.prompt) : setInput(p.prompt)}
                disabled={isLoading}
                className="text-left px-4 py-3 rounded-xl border border-slate-700/60 bg-[#0d0d1f] hover:border-emerald-500/40 hover:bg-[#0f0f22] transition-all text-sm text-slate-300 group"
              >
                <span className="font-medium text-slate-200 group-hover:text-emerald-300 transition-colors block mb-0.5">
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
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-indigo-600/80 text-white text-sm">
                  {msg.text}
                </div>
              ) : (
                <div className="w-full rounded-xl bg-[#0d0d1f] border border-slate-700/50 p-4">
                  {/* Tool calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {msg.toolCalls.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  )}
                  {/* Text */}
                  {msg.text ? (
                    <div
                      className={`text-sm text-slate-300 leading-relaxed prose-invert ${msg.isStreaming ? "cursor-blink" : ""}`}
                      dangerouslySetInnerHTML={{
                        __html: `<p class="mt-0">${renderMarkdown(msg.text)}</p>`,
                      }}
                    />
                  ) : msg.isStreaming ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <svg className="w-4 h-4 animate-spin text-emerald-500" fill="none" viewBox="0 0 24 24">
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
      <div className="relative rounded-xl border border-slate-700/60 bg-[#0d0d1f] focus-within:border-emerald-500/40 transition-colors">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            canChat
              ? "Ask anything… (Enter to send, Shift+Enter for new line)"
              : "Enter your API key above, then ask anything…"
          }
          disabled={isLoading || !canChat}
          rows={3}
          className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <span className="text-xs text-slate-600">
            {input.length > 0 ? `${input.length} chars` : ""}
          </span>
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !canChat || !input.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all font-medium"
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

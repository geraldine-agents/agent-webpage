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

function buildPrompts(city: string | null) {
  const place = city || "my city";
  return [
    {
      label: "Weather + Things to Do",
      prompt: `What's the weather in ${place} and what are the top things to do there?`,
    },
  ];
}

const TOOL_LABELS: Record<string, string> = {
  get_weather: "Weather",
  get_wikipedia: "Wikipedia",
  calculate: "Calculator",
  get_current_datetime: "DateTime",
  get_news: "Hacker News",
};

// ── Markdown-lite renderer ────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="bg-[#09090b] border border-white/[0.06] rounded-lg p-3 my-2 overflow-x-auto text-[0.8rem] text-[#a1a1aa] font-mono">$1</pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-[#09090b] text-[#e2e8f0] px-1 py-0.5 rounded text-[0.8rem] font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e2e8f0] font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#a1a1aa]">$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-[0.9rem] font-semibold text-[#e2e8f0] mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-[#e2e8f0] mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-[#e2e8f0] mt-4 mb-2">$1</h1>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-[#a1a1aa]">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-[#a1a1aa]">$1</li>')
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
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 my-1 text-[0.85rem]">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 text-left"
      >
        {isRunning ? (
          <svg className="w-3.5 h-3.5 text-[#6366f1] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-[#a1a1aa] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className={`font-medium ${isRunning ? "text-[#6366f1]" : "text-[#e2e8f0]"}`}>
          {TOOL_LABELS[tool.name] || tool.name}
        </span>
        <span className="text-[#52525b] text-[0.72rem] ml-1">
          {isRunning ? "running…" : "done"}
        </span>
        <span className="ml-auto text-[#52525b] text-[0.72rem]">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/[0.06] space-y-2">
          <div>
            <span className="text-[#52525b] text-[0.7rem] uppercase tracking-[0.08em]">Input</span>
            <pre className="text-[0.75rem] text-[#a1a1aa] mt-1 overflow-x-auto bg-[#09090b] rounded p-2">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </div>
          {resultPreview && (
            <div>
              <span className="text-[#52525b] text-[0.7rem] uppercase tracking-[0.08em]">Result</span>
              <pre className="text-[0.75rem] text-[#a1a1aa] mt-1 overflow-x-auto bg-[#09090b] rounded p-2 max-h-48">
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

export default function Chat({ compact = false }: { compact?: boolean }) {
  const [apiKey, setApiKey] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [hasServerKey, setHasServerKey] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorCity, setVisitorCity] = useState<string | null>(null);
  const [undertoneImage, setUndertoneImage] = useState<string | null>(null);
  const [undertoneMime, setUndertoneMime] = useState<string>("image/jpeg");
  const [undertoneResult, setUndertoneResult] = useState<string | null>(null);
  const [undertoneLoading, setUndertoneLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setHasServerKey(!!data.hasServerKey))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data) => setVisitorCity(data.city))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("groq_api_key");
    if (saved) {
      setApiKey(saved);
      setKeySaved(true);
    }
  }, []);

  const canChat = hasServerKey || keySaved;

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUndertoneMime(file.type || "image/jpeg");
    setUndertoneResult(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setUndertoneImage(dataUrl);
      setUndertoneLoading(true);
      try {
        const res = await fetch("/api/undertone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type, apiKey: apiKey.trim() || undefined }),
        });
        const data = await res.json();
        setUndertoneResult(data.result || data.error || "No result.");
      } catch {
        setUndertoneResult("Something went wrong. Please try again.");
      } finally {
        setUndertoneLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !canChat || isLoading) return;

      const userMsg: Message = { role: "user", text: text.trim() };
      const assistantMsg: Message = { role: "assistant", text: "", toolCalls: [], isStreaming: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsLoading(true);

      const history = [
        ...messages,
        { role: "user" as const, text: text.trim() },
      ].map((m) => ({ role: m.role, content: m.text || " " }));

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
            try { event = JSON.parse(jsonStr); } catch { continue; }

            if (event.type === "text_delta") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  return [...updated.slice(0, -1), { ...last, text: last.text + (event.text as string) }];
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
                  return [...updated.slice(0, -1), { ...last, toolCalls: [...(last.toolCalls || []), newTool] }];
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
                  return [...updated.slice(0, -1), { ...last, toolCalls: updatedTools }];
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
                  return [...updated.slice(0, -1), { ...last, text: `⚠️ Error: ${event.message as string}`, isStreaming: false }];
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
            return [...updated.slice(0, -1), { ...last, text: `⚠️ Network error: ${err instanceof Error ? err.message : String(err)}`, isStreaming: false }];
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
    <div className={compact ? "flex flex-col h-full overflow-hidden" : "w-full"}>
      {/* API Key section */}
      {!hasServerKey && (
        <div className={`${compact ? "mb-3 flex-shrink-0" : "mb-6"} rounded-xl border border-white/[0.06] bg-white/[0.03] p-5`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[0.85rem] font-medium text-[#e2e8f0]">Groq API Key</span>
            {keySaved && (
              <span className="ml-auto text-[0.72rem] text-[#a1a1aa] flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                className="w-full bg-[#09090b] border border-white/[0.06] rounded-lg px-3 py-2 text-[0.9rem] text-[#a1a1aa] placeholder-[#52525b] focus:outline-none focus:border-white/[0.15] transition-colors pr-10"
              />
              <button
                onClick={() => setKeyVisible((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
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
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[0.85rem] rounded-lg transition-colors duration-200 font-medium"
            >
              Save
            </button>
            {keySaved && (
              <button
                onClick={clearApiKey}
                className="px-3 py-2 border border-white/[0.06] hover:border-white/[0.12] text-[#52525b] hover:text-[#a1a1aa] text-[0.85rem] rounded-lg transition-colors duration-200"
              >
                Clear
              </button>
            )}
          </div>
          <p className="mt-2 text-[0.72rem] text-[#52525b]">
            Your key is stored only in your browser&apos;s localStorage and sent directly to Groq. Never stored on any server.
          </p>
        </div>
      )}

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className={compact ? "flex-1 overflow-y-auto min-h-0 pb-2" : "mb-6"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {buildPrompts(visitorCity).map((p) => (
              <button
                key={p.label}
                onClick={() => canChat ? sendMessage(p.prompt) : setInput(p.prompt)}
                disabled={isLoading}
                className="text-left px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] transition-colors duration-200 disabled:opacity-40"
              >
                <span className="text-[0.85rem] font-medium text-[#e2e8f0] block mb-0.5">
                  {p.label}
                </span>
                <span className="text-[0.75rem] text-[#52525b] line-clamp-2">{p.prompt}</span>
              </button>
            ))}

            {/* Skin Undertone Card */}
            <div className="px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <span className="text-[0.85rem] font-medium text-[#e2e8f0] block mb-0.5">Skin Undertone</span>
              <span className="text-[0.75rem] text-[#52525b] block mb-3">Upload a photo and find out if your undertone is warm, cool, or neutral.</span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {!undertoneImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canChat}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[#a1a1aa] text-[0.78rem] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload photo
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={undertoneImage} alt="Uploaded" className="w-12 h-12 rounded-lg object-cover border border-white/[0.08]" />
                    <button
                      onClick={() => { setUndertoneImage(null); setUndertoneResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-[0.72rem] text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  {undertoneLoading && (
                    <div className="flex items-center gap-2 text-[#52525b] text-[0.78rem]">
                      <svg className="w-3.5 h-3.5 animate-spin text-[#6366f1]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing…
                    </div>
                  )}
                  {undertoneResult && (
                    <p className="text-[0.78rem] text-[#a1a1aa] leading-[1.6]">{undertoneResult}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className={compact ? "flex-1 overflow-y-auto min-h-0 space-y-4 pr-0.5" : "mb-4 space-y-4 min-h-[200px]"}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[#6366f1] text-white text-[0.9rem]">
                  {msg.text}
                </div>
              ) : (
                <div className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mb-3 space-y-1">
                      {msg.toolCalls.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  )}
                  {msg.text ? (
                    <div
                      className={`text-[0.9rem] text-[#a1a1aa] leading-[1.7] prose-invert ${msg.isStreaming ? "cursor-blink" : ""}`}
                      dangerouslySetInnerHTML={{ __html: `<p class="mt-0">${renderMarkdown(msg.text)}</p>` }}
                    />
                  ) : msg.isStreaming ? (
                    <div className="flex items-center gap-2 text-[#52525b] text-[0.85rem]">
                      <svg className="w-4 h-4 animate-spin text-[#6366f1]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Thinking…</span>
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
      <div className="relative rounded-xl border border-white/[0.06] bg-white/[0.03] focus-within:border-white/[0.12] transition-colors duration-200">
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
          className="w-full bg-transparent px-4 py-3 text-[0.9rem] text-[#a1a1aa] placeholder-[#52525b] focus:outline-none resize-none disabled:opacity-50"
        />
        <div className="flex items-center justify-between px-3 pb-3">
          <span className="text-[0.72rem] text-[#52525b]">
            {input.length > 0 ? `${input.length} chars` : ""}
          </span>
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !canChat || !input.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#6366f1] hover:bg-[#818cf8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[0.85rem] rounded-lg transition-colors duration-200 font-medium"
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
            className="text-[0.75rem] text-[#52525b] hover:text-[#a1a1aa] transition-colors duration-200"
          >
            Clear conversation
          </button>
        </div>
      )}
    </div>
  );
}

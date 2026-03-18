import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── Tool definitions ──────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description:
      "Get the current weather for a city. Returns temperature, conditions, humidity, and wind.",
    input_schema: {
      type: "object" as const,
      properties: {
        city: {
          type: "string",
          description: "City name, e.g. 'Tokyo' or 'New York'",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "get_wikipedia",
    description:
      "Fetch a Wikipedia article summary for a topic. Returns the intro paragraphs.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "The topic to look up on Wikipedia",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "calculate",
    description:
      "Evaluate a mathematical expression safely. Supports standard arithmetic, Math functions (sqrt, pow, log, etc.), and variables.",
    input_schema: {
      type: "object" as const,
      properties: {
        expression: {
          type: "string",
          description:
            "A safe mathematical expression, e.g. '10000 * Math.pow(1.07, 20)'",
        },
      },
      required: ["expression"],
    },
  },
  {
    name: "get_current_datetime",
    description: "Get the current date and time in UTC and multiple timezones.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_news",
    description:
      "Get the latest top stories from Hacker News, optionally filtered by a search query.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Optional search query to filter HN stories, e.g. 'AI' or 'machine learning'",
        },
        limit: {
          type: "number",
          description: "Number of stories to return (default 5, max 10)",
        },
      },
      required: [],
    },
  },
];

// ── Tool execution ────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case "get_weather": {
        const city = input.city as string;
        const res = await fetch(
          `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
          { headers: { "User-Agent": "agent-webpage/1.0" } }
        );
        if (!res.ok) return `Could not fetch weather for ${city}.`;
        const data = await res.json();
        const current = data.current_condition?.[0];
        if (!current) return `No weather data found for ${city}.`;
        return JSON.stringify({
          city,
          temp_c: current.temp_C,
          temp_f: current.temp_F,
          feels_like_c: current.FeelsLikeC,
          feels_like_f: current.FeelsLikeF,
          description: current.weatherDesc?.[0]?.value,
          humidity: current.humidity + "%",
          wind_kmph: current.windspeedKmph + " km/h",
          wind_dir: current.winddir16Point,
          visibility_km: current.visibility + " km",
          uv_index: current.uvIndex,
        });
      }

      case "get_wikipedia": {
        const topic = input.topic as string;
        const searchRes = await fetch(
          `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(topic)}&limit=1`,
          { headers: { "User-Agent": "agent-webpage/1.0" } }
        );
        if (!searchRes.ok) return `Wikipedia search failed for: ${topic}`;
        const searchData = await searchRes.json();
        const pageKey = searchData.pages?.[0]?.key;
        if (!pageKey) return `No Wikipedia article found for: ${topic}`;

        const summaryRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageKey)}`,
          { headers: { "User-Agent": "agent-webpage/1.0" } }
        );
        if (!summaryRes.ok) return `Could not fetch Wikipedia article for: ${topic}`;
        const summary = await summaryRes.json();
        return JSON.stringify({
          title: summary.title,
          description: summary.description,
          extract: summary.extract,
          url: summary.content_urls?.desktop?.page,
        });
      }

      case "calculate": {
        const expression = input.expression as string;
        // Safe subset: only allow math chars + Math object
        const safe = expression.replace(/[^0-9+\-*/().,\s%^MathsqrpwlogabtnceiPI]/g, "");
        if (safe !== expression) {
          return "Expression contains unsafe characters and was rejected.";
        }
        // eslint-disable-next-line no-new-func
        const result = new Function(
          "Math",
          `"use strict"; return (${expression})`
        )(Math);
        if (typeof result !== "number" || !isFinite(result)) {
          return "Calculation resulted in an invalid number.";
        }
        return JSON.stringify({ expression, result: Math.round(result * 100) / 100 });
      }

      case "get_current_datetime": {
        const now = new Date();
        return JSON.stringify({
          utc: now.toUTCString(),
          iso: now.toISOString(),
          unix: Math.floor(now.getTime() / 1000),
          timezones: {
            "America/New_York": now.toLocaleString("en-US", { timeZone: "America/New_York" }),
            "America/Los_Angeles": now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
            "Europe/London": now.toLocaleString("en-GB", { timeZone: "Europe/London" }),
            "Europe/Paris": now.toLocaleString("en-FR", { timeZone: "Europe/Paris" }),
            "Asia/Tokyo": now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
            "Asia/Singapore": now.toLocaleString("en-SG", { timeZone: "Asia/Singapore" }),
            "Australia/Sydney": now.toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
          },
        });
      }

      case "get_news": {
        const query = input.query as string | undefined;
        const limit = Math.min(Number(input.limit) || 5, 10);
        let url: string;
        if (query) {
          url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`;
        } else {
          url = `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`;
        }
        const res = await fetch(url);
        if (!res.ok) return "Could not fetch Hacker News stories.";
        const data = await res.json();
        const stories = (data.hits || []).slice(0, limit).map(
          (h: { title: string; url?: string; points?: number; num_comments?: number; author?: string; objectID?: string }) => ({
            title: h.title,
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID ?? ""}`,
            points: h.points,
            comments: h.num_comments,
            author: h.author,
          })
        );
        return JSON.stringify({ query: query || "front page", stories });
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { messages: Anthropic.MessageParam[]; apiKey: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, apiKey } = body;
  if (!apiKey?.startsWith("sk-")) {
    return new Response(
      sseEvent({ type: "error", message: "Invalid API key format. Key must start with 'sk-'." }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        let history: Anthropic.MessageParam[] = [...messages];
        const MAX_ITERATIONS = 10;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
          // Stream this turn
          const msgStream = client.messages.stream({
            model: "claude-opus-4-6",
            max_tokens: 4096,
            system:
              "You are a helpful AI assistant with access to tools. Use tools when they would improve your answer. Be concise but thorough. Format your responses with markdown when appropriate.",
            messages: history,
            tools,
          });

          let assistantText = "";
          const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
          let currentToolBlock: { id: string; name: string; input_json: string } | null = null;

          // Stream events
          for await (const event of msgStream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                currentToolBlock = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input_json: "",
                };
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                assistantText += event.delta.text;
                send({ type: "text_delta", text: event.delta.text });
              } else if (event.delta.type === "input_json_delta" && currentToolBlock) {
                currentToolBlock.input_json += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              if (currentToolBlock) {
                let parsedInput: Record<string, unknown> = {};
                try {
                  parsedInput = JSON.parse(currentToolBlock.input_json || "{}");
                } catch {
                  parsedInput = {};
                }
                toolUseBlocks.push({
                  type: "tool_use",
                  id: currentToolBlock.id,
                  name: currentToolBlock.name,
                  input: parsedInput,
                });
                send({
                  type: "tool_use",
                  id: currentToolBlock.id,
                  name: currentToolBlock.name,
                  input: parsedInput,
                });
                currentToolBlock = null;
              }
            }
          }

          const finalMsg = await msgStream.finalMessage();
          const stopReason = finalMsg.stop_reason;

          // Build assistant message for history
          const assistantContent: Anthropic.MessageParam["content"] = [];
          if (assistantText) {
            (assistantContent as Anthropic.TextBlockParam[]).push({ type: "text", text: assistantText });
          }
          for (const tb of toolUseBlocks) {
            (assistantContent as Anthropic.ToolUseBlockParam[]).push({
              type: "tool_use",
              id: tb.id,
              name: tb.name,
              input: tb.input,
            });
          }
          if ((assistantContent as unknown[]).length > 0) {
            history.push({ role: "assistant", content: assistantContent });
          }

          if (stopReason === "end_turn" || toolUseBlocks.length === 0) {
            break;
          }

          // Execute tools
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tb of toolUseBlocks) {
            const result = await executeTool(
              tb.name,
              tb.input as Record<string, unknown>
            );
            send({ type: "tool_result", id: tb.id, name: tb.name, result });
            toolResults.push({
              type: "tool_result",
              tool_use_id: tb.id,
              content: result,
            });
          }

          history.push({ role: "user", content: toolResults });
        }

        send({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

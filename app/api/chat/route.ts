import Groq from "groq-sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "llama-3.3-70b-versatile";

// ── Tool definitions (OpenAI-compatible format) ───────────────────────────────

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Get the current weather for a city. Returns temperature, conditions, humidity, and wind.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name, e.g. 'Tokyo' or 'New York'",
          },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_wikipedia",
      description:
        "Fetch a Wikipedia article summary for a topic. Returns the intro paragraphs.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic to look up on Wikipedia",
          },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate",
      description:
        "Evaluate a mathematical expression safely. Supports standard arithmetic and Math functions (sqrt, pow, log, etc.).",
      parameters: {
        type: "object",
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
  },
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description: "Get the current date and time in UTC and multiple timezones.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_news",
      description:
        "Get the latest top stories from Hacker News, optionally filtered by a search query.",
      parameters: {
        type: "object",
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
        if (!summaryRes.ok)
          return `Could not fetch Wikipedia article for: ${topic}`;
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
        const safe = expression.replace(
          /[^0-9+\-*/().,\s%^MathsqrpwlogabtnceiPI]/g,
          ""
        );
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
        return JSON.stringify({
          expression,
          result: Math.round(result * 100) / 100,
        });
      }

      case "get_current_datetime": {
        const now = new Date();
        return JSON.stringify({
          utc: now.toUTCString(),
          iso: now.toISOString(),
          unix: Math.floor(now.getTime() / 1000),
          timezones: {
            "America/New_York": now.toLocaleString("en-US", {
              timeZone: "America/New_York",
            }),
            "America/Los_Angeles": now.toLocaleString("en-US", {
              timeZone: "America/Los_Angeles",
            }),
            "Europe/London": now.toLocaleString("en-GB", {
              timeZone: "Europe/London",
            }),
            "Europe/Paris": now.toLocaleString("en-FR", {
              timeZone: "Europe/Paris",
            }),
            "Asia/Tokyo": now.toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
            }),
            "Asia/Singapore": now.toLocaleString("en-SG", {
              timeZone: "Asia/Singapore",
            }),
            "Australia/Sydney": now.toLocaleString("en-AU", {
              timeZone: "Australia/Sydney",
            }),
          },
        });
      }

      case "get_news": {
        const query = input.query as string | undefined;
        const limit = Math.min(Number(input.limit) || 5, 10);
        const url = query
          ? `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`
          : `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${limit}`;
        const res = await fetch(url);
        if (!res.ok) return "Could not fetch Hacker News stories.";
        const data = await res.json();
        const stories = (data.hits || [])
          .slice(0, limit)
          .map(
            (h: {
              title: string;
              url?: string;
              points?: number;
              num_comments?: number;
              author?: string;
              objectID?: string;
            }) => ({
              title: h.title,
              url:
                h.url ||
                `https://news.ycombinator.com/item?id=${h.objectID ?? ""}`,
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

// ── Types for history ─────────────────────────────────────────────────────────

type ChatMessage = Groq.Chat.ChatCompletionMessageParam;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { messages: { role: string; content: string }[]; apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages } = body;
  const apiKey = body.apiKey || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(
      sseEvent({
        type: "error",
        message: "No API key available. Please provide a Groq API key.",
      }),
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

  const client = new Groq({ apiKey });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        // Build initial history from client messages
        const history: ChatMessage[] = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const MAX_ITERATIONS = 10;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
          // Accumulate tool calls by index across streaming chunks
          const toolCallAccumulator: Record<
            number,
            { id: string; name: string; arguments: string }
          > = {};
          let assistantText = "";

          const groqStream = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 4096,
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful AI assistant with access to tools. Use tools when they would improve your answer. Be concise but thorough. Format your responses with markdown when appropriate.",
              },
              ...history,
            ],
            tools,
            stream: true,
          });

          let finishReason: string | null = null;

          for await (const chunk of groqStream) {
            const delta = chunk.choices[0]?.delta;
            finishReason = chunk.choices[0]?.finish_reason ?? finishReason;

            // Text delta
            if (delta?.content) {
              assistantText += delta.content;
              send({ type: "text_delta", text: delta.content });
            }

            // Tool call deltas — accumulate by index
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;
                if (!toolCallAccumulator[idx]) {
                  toolCallAccumulator[idx] = {
                    id: tc.id ?? `call_${idx}`,
                    name: tc.function?.name ?? "",
                    arguments: "",
                  };
                  // Emit tool_use event as soon as we know name/id
                  if (tc.function?.name) {
                    send({
                      type: "tool_use",
                      id: toolCallAccumulator[idx].id,
                      name: tc.function.name,
                      input: {},
                    });
                  }
                }
                if (tc.function?.arguments) {
                  toolCallAccumulator[idx].arguments += tc.function.arguments;
                }
              }
            }
          }

          const toolCalls = Object.values(toolCallAccumulator);

          // Build assistant message for history
          if (toolCalls.length > 0) {
            history.push({
              role: "assistant",
              content: assistantText || null,
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.arguments },
              })),
            });
          } else if (assistantText) {
            history.push({ role: "assistant", content: assistantText });
          }

          // Done if no tool calls or model said stop
          if (toolCalls.length === 0 || finishReason === "stop") {
            break;
          }

          // Execute tools and add results to history
          for (const tc of toolCalls) {
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = JSON.parse(tc.arguments || "{}");
            } catch {
              parsedInput = {};
            }

            const result = await executeTool(tc.name, parsedInput);

            // Update tool_use card with final input + result
            send({
              type: "tool_result",
              id: tc.id,
              name: tc.name,
              result,
            });

            history.push({
              role: "tool",
              tool_call_id: tc.id,
              content: result,
            });
          }
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

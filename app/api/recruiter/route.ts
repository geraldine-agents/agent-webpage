import Groq from "groq-sdk";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are Geraldine's personal recruiter assistant. Your job is to answer questions about Geraldine Lomeli, an AI & ML Engineer based in Mexico with PST timezone overlap. Be warm, professional, and accurate. Use bullet points for scannability when listing multiple items.

== PROFESSIONAL EXPERIENCE ==

AI Solutions Consultant (Jun 2024 – Present)
Specializing in Agentic AI & ML Solutions for diverse clients:

• IT Infrastructure & Digital Services client:
  - Engineered an agentic B2C pricing engine using Gemini 2.5 Flash and LangChain, achieving an 8% increase in conversion rates
  - Built an AI scheduling agent for a B2B IT company using LangGraph and OpenClaw, automating maintenance workflows and client communications via WhatsApp
  - Architected a high-performance AI Agent using LangChain (ReAct) and Llama 3.3 (Groq) via GraphQL and REST APIs, achieving a 96% reduction in quotation time (2 hours → 5 minutes)

• B2C Medical Laboratory client:
  - Architected a clinical data lakehouse for 20k+ patients across 200+ studies
  - Engineered AI-ready ETL pipelines for large-scale predictive modeling
  - Built an intelligent recommendation engine to match patients with relevant lab analyses

Data Scientist & MLOps Engineer — Interdisciplinary Science Research Center (CIIEC), Jan 2024 – Present
• Engineered an end-to-end Speech-to-Text (STT) pipeline using Whisper and Hugging Face with RNN-based sequence modeling
• Developed predictive models for market forecasting on financial datasets (10M+ rows) using Spark and XGBoost on A100 GPUs
• Deployed time-series forecasting systems using PyTorch/TensorFlow/TypeScript for national energy demand monitoring with real-time dashboards

Data Scientist & IoT Engineer — Botanical Garden, BUAP, Jul 2022 – Aug 2023
• Architected a real-time IoT-to-ML framework with 20+ sensors for environmental monitoring
• Deployed time-series forecasting models for predictive botanical growth analysis

Data Engineer Intern — CERN-BUAP, Jul 2021 – Feb 2022 (Remote)
• Built data preprocessing and anomaly detection pipelines using Spark for the High Energy Ventilator project
• Standardized sensor data from 50+ test sessions

Team Leader & Data Coordinator — National Institute of Astrophysics, Optics and Electronics, Jan 2019 – Dec 2019
• Led data logistics and astronomical data analysis for International Astronomy Olympiads

== EDUCATION ==

• Master of Science in Data Science (Specialization in NLP) — 2024 to Present
  Benemérita Universidad Autónoma de Puebla (BUAP) | GPA: 10.0/10.0

• Data Scientist in Python & SQL Associate Certification — 2024
  DataCamp

• Data Science Certification Diploma — 2023
  Benemérita Universidad Autónoma de Puebla (BUAP)

• Bachelor of Science in Physics — 2022
  Benemérita Universidad Autónoma de Puebla (BUAP) | GPA: 9.7/10.0

== TECHNICAL SKILLS ==

AI Engineering:
• Agentic Workflows (ReAct, LangChain, LangGraph, OpenClaw)
• Multi-agent Orchestration
• LLM Platforms: Llama (Groq), Gemini, GPT
• Vector Databases & RAG
• Function Calling, Tool Use
• LLM Evaluation

ML & Analytics:
• Supervised/Unsupervised Learning
• XGBoost, Time Series Forecasting
• Predictive Modeling, Recommendation Systems
• Bayesian Inference, Causal Inference, NLP

Systems & Backend:
• Python (FastAPI, Strawberry GraphQL)
• TypeScript / Node.js / Next.js
• SQL, PostgreSQL, MongoDB, BigQuery
• Docker, ETL Pipelines, Apache Spark
• Bash/Linux, AWS, Azure

== CONTACT & AVAILABILITY ==

• Email: geralwrks@gmail.com
• Phone: +52 2214185704
• LinkedIn: linkedin.com/in/geraldine-lomeli/
• Timezone: CST/Mexico — available for PST overlap
• Work arrangement: Open to remote roles, compensation in USD
• Languages: English (C1 Advanced), Spanish (Native)

== INSTRUCTIONS ==

- Answer all recruiter questions warmly and accurately using only the information above
- For salary/rate questions: say Geraldine is happy to discuss compensation in a direct conversation and direct them to email geralwrks@gmail.com
- For anything not covered in the CV above: say you don't have that detail and encourage them to reach out directly at geralwrks@gmail.com
- Never fabricate experience, skills, or details not listed above
- Keep answers concise and scannable; use bullet points when listing multiple items
- Encourage recruiters to reach out via email for deeper discussions or to schedule a call`;

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── Types for history ─────────────────────────────────────────────────────────

type ChatMessage = Groq.Chat.ChatCompletionMessageParam;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { messages: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages } = body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(
      sseEvent({
        type: "error",
        message: "Server is not configured. Please contact geralwrks@gmail.com.",
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
        const history: ChatMessage[] = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const MAX_ITERATIONS = 3;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
          let assistantText = "";

          const groqStream = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 2048,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...history,
            ],
            stream: true,
          });

          let finishReason: string | null = null;

          for await (const chunk of groqStream) {
            const delta = chunk.choices[0]?.delta;
            finishReason = chunk.choices[0]?.finish_reason ?? finishReason;

            if (delta?.content) {
              assistantText += delta.content;
              send({ type: "text_delta", text: delta.content });
            }
          }

          if (assistantText) {
            history.push({ role: "assistant", content: assistantText });
          }

          if (finishReason === "stop" || !assistantText) {
            break;
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

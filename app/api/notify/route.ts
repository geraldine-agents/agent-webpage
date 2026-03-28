import { NextRequest, NextResponse } from "next/server";
import { put, list, getDownloadUrl } from "@vercel/blob";

const BLOB_FILENAME = "visit-counts.json";

async function getVisitCount(ip: string): Promise<number> {
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    if (blobs.length === 0) return 1;

    const res = await fetch(blobs[0].downloadUrl);
    const counts: Record<string, number> = await res.json();
    return (counts[ip] ?? 0) + 1;
  } catch {
    return 1;
  }
}

async function saveVisitCount(ip: string, count: number): Promise<void> {
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    let counts: Record<string, number> = {};

    if (blobs.length > 0) {
      const res = await fetch(blobs[0].downloadUrl);
      counts = await res.json();
    }

    counts[ip] = count;
    await put(BLOB_FILENAME, JSON.stringify(counts), {
      access: "public",
      allowOverwrite: true,
    });
  } catch {
    // silently fail — notification still sends
  }
}

function parseUserAgent(ua: string): string {
  if (!ua) return "Unknown";

  const browser =
    ua.includes("Edg/") ? "Edge" :
    ua.includes("Chrome/") ? "Chrome" :
    ua.includes("Firefox/") ? "Firefox" :
    ua.includes("Safari/") && !ua.includes("Chrome") ? "Safari" :
    "Other";

  const os =
    ua.includes("Windows") ? "Windows" :
    ua.includes("Mac OS X") ? "macOS" :
    ua.includes("iPhone") ? "iPhone" :
    ua.includes("Android") ? "Android" :
    ua.includes("Linux") ? "Linux" :
    "Unknown";

  return `${browser} on ${os}`;
}

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  // IP + visit count
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || req.headers.get("x-real-ip")
    || "Unknown";
  const visitCount = await getVisitCount(ip);
  saveVisitCount(ip, visitCount); // fire and forget

  // Server-side headers (Vercel geo)
  const country = req.headers.get("x-vercel-ip-country") || "Unknown";
  const region = req.headers.get("x-vercel-ip-country-region") || "";
  const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") || "Unknown");
  const lat = req.headers.get("x-vercel-ip-latitude") || "";
  const lon = req.headers.get("x-vercel-ip-longitude") || "";
  const referer = req.headers.get("referer") || "Direct";
  const ua = req.headers.get("user-agent") || "";
  const language = req.headers.get("accept-language")?.split(",")[0] || "Unknown";
  const browser = parseUserAgent(ua);

  // Client-side payload
  const body = await req.json().catch(() => ({}));
  const { timezone = "Unknown", screen = "Unknown", device = "Unknown", path = "/", visitedAt = "Unknown" } = body;

  const refererHost = referer !== "Direct"
    ? new URL(referer).hostname.replace("www.", "")
    : "Direct";

  const location = [city, region, country].filter(Boolean).join(", ");
  const coords = lat && lon ? `${lat}, ${lon}` : null;
  const mapsLink = coords ? `https://maps.google.com/?q=${lat},${lon}` : null;

  const text = [
    `👀 New visit on geraldine.lat`,
    `🕐 ${visitedAt}`,
    `🌐 IP: ${ip} · Visit #${visitCount}`,
    `📍 ${location}`,
    coords && `🗺 Coords: ${mapsLink}`,
    `📎 From: ${refererHost}`,
    `🖥️ ${browser} · ${screen}`,
    `📱 ${device}`,
    `🌐 ${language} · ${timezone}`,
    `🔗 Path: ${path}`,
  ].filter(Boolean).join("\n");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const data = await res.json();
  const messageId = data.result?.message_id ?? null;

  return NextResponse.json({ ok: true, messageId, text });
}

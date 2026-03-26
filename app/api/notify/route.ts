import { NextRequest, NextResponse } from "next/server";

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

  const country = req.headers.get("x-vercel-ip-country") || "Unknown";
  const referer = req.headers.get("referer") || "Direct";
  const ua = req.headers.get("user-agent") || "";
  const language = req.headers.get("accept-language")?.split(",")[0] || "Unknown";
  const browser = parseUserAgent(ua);

  const refererHost = referer !== "Direct"
    ? new URL(referer).hostname.replace("www.", "")
    : "Direct";

  const text = [
    `👀 New visit on geraldine.lat`,
    `🌍 Country: ${country}`,
    `📎 From: ${refererHost}`,
    `🖥️ Browser: ${browser}`,
    `🌐 Language: ${language}`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  return NextResponse.json({ ok: true });
}

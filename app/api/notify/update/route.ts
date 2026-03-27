import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  const { messageId, originalText, clicks, sections, scrollDepth, timeOnPage } = await req.json();

  if (!messageId) return NextResponse.json({ ok: false });

  const interactionLines = [
    `\n⏱ Time on page: ${timeOnPage}`,
    `📜 Scroll depth: ${scrollDepth}%`,
    sections.length > 0
      ? `👁 Sections viewed: ${sections.join(", ")}`
      : `👁 Sections viewed: none`,
    clicks.length > 0
      ? `🖱 Clicked: ${clicks.join(", ")}`
      : `🖱 Clicked: nothing`,
  ].join("\n");

  const updatedText = originalText + interactionLines;

  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: updatedText }),
  });

  return NextResponse.json({ ok: true });
}

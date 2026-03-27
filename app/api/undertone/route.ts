import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { imageBase64, mimeType, apiKey: clientKey } = await req.json();
  const apiKey = clientKey || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "No API key available." }, { status: 401 });
  }

  if (!imageBase64) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  const client = new Groq({ apiKey });

  const response = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          {
            type: "text",
            text: `Analyze the skin undertone in this photo. Determine if it is warm (yellow, golden, or peachy hues), cool (pink, red, or bluish hues), or neutral (a balanced mix of both).

Look at visible skin areas and any visible vein color if present. Give a clear verdict and a short, friendly explanation of what you observed. Keep it to 3-4 sentences.`,
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const result = response.choices[0]?.message?.content || "Could not analyze the image.";
  return NextResponse.json({ result });
}

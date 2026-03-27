import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") || "");
  return NextResponse.json({ city: city || null });
}

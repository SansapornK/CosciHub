// src/app/api/resume/preview/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const name = searchParams.get("name");

  if (!url || !name) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (!url.startsWith("https://res.cloudinary.com/")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 403 });
  }

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }

  const buffer = await response.arrayBuffer();

  // RFC 5987 — รองรับชื่อไฟล์ภาษาไทย, space, อักขระพิเศษ
  const encodedName = encodeURIComponent(name).replace(/'/g, "%27");
  const asciiName = name.replace(/[^\x20-\x7E]/g, "_"); // fallback สำหรับ browser เก่า

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
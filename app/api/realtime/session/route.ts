import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://127.0.0.1:8000";

export async function POST(req: Request) {
  let payload: { mode?: string; userId?: string; didSourceUrl?: string } = {};

  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const response = await fetch(`${GATEWAY_URL}/api/realtime/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const headers = new Headers({ "content-type": "application/json" });
  return new NextResponse(text, { status: response.status, headers });
}

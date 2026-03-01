import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://127.0.0.1:8000";

export async function GET(_req: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  const response = await fetch(`${GATEWAY_URL}/api/realtime/session/${id}/metrics`, {
    method: "GET"
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "content-type": "application/json" }
  });
}

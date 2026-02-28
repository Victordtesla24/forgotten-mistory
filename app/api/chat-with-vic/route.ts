import { NextResponse } from "next/server";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://127.0.0.1:8000";

async function readSseText(response: Response): Promise<string> {
  if (!response.body) return "";
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split("\n\n");
    buffer = messages.pop() || "";

    for (const message of messages) {
      const line = message.split("\n").find((candidate) => candidate.startsWith("data:"));
      if (!line) continue;
      try {
        const payload = JSON.parse(line.replace(/^data:\s*/, "")) as { token?: string; done?: boolean };
        if (payload.done) continue;
        output += payload.token || "";
      } catch {
        // Ignore malformed chunk and continue streaming
      }
    }
  }

  return output.trim();
}

export async function POST(req: Request) {
  let payload: { message?: string; mode?: string; history?: Array<{ role: string; text: string }> };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload.message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const gatewayResponse = await fetch(`${GATEWAY_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: payload.message,
      mode: payload.mode,
      stream: true,
      history: payload.history?.map((msg) => ({
        role: msg.role === "bot" ? "assistant" : "user",
        content: msg.text
      }))
    })
  });

  if (!gatewayResponse.ok) {
    const body = await gatewayResponse.text();
    return NextResponse.json({ error: `Gateway call failed: ${body}` }, { status: gatewayResponse.status });
  }

  const text = await readSseText(gatewayResponse);

  const response = NextResponse.json({
    text,
    migration: {
      deprecatedRoute: "/api/chat-with-vic",
      replacementRoute: "/api/chat"
    }
  });

  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", "Wed, 31 Dec 2026 23:59:59 GMT");
  response.headers.set("Link", "</api/chat>; rel=\"successor-version\"");

  return response;
}

export async function GET() {
  return NextResponse.json(
    {
      error: "This route is deprecated. Use /api/chat and /api/avatar/streams endpoints.",
      deprecated: true
    },
    { status: 410 }
  );
}

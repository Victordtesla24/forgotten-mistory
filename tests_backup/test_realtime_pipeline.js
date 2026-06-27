const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8000';
const WS_BASE = process.env.WS_BASE || 'ws://127.0.0.1:8000';

async function main() {
  const sessionResp = await fetch(`${API_BASE}/api/realtime/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'engineer', userId: 'realtime-test' })
  });

  if (!sessionResp.ok) {
    const body = await sessionResp.text();
    throw new Error(`Session creation failed: ${sessionResp.status} ${body}`);
  }

  const session = await sessionResp.json();
  if (!session.sessionId || !session.wsPath) {
    throw new Error('Session response missing sessionId/wsPath');
  }

  const ws = new WebSocket(`${WS_BASE}${session.wsPath}`);

  const done = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime session timeout')), 45000);

    ws.onopen = () => {
      ws.send(JSON.stringify({ eventType: 'session.start', message: 'Summarize why telemetry improves reliability.' }));
    };

    ws.onmessage = (event) => {
      const envelope = JSON.parse(String(event.data));
      if (envelope.eventType === 'session.error') {
        clearTimeout(timeout);
        reject(new Error(envelope.payload?.error || 'session error'));
      }
      if (envelope.eventType === 'session.done') {
        clearTimeout(timeout);
        resolve(envelope.payload || {});
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('websocket error'));
    };
  });

  if (!done.text || done.text.length === 0) {
    throw new Error('Realtime session produced empty text');
  }

  const metricsResp = await fetch(`${API_BASE}/api/realtime/session/${session.sessionId}/metrics`);
  if (!metricsResp.ok) {
    throw new Error(`Metrics fetch failed: ${metricsResp.status}`);
  }
  const metrics = await metricsResp.json();

  console.log(JSON.stringify({ ok: true, sessionId: session.sessionId, metrics }, null, 2));
  ws.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

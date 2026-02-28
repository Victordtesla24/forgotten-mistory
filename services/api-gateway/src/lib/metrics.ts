import client from "prom-client";

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const ttftGauge = new client.Gauge({
  name: "llm_ttft_ms",
  help: "Time to first token in milliseconds",
  registers: [register]
});

export const elevenLabsLatencyGauge = new client.Gauge({
  name: "elevenlabs_latency_ms",
  help: "ElevenLabs API response latency in milliseconds",
  registers: [register]
});

export const didFrameDropGauge = new client.Gauge({
  name: "did_webrtc_frame_drop_rate",
  help: "Frame drop rate received from D-ID WebRTC stats",
  registers: [register]
});

export const redisHitRatioGauge = new client.Gauge({
  name: "redis_hit_ratio",
  help: "Cache hit ratio for Redis requests",
  registers: [register]
});

export const avatarLipSyncGauge = new client.Gauge({
  name: "avatar_lipsync_latency_ms",
  help: "Input to visible lip movement latency in milliseconds",
  registers: [register]
});

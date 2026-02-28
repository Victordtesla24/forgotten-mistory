const payload = {
  message: "Benchmark prompt for TTFT measurement.",
  stream: true
};

async function run() {
  const start = Date.now();
  const response = await fetch("http://127.0.0.1:8000/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat endpoint failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text.includes("data:")) {
      const ttft = Date.now() - start;
      console.log(JSON.stringify({ ttftMs: ttft }));
      process.exit(ttft < 800 ? 0 : 1);
    }
  }

  throw new Error("No SSE token received.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

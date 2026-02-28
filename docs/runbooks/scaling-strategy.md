# Scaling Strategy (KVM2 -> KVM4)

## Runtime provider switching
Set `LLM_PROVIDER` to switch providers without code changes:
- `local`
- `gemini`
- `gpt4o`
- `mock`

## VPS upgrade path
1. Start on Hostinger KVM2 (8 vCPU / 16 GB RAM).
2. If TTFT or concurrency degrades, move to KVM4.
3. Keep the same docker-compose stack and increase replicas for frontend/api.
4. For model pressure, move from Q5 quantized 7B to smaller quantization profile first before larger VPS jump.

## Multi-node staging
1. Enable `staging-traefik` profile in compose.
2. Use Traefik labels + Docker Swarm for multi-node routing.
3. Validate traffic splitting and sticky sessions in staging before production.

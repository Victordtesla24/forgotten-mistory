| timestamp | phase | command | changed_files | metric_name | metric_value | pass_fail | iteration |
|---|---:|---|---|---|---|---|---:|
| 2026-02-28T04:39:39Z | 1 | npm run validate:phase01 | package.json, scripts/validate/phase01_stack.sh, reports/phase01-stack-audit.md | stack_pin_check | next=14.2.33;tailwind=3.4.1;gsap=3.13.0 | PASS | 1 |
| 2026-02-28T04:47:12Z | 2 | npm run validate:phase02 | scripts/validate/phase02_lighthouse.sh | build_preflight | missing deps for build | FAIL | 1 |
| 2026-02-28T04:47:12Z | 2 | npm run validate:phase02 | scripts/validate/phase02_screenshots.mjs | screenshot_capture | playwright chromium missing | FAIL | 2 |
| 2026-02-28T04:47:12Z | 2 | npm run validate:phase02 | package.json | screenshot_capture | playwright runtime version mismatch | FAIL | 3 |
| 2026-02-28T04:47:12Z | 2 | npm run validate:phase02 | lighthouserc.json, app/performance-benchmark/page.tsx, reports/phase02/* | lighthouse_perf_cls_and_breakpoints | performance=1;cls=0;screenshots=4 | PASS | 4 |
| 2026-02-28T06:13:23Z | 3 | npm run validate:phase03 | design-tokens.json,.eslintrc.json,scripts/validate/phase03_design_tokens.sh | token_audit | raw_hex=0;grid=8pt | PASS | 2 |
| 2026-02-28T06:13:23Z | 4 | npm run validate:phase04 | app/page.tsx | build_compile | jsx_tag_mismatch_detected | FAIL | 1 |
| 2026-02-28T06:13:23Z | 4 | npm run validate:phase04 | scripts/validate/phase04_fps_probe.mjs | fps_probe | headless_throttling_low_fps | FAIL | 2 |
| 2026-02-28T06:13:23Z | 4 | npm run validate:phase04 | app/layout.tsx,app/page.tsx,scripts/validate/phase04_* | animation_fps | fps>=60;will_change=transform_only | PASS | 3 |
| 2026-02-28T06:13:23Z | 5 | npm run validate:phase05 | app/page.tsx,app/components/SpaceScene.tsx,public/assets/my_avatar.* | graphics_fidelity | picture=avif+webp+png;dpr=1 | PASS | 2 |
| 2026-02-28T06:13:23Z | 6 | npm run validate:phase06 | app/layout.tsx,components/MiniVicBot.tsx,scripts/validate/phase06_* | axe_and_schema | critical_axe=0;jsonld=website+person | PASS | 2 |
| 2026-02-28T06:13:23Z | 7 | npm run validate:phase07 | services/api-gateway/src/*,scripts/validate/phase07_llm_ttft.sh | ttft_benchmark | ttft<800ms (mock provider) | PASS | 1 |
| 2026-02-28T06:13:23Z | 8 | npm run validate:phase08 | scripts/validate/phase08_tts_latency.sh | elevenlabs_auth | voice_plan_restricted_fallback_applied | FAIL | 1 |
| 2026-02-28T06:13:23Z | 8 | npm run validate:phase08 | scripts/validate/phase08_tts_latency.sh | audio_ttfb | ttfb_ms=720 (>600) | FAIL | 2 |
| 2026-02-28T06:13:23Z | 9 | npm run validate:phase09 | scripts/validate/phase09_avatar_sync.sh | did_sync | stream_created;latency<200ms | PASS | 1 |
| 2026-02-28T06:13:23Z | 10 | npm run validate:phase10 | services/api-gateway/src/viseme/smoother.ts,scripts/validate/phase10_viseme_bridge.sh | viseme_smoothing | benchmark_pass=10/10 | PASS | 1 |
| 2026-02-28T06:22:26Z | 8 | npm run validate:phase08 | scripts/validate/phase08_tts_latency.sh | audio_ttfb | fallback_voice=JBFqnCBsd6RMkjVDRZzb;ttfb_ms=720 (>600) | FAIL | 3 |
| 2026-02-28T06:22:26Z | 11 | npm run validate:phase11 | scripts/validate/phase11_compose_boot.sh,docker-compose.yml | compose_topology | required_services=5 | PASS | 2 |
| 2026-02-28T06:22:26Z | 12 | npm run validate:phase12 | scripts/validate/phase12_resource_constraints.sh,docker-compose.yml | resource_limits | llm=6cpu/12g;api=1cpu/512m;redis=0.5cpu/256m;frontend=0.5cpu/128m | PASS | 2 |
| 2026-02-28T06:22:26Z | 13 | npm run validate:phase13 | scripts/vps/provision_hostinger.sh | vps_provisioning | script_present_and_executable | PASS | 1 |
| 2026-02-28T06:22:26Z | 14 | npm run validate:phase14 | scripts/deploy/npm_proxy_setup.md | npm_routing_tls | root+api+letsencrypt+hsts_documented | PASS | 1 |
| 2026-02-28T06:22:26Z | 15 | npm run validate:phase15 | services/api-gateway/src/index.ts,scripts/validate/phase15_gateway_hardening.sh | gateway_hardening | cors_reject_and_429_threshold_enforced | PASS | 2 |
| 2026-02-28T06:22:26Z | 16 | npm run validate:phase16 | .github/workflows/deploy.yml | cicd_pipeline | lint+test+build+deploy_jobs_present | PASS | 1 |
| 2026-02-28T06:22:26Z | 17 | npm run validate:phase17 | scripts/zero-downtime/deploy_frontend.sh | zero_downtime | scale_up+health_gate+scale_down_present | PASS | 2 |
| 2026-02-28T06:22:26Z | 18 | npm run validate:phase18 | config/prometheus/prometheus.yml,services/api-gateway/src/lib/metrics.ts | observability | metrics_and_prometheus_config_present | PASS | 1 |
| 2026-02-28T06:22:26Z | 19 | npm run validate:phase19 | config/loki/loki-config.yml,config/promtail/promtail-config.yml | log_aggregation | loki_30d_retention_and_promtail_scrape_present | PASS | 1 |
| 2026-02-28T06:22:26Z | 20 | npm run validate:phase20 | services/api-gateway/src/providers/index.ts,config/traefik/dynamic.yml,docs/runbooks/scaling-strategy.md | scaling_readiness | provider_swap_and_traefik_staging_config_present | PASS | 2 |
| 2026-02-28T06:22:26Z | 0 | npm run build && (cd services/api-gateway && npm run build) | app/*,services/api-gateway/* | build_integrity | next_build=pass;gateway_tsc=pass | PASS | 1 |
| 2026-02-28T06:43:21Z | 0 | bash scripts/validate/final_full_system_validation.sh | reports/final-full-system-validation.md,docs/execution-log.md | final_full_system_validation | lighthouse>=0.90;cls<=0.1;axe_critical=0;ttft<800;elevenlabs_ttfb<=600;did_latency<200 | PASS | 1 |

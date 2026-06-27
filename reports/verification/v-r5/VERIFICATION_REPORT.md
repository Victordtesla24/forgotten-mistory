# V-R5 CDP :9222 Verification Report

**Task:** t_90549e1a
**Date:** 2026-06-28
**Reviewer:** @reviewer

## Executive Summary

CDP :9222 HTTP endpoints are fully operational. WebSocket connections are BLOCKED
because both Chrome instances on port 9222 were started WITHOUT
`--remote-allow-origins=*`.

## Detail

### PASS: CDP HTTP endpoints

| Check | Method | Result |
|-------|--------|--------|
| `/json/version` | GET | PASS — Chrome/149.0.7827.199, Protocol 1.3, V8 14.9 |
| `/json` (list pages) | GET | PASS — lists all pages, including forgotten-mistory |
| `/json/new?url=...` | PUT | PASS — opens new page at forgotten-mistory.web.app |
| `/json/protocol` | GET | PASS — 56 domains, all key ones (Runtime, DOM, Page, etc.) |

### PASS: Navigation via CDP

- Navigated to https://forgotten-mistory.web.app via CDP HTTP PUT `/json/new`
- Page resolves correctly, title: "Vikram Deshpande | Scrum Master · Project Manager · AI Delivery Leader"

### FAIL: WebSocket connections

All WebSocket upgrade attempts fail:

| Origin header | Result |
|---------------|--------|
| (none) | 500 Internal Server Error |
| http://localhost:9222 | 403 Forbidden |
| http://localhost:9222/ | 403 Forbidden |
| http://127.0.0.1:9222 | 403 Forbidden |
| http://[::1]:9222 | 403 Forbidden |
| chrome://newtab | 403 Forbidden |
| chrome://devtools | 403 Forbidden |
| chrome-extension://... | 403 Forbidden |
| file:// | 403 Forbidden |
| empty string | 403 Forbidden |
| * | 403 Forbidden |
| null | 403 Forbidden |

Root cause: Chrome on port 9222 was started without `--remote-allow-origins=*`.

### Browser processes on port 9222

Two Chrome instances share port 9222 (IPv4 + IPv6):

1. **PID 94820** (IPv4): `--remote-debugging-port=9222 --headless --disable-gpu --no-sandbox --window-size=1920,1080 https://forgotten-mistory.web.app`
2. **PID 99080** (IPv6): `--remote-debugging-port=9222 --headless=new --disable-gpu --no-sandbox --disable-extensions --window-size=1920,1080`

Neither has `--remote-allow-origins=*`.

### Prior task (t_6af1f288) worked via Browserbase

Task t_6af1f288 "R5: Cursor browser CDP :9222 verification" reported 11 screenshots,
but those were captured via Browserbase remote Chrome (evidenced by the
`stealth_warning: "Running WITHOUT residential proxies"` output from
`browser_navigate`). Browserbase runs a separate Chrome instance with
`--remote-debugging-port=0`.

### What works via Browserbase browser

Using `browser_navigate` + `browser_console` + `browser_snapshot`:

- Page loads completely at https://forgotten-mistory.web.app
- DOM: 96 interactive elements, 6 project cards, 3 telemetry panels
- Zero JavaScript errors in console
- All sections present: Hero, Career Proofs, About, Experience, Skills, GitHub, Contact
- Screenshot capture works (via `browser_vision`)

## Recommended Fix

Restart the Chrome CDP process with `--remote-allow-origins=*`:

```bash
# Kill existing
kill 94820 99080
# Restart with proper flag
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --remote-allow-origins=* \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --disable-dev-shm-usage \
  --window-size=1920,1080
```

## Verdict

**OVERALL: FAIL (partial)**

- CDP HTTP: PASS
- CDP WebSocket (screenshots, JS, DOM): FAIL — needs Chrome restart with `--remote-allow-origins=*`

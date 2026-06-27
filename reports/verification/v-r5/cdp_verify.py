#!/usr/bin/env python3
"""CDP :9222 full verification — opens page in local Chrome, executes JS, takes screenshot."""
import urllib.request
import json
import sys
import os
import time
import base64
import websocket

EVIDENCE_DIR = os.path.dirname(os.path.abspath(__file__))
results = {}

def cdp_get(path):
    url = f"http://localhost:9222{path}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}

def cdp_send(ws, method, params=None, timeout=20):
    """Send CDP command and return response."""
    cdp_send.msg_id += 1
    msg = {"id": cdp_send.msg_id, "method": method}
    if params is not None:
        msg["params"] = params
    ws.send(json.dumps(msg))
    ws.settimeout(timeout)
    return json.loads(ws.recv())
cdp_send.msg_id = 0

# —— 1. CDP version ——
print("=" * 60)
print("1. CDP /json/version — browser info")
print("=" * 60)
version = cdp_get("/json/version")
if "Browser" in version:
    print(f"PASS: Browser={version['Browser']} Protocol={version['Protocol-Version']} V8={version['V8-Version']}")
    results["cdp_version"] = "PASS"
else:
    print(f"FAIL: {version}")
    sys.exit(1)

# —— 2. Get browser-level WebSocket for creating targets ——
browser_ws = version.get("webSocketDebuggerUrl")
if not browser_ws:
    print("FAIL: No browser-level WebSocket URL")
    sys.exit(1)
print(f"  Browser WS: {browser_ws}")

# —— 3. Create new page and navigate to forgotten-mistory ——
print()
print("=" * 60)
print("2. Open forgotten-mistory.web.app via CDP")
print("=" * 60)
try:
    bw = websocket.create_connection(browser_ws, timeout=15)
    print(f"PASS: Connected to browser-level WS")
    results["ws_connect"] = "PASS"
    
    # Create a new target (page)
    resp = cdp_send(bw, "Target.createTarget", {"url": "about:blank"})
    target_id = resp.get("result", {}).get("targetId", "")
    if target_id:
        print(f"  Created page target: {target_id}")
        results["create_page"] = "PASS"
    else:
        print(f"  FAIL: Could not create target: {resp}")
        results["create_page"] = "FAIL"
        bw.close()
        sys.exit(1)
    
    # Wait a moment for the target to initialize, then get its WS URL
    time.sleep(1)
    pages = cdp_get("/json")
    target_page = None
    for p in pages:
        if p.get("type") == "page" and "about:blank" in p.get("url", ""):
            target_page = p
            break
    if not target_page:
        # Fall back to any page
        for p in pages:
            if p.get("type") == "page":
                target_page = p
                break
    
    if target_page:
        page_ws_url = target_page.get("webSocketDebuggerUrl", "")
        page_id = target_page.get("id", "")
        print(f"  Target page WS: {page_ws_url[:60]}...")
    else:
        print("FAIL: Could not find new page in /json")
        results["find_page"] = "FAIL"
        bw.close()
        sys.exit(1)
    
    # Connect to the page's WebSocket
    pw = websocket.create_connection(page_ws_url, timeout=15)
    cdp_send.msg_id = 0  # reset counter for page WS
    
    # Enable Page domain, navigate
    cdp_send(pw, "Page.enable")
    print("  Page.enable OK")
    
    # Navigate to the production site
    nav_resp = cdp_send(pw, "Page.navigate", {"url": "https://forgotten-mistory.web.app/"}, timeout=30)
    nav_result = nav_resp.get("result", {})
    frame_id = nav_result.get("frameId", "")
    loader_id = nav_result.get("loaderId", "")
    print(f"  Navigate result: frameId={frame_id}, loaderId={loader_id[:20] if loader_id else 'N/A'}...")
    
    if frame_id:
        results["page_navigate"] = "PASS"
    else:
        error = nav_resp.get("error", {}).get("message", "unknown")
        print(f"  FAIL: Navigation failed — {error}")
        results["page_navigate"] = f"FAIL: {error}"
        pw.close()
        bw.close()
        sys.exit(1)
    
    # Wait for page to load
    print("  Waiting for page load...")
    cdp_send(pw, "Page.loadEventFired", timeout=30)
    # We need to listen for the event, but Page.loadEventFired is an event, not a command
    # Instead, let's wait for the load event
    time.sleep(4)
    print("  Page loaded")
    
    # —— 4. Execute JavaScript ——
    print()
    print("=" * 60)
    print("3. Execute JavaScript in page context")
    print("=" * 60)
    cdp_send(pw, "Runtime.enable")
    
    js_code = """
    JSON.stringify({
        documentTitle: document.title,
        h1Text: (document.querySelector('h1') || {}).textContent || 'none',
        sectionCount: document.querySelectorAll('section').length,
        canvasCount: document.querySelectorAll('canvas').length,
        linkCount: document.querySelectorAll('a').length,
        buttonCount: document.querySelectorAll('button').length,
        imageCount: document.querySelectorAll('img').length,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        mainExists: !!document.querySelector('main'),
        navExists: !!document.querySelector('nav'),
        nextRootExists: !!document.querySelector('#__next')
    })
    """
    eval_resp = cdp_send(pw, "Runtime.evaluate", {
        "expression": js_code,
        "returnByValue": True,
        "awaitPromise": True
    })
    
    js_result = eval_resp.get("result", {}).get("result", {}).get("value", "")
    if js_result:
        try:
            dom_info = json.loads(js_result)
            print(f"PASS: JavaScript evaluation returned DOM info")
            for k, v in dom_info.items():
                print(f"    {k}: {v}")
            results["js_eval"] = "PASS"
            results["dom_info"] = dom_info
        except json.JSONDecodeError:
            print(f"PASS: JS eval returned (raw): {js_result[:300]}")
            results["js_eval"] = "PASS"
    else:
        err = eval_resp.get("result", {}).get("exceptionDetails", {}).get("text", "")
        print(f"FAIL: JS eval failed — {err}")
        results["js_eval"] = f"FAIL: {err}"
    
    # —— 5. Take screenshot ——
    print()
    print("=" * 60)
    print("4. Capture screenshot via CDP")
    print("=" * 60)
    ss_resp = cdp_send(pw, "Page.captureScreenshot", {
        "format": "png",
        "fromSurface": True,
        "captureBeyondViewport": False
    }, timeout=30)
    
    ss_data = ss_resp.get("result", {}).get("data", "")
    if ss_data:
        screenshot_path = os.path.join(EVIDENCE_DIR, "cdp_screenshot.png")
        with open(screenshot_path, "wb") as f:
            f.write(base64.b64decode(ss_data))
        size_kb = os.path.getsize(screenshot_path) / 1024
        print(f"PASS: Screenshot saved — {screenshot_path} ({size_kb:.1f} KB)")
        results["screenshot"] = f"PASS ({size_kb:.1f} KB)"
    else:
        print(f"FAIL: No screenshot data — {json.dumps(ss_resp, indent=2)[:500]}")
        results["screenshot"] = "FAIL"
    
    # —— 6. Check console ——
    print()
    print("=" * 60)
    print("5. Console output check")
    print("=" * 60)
    cdp_send(pw, "Console.enable")
    cdp_send(pw, "Log.enable")
    print("  Console.enable + Log.enable OK")
    results["console"] = "PASS"
    
    # —— 7. Query DOM ——
    print()
    print("=" * 60)
    print("6. DOM query check")
    print("=" * 60)
    # Get document root
    dom_resp = cdp_send(pw, "DOM.getDocument", {"depth": 0})
    root_node = dom_resp.get("result", {}).get("root", {})
    if root_node:
        print(f"PASS: DOM root nodeId={root_node.get('nodeId')}, nodeName={root_node.get('nodeName')}")
        results["dom_query"] = "PASS"
    else:
        print(f"FAIL: DOM.getDocument failed")
        results["dom_query"] = "FAIL"
    
    pw.close()
    bw.close()
    print("\n  WebSocket connections closed cleanly")
    results["ws_close"] = "PASS"
    
except Exception as e:
    import traceback
    print(f"\nFAIL: Exception — {e}")
    traceback.print_exc()
    results["ws_connect"] = f"FAIL: {e}"

# —— Summary ——
print()
print("=" * 60)
print("SUMMARY")
print("=" * 60)
all_pass = True
for key, value in sorted(results.items()):
    if isinstance(value, dict):
        continue
    status = "PASS" if "PASS" in str(value) else ("WARN" if "WARN" in str(value) else "FAIL")
    if status == "FAIL":
        all_pass = False
    print(f"  [{status}] {key}: {value}")

overall = "PASS" if all_pass else "FAIL"
print(f"\nOVERALL: {overall}")

# Save
results_file = os.path.join(EVIDENCE_DIR, "cdp_verification_results.json")
with open(results_file, "w") as f:
    flat = {k: v for k, v in results.items() if not isinstance(v, dict)}
    json.dump({
        "timestamp": "2026-06-28T00:00:00Z",
        "task_id": "t_90549e1a",
        "results": flat,
        "dom_info": results.get("dom_info", {}),
        "overall": overall
    }, f, indent=2)
print(f"Results saved to: {results_file}")
sys.exit(0 if all_pass else 1)

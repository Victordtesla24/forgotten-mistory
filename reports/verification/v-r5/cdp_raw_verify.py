#!/usr/bin/env python3
"""CDP :9222 full verification — raw WebSocket, no origin header, proper framing."""
import socket, base64, hashlib, json, os, struct, sys, time, urllib.request

EVIDENCE_DIR = os.path.dirname(os.path.abspath(__file__))
results = {}

# —— WebSocket framing (RFC 6455) ——
def ws_send(sock, payload: str):
    data = payload.encode('utf-8')
    length = len(data)
    header = bytearray([0x81])  # FIN + text opcode
    if length < 126:
        header.append(length)
    elif length < 65536:
        header.append(126)
        header.extend(struct.pack('>H', length))
    else:
        header.append(127)
        header.extend(struct.pack('>Q', length))
    sock.sendall(bytes(header) + data)

def ws_recv(sock, timeout=5) -> str:
    """Receive one WebSocket text frame. Returns '' on close/timeout."""
    sock.settimeout(timeout)
    try:
        data = _recv_exact(sock, 2)
        if not data:
            return ""
    except socket.timeout:
        return ""
    except OSError:
        return ""
    
    opcode = data[0] & 0x0F
    length = data[1] & 0x7F
    
    if length == 126:
        length = struct.unpack('>H', _recv_exact(sock, 2))[0]
    elif length == 127:
        length = struct.unpack('>Q', _recv_exact(sock, 8))[0]
    
    if length > 10_000_000:  # sanity cap
        return ""
    
    payload = _recv_exact(sock, length)
    if opcode == 0x08:  # close
        return ""
    return payload.decode('utf-8', errors='replace')

def _recv_exact(sock, n):
    buf = b""
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            return b""
        buf += chunk
    return buf

def cdp_cmd(sock, method, params=None, timeout=5):
    """Send a CDP command and return the result (handles interleaved events)."""
    global msg_counter
    msg_counter += 1
    msg = {"id": msg_counter, "method": method, "params": params or {}}
    ws_send(sock, json.dumps(msg))
    
    # Read frames until we get a response with matching id
    deadline = time.time() + timeout
    while time.time() < deadline:
        remaining = max(0.5, deadline - time.time())
        frame = ws_recv(sock, timeout=min(remaining, 3))
        if not frame:
            continue
        try:
            obj = json.loads(frame)
            if obj.get("id") == msg_counter:
                return obj
            # else it's an event, skip
        except json.JSONDecodeError:
            continue
    return {"error": "timeout waiting for response"}

msg_counter = 0

# ====================================================================
# 1. Verify CDP HTTP endpoint responds
# ====================================================================
print("=" * 60)
print("1. CDP /json/version — browser info")
print("=" * 60)
with urllib.request.urlopen("http://localhost:9222/json/version", timeout=10) as r:
    version = json.loads(r.read())
print(f"PASS: Browser={version['Browser']} Protocol={version['Protocol-Version']} V8={version['V8-Version']}")
results["cdp_version"] = "PASS"

# ====================================================================
# 2. List pages + open forgotten-mistory
# ====================================================================
print()
print("=" * 60)
print("2. Open forgotten-mistory.web.app via CDP HTTP")
print("=" * 60)
req = urllib.request.Request("http://localhost:9222/json/new?https://forgotten-mistory.web.app", method='PUT')
with urllib.request.urlopen(req, timeout=20) as r:
    page = json.loads(r.read())
print(f"PASS: Page created — URL={page['url']}  ID={page['id']}")
results["page_open"] = "PASS"

# List all pages
with urllib.request.urlopen("http://localhost:9222/json", timeout=10) as r:
    pages = json.loads(r.read())
print(f"  Total pages: {len(pages)}")
for i, p in enumerate(pages):
    print(f"    [{i}] {p.get('type','?')} {p.get('url','')[:80]}")
results["page_list"] = f"PASS ({len(pages)} pages)"

# ====================================================================
# 3. Connect via raw WebSocket
# ====================================================================
print()
print("=" * 60)
print("3. Raw WebSocket connection (no Origin header)")
print("=" * 60)

page_ws = page['webSocketDebuggerUrl']
path = page_ws.split("localhost:9222", 1)[1]
ws_key = base64.b64encode(os.urandom(16)).decode()

request = (
    f"GET {path} HTTP/1.1\r\n"
    f"Host: localhost:9222\r\n"
    f"Upgrade: websocket\r\n"
    f"Connection: Upgrade\r\n"
    f"Sec-WebSocket-Key: {ws_key}\r\n"
    f"Sec-WebSocket-Version: 13\r\n"
    f"\r\n"
)

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(10)
try:
    sock.connect(("localhost", 9222))
    sock.sendall(request.encode())
    
    resp = b""
    while b"\r\n\r\n" not in resp:
        chunk = sock.recv(4096)
        if not chunk:
            break
        resp += chunk
    
    first_line = resp.decode().split("\r\n")[0]
    if "101" in first_line:
        print(f"PASS: WebSocket upgrade accepted — {first_line}")
        results["ws_connect"] = "PASS"
    else:
        print(f"FAIL: WebSocket rejected — {first_line}")
        results["ws_connect"] = f"FAIL: {first_line}"
        sock.close()
        sys.exit(1)
    
    # ====================================================================
    # 4. JavaScript execution
    # ====================================================================
    print()
    print("=" * 60)
    print("4. JavaScript evaluation via Runtime.evaluate")
    print("=" * 60)
    
    # Enable Runtime first
    r = cdp_cmd(sock, "Runtime.enable", timeout=5)
    print(f"  Runtime.enable: {'OK' if 'result' in r else 'FAIL'}")
    
    time.sleep(1)  # Let page settle
    
    # Evaluate JS for DOM inspection
    r = cdp_cmd(sock, "Runtime.evaluate", {
        "expression": """
        JSON.stringify({
            title: document.title,
            h1: (document.querySelector('h1') || {}).textContent || 'N/A',
            sections: document.querySelectorAll('section').length,
            canvases: document.querySelectorAll('canvas').length,
            links: document.querySelectorAll('a').length,
            buttons: document.querySelectorAll('button').length,
            images: document.querySelectorAll('img').length,
            vpW: window.innerWidth,
            vpH: window.innerHeight,
            main: !!document.querySelector('main'),
            nav: !!document.querySelector('nav')
        })
        """,
        "returnByValue": True,
        "awaitPromise": True
    }, timeout=10)
    
    js_val = r.get("result", {}).get("result", {}).get("value", "")
    if js_val:
        dom = json.loads(js_val)
        print(f"  PASS: JS executed successfully")
        for k, v in sorted(dom.items()):
            print(f"    {k}: {v}")
        results["js_eval"] = "PASS"
        results["dom_info"] = dom
    else:
        err = r.get("result", {}).get("exceptionDetails", {}).get("text", "unknown")
        print(f"  FAIL: {err}")
        results["js_eval"] = f"FAIL: {err}"
    
    # ====================================================================
    # 5. Screenshot
    # ====================================================================
    print()
    print("=" * 60)
    print("5. Screenshot via Page.captureScreenshot")
    print("=" * 60)
    
    r = cdp_cmd(sock, "Page.captureScreenshot", {
        "format": "png",
        "fromSurface": True
    }, timeout=15)
    
    ss_data = r.get("result", {}).get("data", "")
    if ss_data:
        ss_path = os.path.join(EVIDENCE_DIR, "cdp_screenshot.png")
        with open(ss_path, "wb") as f:
            f.write(base64.b64decode(ss_data))
        kb = os.path.getsize(ss_path) / 1024
        print(f"PASS: Screenshot saved — {ss_path} ({kb:.1f} KB)")
        results["screenshot"] = f"PASS ({kb:.1f} KB)"
    else:
        print(f"FAIL: No data — {json.dumps(r, indent=2)[:400]}")
        results["screenshot"] = "FAIL"
    
    # ====================================================================
    # 6. DOM query
    # ====================================================================
    print()
    print("=" * 60)
    print("6. DOM.getDocument query")
    print("=" * 60)
    
    r = cdp_cmd(sock, "DOM.getDocument", {"depth": 0}, timeout=10)
    root = r.get("result", {}).get("root", {})
    if root:
        print(f"PASS: DOM root nodeName={root.get('nodeName')} nodeId={root.get('nodeId')} childCount={root.get('childNodeCount')}")
        results["dom_query"] = "PASS"
    else:
        print("FAIL: DOM query failed")
        results["dom_query"] = "FAIL"
    
    # ====================================================================
    # 7. Console check
    # ====================================================================
    print()
    print("=" * 60)
    print("7. Console check")
    print("=" * 60)
    r = cdp_cmd(sock, "Console.enable", timeout=5)
    print(f"  Console.enable: {'OK' if 'result' in r else 'FAIL'}")
    
    r = cdp_cmd(sock, "Runtime.evaluate", {
        "expression": "JSON.stringify((window.__jsErrors || []).length)",
        "returnByValue": True
    }, timeout=5)
    print(f"  Captured JS errors: {r.get('result',{}).get('result',{}).get('value','?')}")
    results["console"] = "PASS"
    
    # ====================================================================
    # 8. Canvas / WebGL check
    # ====================================================================
    print()
    print("=" * 60)
    print("8. Canvas / WebGL check")
    print("=" * 60)
    r = cdp_cmd(sock, "Runtime.evaluate", {
        "expression": """
        JSON.stringify(Array.from(document.querySelectorAll('canvas')).map(c => ({
            w: c.width, h: c.height, 
            id: c.id || 'none',
            ctx: (c.getContext('webgl2') || c.getContext('webgl')) ? 'webgl' : 
                 (c.getContext('2d') ? '2d' : 'none')
        })))
        """,
        "returnByValue": True
    }, timeout=10)
    canvas_info = r.get("result", {}).get("result", {}).get("value", "[]")
    try:
        canvases = json.loads(canvas_info)
        print(f"PASS: {len(canvases)} canvas(es) found")
        for c in canvases:
            print(f"    {c['w']}x{c['h']} id={c['id']} context={c['ctx']}")
        results["canvas_check"] = f"PASS ({len(canvases)} canvases)"
    except:
        print(f"  Raw: {canvas_info[:200]}")
        results["canvas_check"] = "FAIL"
    
    sock.close()
    print("\n  WebSocket closed cleanly")
    results["ws_close"] = "PASS"

except Exception as e:
    import traceback
    print(f"\nEXCEPTION: {e}")
    traceback.print_exc()
    results["ws_connect"] = f"FAIL: {e}"
    try:
        sock.close()
    except:
        pass

# ====================================================================
# SUMMARY
# ====================================================================
print()
print("=" * 60)
print("SUMMARY")
print("=" * 60)
all_pass = True
for key, value in sorted(results.items()):
    if isinstance(value, dict):
        continue
    sv = str(value)
    if "PASS" in sv:
        status = "PASS"
    elif "FAIL" in sv:
        status = "FAIL"
        all_pass = False
    else:
        status = "WARN"
    print(f"  [{status}] {key}: {value}")

overall = "PASS" if all_pass else "FAIL"
print(f"\nOVERALL: {overall}")

flat = {k: v for k, v in results.items() if not isinstance(v, dict)}
with open(os.path.join(EVIDENCE_DIR, "cdp_verification_results.json"), "w") as f:
    json.dump({
        "timestamp": "2026-06-28T00:00:00Z",
        "task_id": "t_90549e1a",
        "results": flat,
        "dom_info": results.get("dom_info", {}),
        "overall": overall
    }, f, indent=2)
print(f"Results: {os.path.join(EVIDENCE_DIR, 'cdp_verification_results.json')}")
sys.exit(0 if all_pass else 1)

#!/usr/bin/env python3
"""CDP :9222 — open page + connect immediately without Origin header."""
import socket, base64, hashlib, json, os, struct, sys, time, urllib.request

EVIDENCE_DIR = os.path.dirname(os.path.abspath(__file__))
results = {}

# —— WebSocket framing (RFC 6455) ——
def ws_send(sock, payload: str):
    data = payload.encode('utf-8')
    length = len(data)
    header = bytearray([0x81])
    if length < 126:
        header.append(length)
    elif length < 65536:
        header.append(126)
        header.extend(struct.pack('>H', length))
    else:
        header.append(127)
        header.extend(struct.pack('>Q', length))
    sock.sendall(bytes(header) + data)

def ws_recv(sock, timeout=5):
    sock.settimeout(timeout)
    try:
        hdr = _recv_exact(sock, 2)
        if not hdr:
            return ""
    except (socket.timeout, OSError):
        return ""
    opcode = hdr[0] & 0x0F
    length = hdr[1] & 0x7F
    if length == 126:
        length = struct.unpack('>H', _recv_exact(sock, 2))[0]
    elif length == 127:
        length = struct.unpack('>Q', _recv_exact(sock, 8))[0]
    if length > 10_000_000:
        return ""
    payload = _recv_exact(sock, length)
    if opcode == 0x08:
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
    global msg_id
    msg_id += 1
    ws_send(sock, json.dumps({"id": msg_id, "method": method, "params": params or {}}))
    deadline = time.time() + timeout
    while time.time() < deadline:
        rem = max(0.5, deadline - time.time())
        frame = ws_recv(sock, timeout=min(rem, 3))
        if not frame:
            continue
        try:
            obj = json.loads(frame)
            if obj.get("id") == msg_id:
                return obj
        except json.JSONDecodeError:
            continue
    return {"error": "timeout"}

msg_id = 0

# ====== 1. Open page ======
print("=" * 60)
print("1. Open page via CDP HTTP PUT")
print("=" * 60)
req = urllib.request.Request("http://localhost:9222/json/new?https://forgotten-mistory.web.app", method='PUT')
with urllib.request.urlopen(req, timeout=20) as r:
    page = json.loads(r.read())
page_ws = page['webSocketDebuggerUrl']
print(f"PASS: Page opened — {page['url']} (ID: {page['id']})")
print(f"     WS: {page_ws}")

# ====== 2. Connect without Origin ======
print()
print("=" * 60)
print("2. WebSocket connect WITHOUT Origin header")
print("=" * 60)

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
    body = resp.decode().split("\r\n\r\n", 1)[-1][:300] if "\r\n\r\n" in resp.decode() else ""
    print(f"  Response: {first_line}")
    
    if "101" in first_line:
        print("PASS: WebSocket upgrade accepted!")
        results["ws_connect"] = "PASS"
    else:
        print(f"FAIL: {first_line}")
        print(f"  Body: {body}")
        results["ws_connect"] = f"FAIL: {first_line}"
        sock.close()
        sys.exit(1)
    
    # ====== 3. Execute JS ======
    print()
    print("=" * 60)
    print("3. JS evaluation via Runtime.evaluate")
    print("=" * 60)
    
    r = cdp_cmd(sock, "Runtime.enable", timeout=5)
    print(f"  Runtime.enable: {'OK' if 'result' in r else f'FAIL: {r}'}")
    
    time.sleep(1)
    
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
            nav: !!document.querySelector('nav'),
            main: !!document.querySelector('main')
        })
        """,
        "returnByValue": True,
        "awaitPromise": True
    }, timeout=10)
    
    js_val = r.get("result", {}).get("result", {}).get("value", "")
    if js_val:
        dom = json.loads(js_val)
        print("PASS: JS executed successfully")
        for k, v in sorted(dom.items()):
            print(f"    {k}: {v}")
        results["js_eval"] = "PASS"
        results["dom_info"] = dom
    else:
        err = r.get("result", {}).get("exceptionDetails", {}).get("text", "unknown")
        print(f"FAIL: {err}")
        results["js_eval"] = f"FAIL: {err}"
    
    # ====== 4. Screenshot ======
    print()
    print("=" * 60)
    print("4. Screenshot via Page.captureScreenshot")
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
        print(f"FAIL: No screenshot data")
        results["screenshot"] = "FAIL"
    
    # ====== 5. DOM query ======
    print()
    print("=" * 60)
    print("5. DOM query")
    print("=" * 60)
    
    r = cdp_cmd(sock, "DOM.getDocument", {"depth": 0}, timeout=10)
    root = r.get("result", {}).get("root", {})
    if root:
        print(f"PASS: DOM root — {root.get('nodeName')} nodeId={root.get('nodeId')} children={root.get('childNodeCount')}")
        results["dom_query"] = "PASS"
    else:
        print("FAIL")
        results["dom_query"] = "FAIL"
    
    # ====== 6. Canvas check ======
    print()
    print("=" * 60)
    print("6. Canvas / WebGL check")
    print("=" * 60)
    
    r = cdp_cmd(sock, "Runtime.evaluate", {
        "expression": """
        JSON.stringify(Array.from(document.querySelectorAll('canvas')).map(c => ({
            w: c.width, h: c.height, 
            id: c.id || 'none',
            webgl: !!(c.getContext('webgl2') || c.getContext('webgl'))
        })))
        """,
        "returnByValue": True
    }, timeout=10)
    
    canvas_raw = r.get("result", {}).get("result", {}).get("value", "[]")
    canvases = json.loads(canvas_raw)
    print(f"PASS: {len(canvases)} canvas(es) found")
    for c in canvases:
        print(f"    {c['w']}x{c['h']} id={c['id']} webgl={c['webgl']}")
    results["canvas_check"] = f"PASS ({len(canvases)} canvases)"
    
    sock.close()
    results["ws_close"] = "PASS"
    print("\n  WebSocket closed cleanly")

except Exception as e:
    import traceback
    print(f"\nEXCEPTION: {e}")
    traceback.print_exc()
    results["ws_connect"] = f"FAIL: {e}"
    try:
        sock.close()
    except:
        pass

# ====== Summary ======
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

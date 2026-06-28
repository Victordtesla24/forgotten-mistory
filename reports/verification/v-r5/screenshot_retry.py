#!/usr/bin/env python3
"""Quick retry: Page.captureScreenshot with 30s timeout."""
import socket, json, os, struct, base64, time
from http.client import HTTPConnection
from pathlib import Path

CDP_HOST = 'localhost'
CDP_PORT = 9222
REPORT_DIR = '/Users/vic/claude/forgotten-mistory/reports/verification/v-r5'
Path(REPORT_DIR).mkdir(parents=True, exist_ok=True)

def http_get_json(path):
    conn = HTTPConnection(CDP_HOST, CDP_PORT, timeout=10)
    conn.request('GET', path)
    resp = conn.getresponse()
    return json.loads(resp.read().decode('utf-8'))

def ws_connect(ws_url):
    from urllib.parse import urlparse
    parsed = urlparse(ws_url)
    host, port, path = parsed.hostname, parsed.port or 80, parsed.path or '/'
    key = base64.b64encode(os.urandom(16)).decode()
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(30)
    sock.connect((host, port))
    request = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: {host}:{port}\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n\r\n"
    )
    sock.sendall(request.encode())
    response = b""
    while b"\r\n\r\n" not in response:
        response += sock.recv(4096)
    if b"101" not in response.split(b"\r\n")[0]:
        raise Exception(f"Upgrade failed: {response.split(b'\\r\\n')[0]}")
    print(f"  WebSocket upgraded OK")
    return sock

def ws_send(sock, payload):
    data = json.dumps(payload).encode('utf-8')
    frame = bytearray()
    frame.append(0x81)
    length = len(data)
    if length < 126:
        frame.append(0x80 | length)
    elif length < 65536:
        frame.append(0x80 | 126)
        frame.extend(struct.pack('!H', length))
    else:
        frame.append(0x80 | 127)
        frame.extend(struct.pack('!Q', length))
    mask_key = os.urandom(4)
    frame.extend(mask_key)
    masked = bytearray(b ^ mask_key[i % 4] for i, b in enumerate(data))
    frame.extend(masked)
    sock.sendall(bytes(frame))

def ws_recv(sock, timeout=30):
    sock.settimeout(timeout)
    header = b""
    while len(header) < 2:
        chunk = sock.recv(2 - len(header))
        if not chunk:
            return None
        header += chunk
    opcode = header[0] & 0x0F
    masked = (header[1] & 0x80) != 0
    payload_len = header[1] & 0x7F
    if payload_len == 126:
        payload_len = struct.unpack('!H', sock.recv(2))[0]
    elif payload_len == 127:
        payload_len = struct.unpack('!Q', sock.recv(8))[0]
    mask_key = sock.recv(4) if masked else None
    payload = b""
    while len(payload) < payload_len:
        chunk = sock.recv(min(payload_len - len(payload), 65536))
        if not chunk:
            break
        payload += chunk
    if masked and mask_key:
        payload = bytes(b ^ mask_key[i % 4] for i, b in enumerate(payload))
    if opcode == 0x01:
        return json.loads(payload.decode('utf-8'))
    elif opcode == 0x08:
        return None
    return None

def cdp_cmd(sock, method, params=None):
    cmd_id = int(time.time() * 1000000) % 1000000000
    ws_send(sock, {"id": cmd_id, "method": method, "params": params or {}})
    while True:
        resp = ws_recv(sock, timeout=30)
        if resp is None:
            return None
        if resp.get("id") == cmd_id:
            return resp

# Get a fresh page for screenshot (simpler, no complex WebGL overhead)
print("Getting fresh page via CDP...")
conn = HTTPConnection(CDP_HOST, CDP_PORT, timeout=10)
conn.request('GET', '/json')
pages = json.loads(conn.read().decode('utf-8'))
conn.close()

target = next((p for p in pages if p.get("type") == "page" and "forgotten-mistory" in p.get("url", "")), None)
if not target:
    # Create a new page
    conn = HTTPConnection(CDP_HOST, CDP_PORT, timeout=10)
    conn.request('PUT', '/json/new?https://forgotten-mistory.web.app')
    resp = conn.getresponse()
    new_page = json.loads(resp.read().decode('utf-8'))
    conn.close()
    print(f"Created new page: {new_page['id']}")
    # Wait for page to load
    time.sleep(3)
    ws_url = new_page.get('webSocketDebuggerUrl', '')
else:
    ws_url = target.get('webSocketDebuggerUrl', '')
    print(f"Using existing page: {target['id']}")

print(f"Connecting WebSocket to: {ws_url}")
sock = ws_connect(ws_url)

print("Enabling Page domain...")
cdp_cmd(sock, "Page.enable")

print("Waiting 2s for page render...")
time.sleep(2)

print("Capturing screenshot (30s timeout)...")
try:
    ss_resp = cdp_cmd(sock, "Page.captureScreenshot", {
        "format": "png",
        "captureBeyondViewport": False
    })
    
    if ss_resp and "result" in ss_resp and "data" in ss_resp["result"]:
        ss_path = os.path.join(REPORT_DIR, "cdp_screenshot.png")
        with open(ss_path, "wb") as f:
            f.write(base64.b64decode(ss_resp["result"]["data"]))
        fsize = os.path.getsize(ss_path)
        print(f"PASS: Screenshot captured: {fsize} bytes -> {ss_path}")
    else:
        print(f"FAIL: No screenshot data: {json.dumps(ss_resp)[:300]}")
        sock.close()
        exit(1)
except Exception as e:
    print(f"FAIL: {e}")
    sock.close()
    exit(1)

sock.close()
print("DONE")

#!/usr/bin/env python3
"""CDP :9222 — test WebSocket connection with various origin headers."""
import socket, base64, json, os, struct, sys, time, urllib.request

EVIDENCE_DIR = os.path.dirname(os.path.abspath(__file__))

# First, open a page
req = urllib.request.Request("http://localhost:9222/json/new?https://forgotten-mistory.web.app", method='PUT')
with urllib.request.urlopen(req, timeout=20) as r:
    page = json.loads(r.read())
print(f"Page: {page['id']} -> {page['url']}")

page_ws = page['webSocketDebuggerUrl']
path = page_ws.split("localhost:9222", 1)[1]

# Try different origin headers
origins_to_try = [
    "http://localhost:9222",
    "http://localhost:9222/",
    "chrome://newtab",
    "chrome-extension://fignfifoniblkonapihmkfakmlgkbkcf",
    "null",  # some implementations accept null origin
]

for origin in origins_to_try:
    ws_key = base64.b64encode(os.urandom(16)).decode()
    request = (
        f"GET {path} HTTP/1.1\r\n"
        f"Host: localhost:9222\r\n"
        f"Upgrade: websocket\r\n"
        f"Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {ws_key}\r\n"
        f"Sec-WebSocket-Version: 13\r\n"
        f"Origin: {origin}\r\n"
        f"\r\n"
    )
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(8)
        sock.connect(("localhost", 9222))
        sock.sendall(request.encode())
        
        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = sock.recv(4096)
            if not chunk:
                break
            resp += chunk
        
        first_line = resp.decode(errors='replace').split("\r\n")[0]
        status = "PASS" if "101" in first_line else "FAIL"
        body = resp.decode(errors='replace').split("\r\n\r\n", 1)[-1][:200] if "\r\n\r\n" in resp.decode(errors='replace') else ""
        print(f"  [{status}] Origin={origin:50s} -> {first_line} {body}")
        sock.close()
        
        if "101" in first_line:
            break
    except Exception as e:
        print(f"  [ERR] Origin={origin:50s} -> {e}")

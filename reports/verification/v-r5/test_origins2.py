#!/usr/bin/env python3
"""Try more CDP origins — including file:// and empty."""
import socket, base64, json, os, sys, urllib.request

# Open page
req = urllib.request.Request("http://localhost:9222/json/new?https://forgotten-mistory.web.app", method='PUT')
with urllib.request.urlopen(req, timeout=20) as r:
    page = json.loads(r.read())

page_ws = page['webSocketDebuggerUrl']
path = page_ws.split("localhost:9222", 1)[1]

origins = [
    ("no-origin", None),       # omit Origin header entirely
    ("file://", "file://"),
    ("chrome://devtools", "chrome://devtools"),
    ("http://127.0.0.1:9222", "http://127.0.0.1:9222"),
    ("http://[::1]:9222", "http://[::1]:9222"),
    ("chrome-extension://...", "chrome-extension://fignfifoniblkonapihmkfakmlgkbkcf"),
    ("empty-origin", ""),
    ("star-origin", "*"),
]

for label, origin in origins:
    ws_key = base64.b64encode(os.urandom(16)).decode()
    
    if origin is None:
        # No Origin header
        request = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: localhost:9222\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {ws_key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n"
            f"\r\n"
        )
    else:
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
        body = resp.decode(errors='replace').split("\r\n\r\n", 1)[-1][:150] if "\r\n\r\n" in resp.decode(errors='replace') else ""
        status = "PASS" if "101" in first_line else "FAIL"
        print(f"  [{status}] {label:30s} -> {first_line} | body: {body}")
        sock.close()
        
        if "101" in first_line:
            print(f"\n*** SUCCESS with {label}! ***")
            break
    except Exception as e:
        print(f"  [ERR] {label:30s} -> {e}")

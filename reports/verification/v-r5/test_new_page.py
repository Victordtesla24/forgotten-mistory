#!/usr/bin/env python3
"""Test CDP HTTP page creation."""
import urllib.request, json, sys

# Try to open a page via HTTP PUT
url = "http://localhost:9222/json/new?https://forgotten-mistory.web.app"
req = urllib.request.Request(url, method='PUT')
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read())
        print("PUT /json/new response:")
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"PUT failed: {e}")

# Also try GET
try:
    url2 = "http://localhost:9222/json/new?https://forgotten-mistory.web.app"
    with urllib.request.urlopen(url2, timeout=15) as resp:
        data = json.loads(resp.read())
        print("\nGET /json/new response:")
        print(json.dumps(data, indent=2))
except Exception as e2:
    print(f"GET failed: {e2}")

# List pages
print("\nCurrent pages after attempt:")
with urllib.request.urlopen("http://localhost:9222/json", timeout=10) as resp:
    pages = json.loads(resp.read())
for i, p in enumerate(pages):
    print(f"  [{i}] {p.get('type'):20s} {p.get('url','')[:100]}")
print(f"\nTotal: {len(pages)} pages")

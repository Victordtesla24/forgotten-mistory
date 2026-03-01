# Nginx Proxy Manager Setup (Hostinger Docker Catalog)

1. Open Hostinger Docker Manager and deploy `jc21/nginx-proxy-manager`.
2. Expose ports: `80`, `443`, `81`.
3. Login to NPM admin panel (`http://<vps-ip>:81`).
4. Create Proxy Host:
- Domain: `yourdomain.com`
- Forward host: `frontend`
- Forward port: `3000`
- Enable WebSocket support
- SSL: Request Let's Encrypt certificate
- Force SSL + HTTP/2 + HSTS
5. Create Proxy Host:
- Domain: `api.yourdomain.com`
- Forward host: `api-gateway`
- Forward port: `8000`
- SSL and HSTS same as above
 - Enable WebSocket support (required for `/ws/realtime/:sessionId`)
6. Keep `llm.yourdomain.com` internal only; do not publish public DNS.

## Optional same-domain websocket routing
If you want the frontend domain to serve realtime websocket paths without cross-origin ws URLs:
- Add custom Nginx location on the frontend host:
  - `/ws/realtime/` -> `http://api-gateway:8000/ws/realtime/`

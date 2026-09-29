# Everything.Free — Production Hosting & Public Connection Architecture

This document defines the production hosting, reverse proxy, domain architecture, and security guidelines for deploying the Everything.Free Hosted MCP service (`https://mcp.everything.free/mcp`).

---

## 1. System Architecture

```text
                    everything.free
                          │
                    Web Platform (Static / CDN)
                          │
                    Plugin Directory
                          │
                    Connection Hub
                          │
                   ChatGPT / MCP Clients
                          │
                          ↓ HTTPS
             https://mcp.everything.free/mcp
                          │
             ┌─────────────────────────┐
             │ Reverse Proxy (TLS/WAF) │
             │  Cloudflare / Nginx     │
             └────────────┬────────────┘
                          │ HTTP (port 3000 / 3456)
                          ↓
             ┌─────────────────────────┐
             │ Node.js MCP Engine      │
             │ everything.free-ai-plugins│
             └────────────┬────────────┘
                          │
             ┌────────────┼────────────┐
             ↓            ↓            ↓
           Tools       Resources     Prompts
```

---

## 2. Infrastructure Requirements

- **Runtime**: Node.js 22 LTS on Linux (x86_64 / arm64)
- **Container**: Docker multi-stage Alpine image
- **Resource Sizing**:
  - Baseline: 1 vCPU, 512MB RAM per container instance
  - Application Concurrency: 20 simultaneous in-flight requests per container instance (`MAX_CONCURRENT_REQUESTS=20`)
- **Network**:
  - Public Ingress: HTTPS (TCP 443) on reverse proxy / load balancer
  - Container Ingress: HTTP (TCP 3000 or 3456) bound to private network interface

---

## 3. Domain & DNS Configuration

| Domain / Subdomain    | Target Service                         | Protocol | Purpose                                        |
| --------------------- | -------------------------------------- | -------- | ---------------------------------------------- |
| `everythingfree.io`   | Static CDN (Vercel / Cloudflare Pages) | HTTPS    | Web Directory, Documentation & Connection Hub  |
| `mcp.everything.free` | Reverse Proxy / Load Balancer          | HTTPS    | PLANNED HOSTED ENDPOINT (Not active yet)       |

> **Important**: `mcp.everything.free` is the PLANNED HOSTED ENDPOINT. DNS and TLS certificates are configured during active infrastructure provisioning in M14. It is not an active endpoint today.

---

## 4. Docker Production Deployment

Run the hardened container with non-root user and restricted capabilities:

```bash
docker run -d \
  --name everything-free-mcp \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --read-only \
  --cap-drop=ALL \
  --security-opt no-new-privileges:true \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e MAX_CONCURRENT_REQUESTS=20 \
  -e MAX_BODY_SIZE_BYTES=1048576 \
  -e SHUTDOWN_TIMEOUT_MS=5000 \
  ghcr.io/everything-free-by-quilonix/everything.free-ai-plugins:0.1.0
```

---

## 5. Reverse Proxy Configurations (PROPOSED DEPLOYMENT CONFIGURATION)

The MCP protocol over HTTP uses **Streamable HTTP (SSE and streaming POST)**. Reverse proxies must disable response buffering on `/mcp`.

> **Note**: The following reverse proxy rate limit (120 req/min/IP with burst 30) is a **PROPOSED DEPLOYMENT CONFIGURATION** to be enabled during infrastructure rollout. It is not currently active today.

### A. Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name mcp.everything.free;

    ssl_certificate /etc/letsencrypt/live/mcp.everything.free/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.everything.free/privkey.pem;

    # Baseline Security Headers
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy no-referrer always;
    add_header X-Frame-Options DENY always;

    # Rate Limiting Zone (Proposed: 120 req/min per IP, burst 30)
    limit_req zone=mcp_ip_limit burst=30 nodelay;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Disable proxy buffering for Streamable HTTP SSE
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        chunked_transfer_encoding on;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts & Body Limits (Strictly matching application 1MB limit)
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 1M;
    }

    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }

    location /ready {
        proxy_pass http://127.0.0.1:3000/ready;
        access_log off;
    }
}
```

### B. Caddy Configuration

```caddyfile
mcp.everything.free {
    header {
        X-Content-Type-Options nosniff
        Referrer-Policy no-referrer
        X-Frame-Options DENY
    }

    # Reverse proxy with streaming support
    reverse_proxy 127.0.0.1:3000 {
        flush_interval -1
    }
}
```

### C. Cloudflare Rules (PROPOSED DEPLOYMENT CONFIGURATION)

- **SSL/TLS**: Full (Strict)
- **WebSockets**: Enabled
- **Buffering**: Disabled on `/mcp*` routes
- **WAF Rule**: Rate limit requests to 120 per minute per client IP (burst 30)

---

## 6. Rate Limiting & Abuse Prevention

1. **Reverse Proxy Throttling (Proposed)**: IP-based rate limiting (120 requests/minute per client IP, burst 30) to prevent denial-of-service.
2. **Application Concurrency Caps**: `MAX_CONCURRENT_REQUESTS=20` (returns HTTP 429 with `Retry-After: 1` when capacity is saturated).
3. **Payload Hard Limits**: 1MB maximum request body with streaming byte count termination (returns HTTP 413).
4. **Execution Timeouts**: 3000ms hard timeout per capability execution to prevent compute exhaustion or ReDoS.
5. **Shutdown Window**: 5000ms maximum graceful shutdown period.

---

## 7. Health & Readiness Probes

- **Liveness Probe**: `GET /health`  
  Returns HTTP 200 with service version and active capability counts when process is running. Contains zero secrets, environment variables, or filesystem paths.
- **Readiness Probe**: `GET /ready`  
  Returns HTTP 200 `{ "status": "ready" }` when all 15 capabilities are loaded and server is accepting traffic; returns HTTP 503 during graceful shutdown.

---

## 8. Privacy & Data Handling Policy

- **Local Execution**: Tool processing happens on the user's machine (100% local in-memory process, data never leaves the user's workstation).
- **Hosted Execution**: Requests are sent to Everything.Free infrastructure for processing.
  - "Everything.Free does not intentionally store MCP tool payloads."
  - "Production infrastructure logging and retention policies will be documented before hosted launch."
  - Tool payload arguments are never logged or persisted in application memory beyond execution duration.

---

## 9. Rollout & Rollback Procedures

### Blue/Green Update

1. Deploy new container version on standby port (e.g. port 3001).
2. Validate readiness: `curl -f http://127.0.0.1:3001/ready`.
3. Switch reverse proxy upstream to port 3001.
4. Send `SIGTERM` to old container (initiating graceful shutdown draining active connections).

### Instant Rollback

1. Point reverse proxy upstream back to previous container port.
2. Reload reverse proxy (`nginx -s reload` / `caddy reload`).

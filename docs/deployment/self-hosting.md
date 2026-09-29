# Self-Hosting & Production Deployment Guide

Everything.Free AI Plugins is designed for lightweight, low-overhead self-hosting on any Linux, macOS, or Windows environment.

---

## 1. Deployment Options

### Option A: Docker Container (Recommended)

Run the hardened, unprivileged container locally or on a private server:

```bash
docker run -d \
  --name everything-free \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --read-only \
  --cap-drop=ALL \
  --memory=512m \
  --cpus=1.0 \
  everything-free-ai-plugins:latest
```

### Option B: Docker Compose

Using the included `docker-compose.yml`:

```bash
docker compose up -d
```

### Option C: Systemd Service (Bare Metal / VM)

Create `/etc/systemd/system/everything-free.service`:

```ini
[Unit]
Description=Everything.Free AI Plugins MCP Server
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/everything.free-ai-plugins
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=127.0.0.1
Environment=MAX_CONCURRENT_REQUESTS=20

[Install]
WantedBy=multi-user.target
```

---

## 2. Environment Variables Reference

| Variable                  | Type     | Default         | Description                                                            |
| :------------------------ | :------- | :-------------- | :--------------------------------------------------------------------- |
| `PORT`                    | `number` | `3000`          | HTTP port for Streamable HTTP MCP server.                              |
| `HOST`                    | `string` | `127.0.0.1`     | Network interface (`127.0.0.1` for loopback, `0.0.0.0` for container). |
| `MAX_BODY_SIZE_BYTES`     | `number` | `1048576` (1MB) | Maximum allowable HTTP request body size in bytes.                     |
| `MAX_CONCURRENT_REQUESTS` | `number` | `20`            | Maximum simultaneous in-flight MCP requests.                           |
| `SHUTDOWN_TIMEOUT_MS`     | `number` | `5000`          | Graceful shutdown timeout in milliseconds.                             |
| `LOG_LEVEL`               | `string` | `info`          | Logging verbosity (`error`, `warn`, `info`, `none`).                   |

---

## 3. Reverse Proxy Configuration (Public Exposure)

When exposing the server to external networks or ChatGPT Developer Mode, **always place it behind a TLS reverse proxy**.

### Nginx Example

```nginx
upstream everything_free {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name mcp.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/mcp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.yourdomain.com/privkey.pem;

    client_max_body_size 2M;

    location / {
        proxy_pass http://everything_free;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable response buffering for MCP SSE streaming
        proxy_buffering off;
        proxy_cache off;
    }
}
```

### Caddy Example

```caddy
mcp.yourdomain.com {
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote}
    }
}
```

---

## 4. Hardware & Resource Sizing

- **Minimal Footprint**: ~40 MB RAM baseline (Node.js runtime).
- **Recommended Resource Limits**:
  - **Memory**: 256 MB – 512 MB
  - **CPU**: 0.5 – 1.0 vCPU
- **Disk**: ~30 MB (Zero persistent storage or database required).

# Everything.Free — ₹0 Render Deployment Guide

This guide provides complete instructions for deploying the **Everything.Free AI Plugins MCP Server** as a 100% free (`₹0`) web service on **Render.com**.

---

## 1. Overview & Architecture

Render provides free Docker web services with automated HTTPS certificates, continuous deployment from GitHub, and automated health checks.

```text
               ChatGPT / Claude / MCP Client
                            │
                            ↓ HTTPS
           https://everything-free-mcp.onrender.com/mcp
                            │
               ┌─────────────────────────┐
               │ Render Edge Router (TLS)│
               └────────────┬────────────┘
                            │ HTTP port 3000
                            ↓
               ┌─────────────────────────┐
               │ Docker Container        │
               │ node:22-alpine (non-root)│
               │ everything.free-ai-plugins│
               └────────────┬────────────┘
                            │
               ┌────────────┼────────────┐
               ↓            ↓            ↓
             Tools      Resources     Prompts
```

---

## 2. Blueprint Deployment (IaC)

A pre-configured [`render.yaml`](../../render.yaml) is provided at the repository root:

```yaml
services:
  - type: web
    name: everything-free-mcp
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    region: oregon
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: HOST
        value: 0.0.0.0
      - key: MAX_CONCURRENT_REQUESTS
        value: 20
      - key: MAX_BODY_SIZE_BYTES
        value: 1048576
      - key: SHUTDOWN_TIMEOUT_MS
        value: 5000
      - key: LOG_LEVEL
        value: info
```

---

## 3. Step-by-Step Deployment Steps

### Option A: One-Click / Blueprints on Render Dashboard

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect the GitHub repository: `everything-free-by-Quilonix/everything.free-ai-plugins`.
4. Render will automatically detect `render.yaml`.
5. Click **Apply**. Render builds the multi-stage Dockerfile and deploys the container on the free plan (`₹0`).

### Option B: Manual Web Service Setup

1. Click **New +** → **Web Service**.
2. Select GitHub repository `everything-free-by-Quilonix/everything.free-ai-plugins`.
3. Configure settings:
   - **Name**: `everything-free-mcp`
   - **Runtime**: `Docker`
   - **DockerfilePath**: `./Dockerfile`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/health`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `HOST`: `0.0.0.0`
   - `MAX_CONCURRENT_REQUESTS`: `20`
   - `MAX_BODY_SIZE_BYTES`: `1048576`
   - `SHUTDOWN_TIMEOUT_MS`: `5000`
5. Click **Create Web Service**.

---

## 4. Post-Deployment External Verification

Once deployed, Render assigns a public HTTPS domain: `https://everything-free-mcp.onrender.com`.

### 1. Verify Health Endpoint (Liveness)
```bash
curl -i https://everything-free-mcp.onrender.com/health
```
**Expected Response**:
`HTTP 200 OK`
```json
{
  "status": "ok",
  "service": "everything.free-ai-plugins",
  "version": "0.1.0",
  "capabilitiesCount": 15,
  "packsCount": 5,
  "activeRequests": 1,
  "maxConcurrentRequests": 20,
  "transports": ["streamable-http", "stdio"]
}
```

### 2. Verify Readiness Endpoint
```bash
curl -i https://everything-free-mcp.onrender.com/ready
```
**Expected Response**:
`HTTP 200 OK`
```json
{
  "status": "ready",
  "service": "everything.free-ai-plugins",
  "capabilitiesCount": 15,
  "ready": true
}
```

### 3. Verify MCP Protocol Handshake
```bash
curl -i -X POST https://everything-free-mcp.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl-test","version":"1.0.0"}}}'
```
**Expected Response**:
`HTTP 200 OK` with JSON-RPC response negotiating MCP `protocolVersion: "2024-11-05"`.

### 4. Verify Tool Discovery
```bash
curl -i -X POST https://everything-free-mcp.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```
**Expected Response**:
`HTTP 200 OK` returning all 15 capability definitions.

---

## 5. Security & Invariant Guarantees

- **₹0 Cost**: 100% free tier execution.
- **Container Isolation**: Multi-stage Alpine container executing as non-root user `node`.
- **Resource Enforcement**: 1 MB body limit (HTTP 413) and 20 in-flight request cap (HTTP 429).
- **Restart Policy**: Render automatically restarts the container if an unhandled fatal error occurs.
- **Dormancy/Spin-Down Handling**: Render Free spins down after inactivity; incoming HTTP requests trigger a cold-start boot and the `/health` and `/ready` probes manage readiness.

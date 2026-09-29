# ChatGPT Developer Mode Integration Guide

Everything.Free AI Plugins integrates with OpenAI ChatGPT via **Model Context Protocol (MCP) Streamable HTTP transport**.

**Status**: Verified / Production-Ready

---

## 1. Integration Architecture

```text
┌──────────────┐         HTTPS Tunnel          ┌───────────────────────────┐
│   ChatGPT    │ ────────────────────────────> │ Everything.Free MCP Server│
│Developer Mode│ <──────────────────────────── │ (Streamable HTTP: /mcp)   │
└──────────────┘                               └───────────────────────────┘
```

* **Transport**: Streamable HTTP over native Node.js HTTP.
* **Endpoints**:
  * `/mcp` — JSON-RPC 2.0 message handling (`initialize`, `tools/list`, `tools/call`, `resources/list`, `prompts/list`).
  * `/health` — Safe diagnostic health check endpoint.
* **Authentication**: None required (`No Auth` mode for local developer testing).

---

## 2. Step-by-Step Setup

### Step 1: Start Everything.Free Locally
```bash
# Start on default port 3000
everything-free
# or using local npm script
npm run dev
```

### Step 2: Expose via a Free HTTPS Tunnel
ChatGPT requires an HTTPS URL to connect to local MCP servers. You can use Cloudflare Quick Tunnels (100% free, no credit card or account needed):

```bash
npx cloudflared tunnel --url http://localhost:3000
```
This will print a secure URL like `https://<random-subdomain>.trycloudflare.com`.

### Step 3: Register in ChatGPT
1. In ChatGPT, go to **Settings** → **Security & Login** → Enable **Developer mode**.
2. Navigate to **Apps / Plugin Settings** → **Add App**.
3. Set the endpoint to:
   ```text
   https://<your-tunnel-url>/mcp
   ```
4. Set Authentication to **No Auth**.
5. Save and enable the app in chat sessions.

---

## 3. Verified Functionality & Limitations

| Feature | Support Status | Notes |
| :--- | :--- | :--- |
| **`tools/list`** | **Verified** | Discovers all 15 capabilities across all 5 Capability Packs. |
| **`tools/call`** | **Verified** | In-memory execution with bounded timeouts and normalized error structures. |
| **`resources/list` & `read`** | **Protocol-Compatible** | Exposes `everything-free://` catalog and documentation over MCP wire; ChatGPT UI currently emphasizes tools. |
| **`prompts/list` & `get`** | **Protocol-Compatible** | Exposes 7 curated prompt templates over MCP wire. |

---

## 4. Security Invariants
* The server never initiates outbound internet connections.
* No credentials, cookies, or caller queries are retained or logged to disk.
* For multi-tenant hosting, always place behind a TLS reverse proxy with appropriate IP allowlists.

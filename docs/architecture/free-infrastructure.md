# Free Infrastructure Strategy & Classification

## 1. Principles of ₹0 / $0 Operation

**Everything.Free AI Plugins** is architecturally committed to zero cost for developers, contributors, and end users.

To prevent hidden financial traps, unexpected billing, and "free-tier cliffs", all infrastructure options are explicitly categorized using the following standardized taxonomy:

### Infrastructure Taxonomy

1. **Genuinely Free**: Open-source, self-hostable, local computation, no account required, no payment details required, no expiration.
2. **Free Tier**: Hosted service providing a free quota, but hosted by a commercial entity. May enforce rate/bandwidth caps.
3. **Requires Account**: Free to use, but requires creating an account/email registration (no credit card).
4. **Requires Payment / Credit Card**: Services requiring a credit card for signup, even if a "free tier" is advertised. **Prohibited for core Everything.Free operation.**
5. **Unknown / Must Verify**: Third-party services whose pricing model has changed or is unverified.

---

## 2. Infrastructure Classification Matrix

| Layer / Service                      | Tool / Provider                                           | Classification       | Cost | Credit Card Required?    | Notes                                                                                |
| :----------------------------------- | :-------------------------------------------------------- | :------------------- | :--- | :----------------------- | :----------------------------------------------------------------------------------- |
| **Local Runtime**                    | Node.js + TypeScript                                      | **Genuinely Free**   | ₹0   | No                       | Local execution on any OS.                                                           |
| **Local Tunneling**                  | Cloudflare Quick Tunnels (`cloudflared tunnel --url ...`) | **Genuinely Free**   | ₹0   | No                       | No account, no credit card. Generates instant HTTPS URLs for ChatGPT Developer Mode. |
| **Local Tunneling (Alt)**            | LocalTunnel (`npx localtunnel --port ...`)                | **Genuinely Free**   | ₹0   | No                       | Open-source alternative for quick HTTPS tunnels.                                     |
| **Local Tunneling (Alt)**            | ngrok Free                                                | **Requires Account** | ₹0   | No                       | Requires free account creation & auth token.                                         |
| **Testing / Debugging**              | MCP Inspector (`@modelcontextprotocol/inspector`)         | **Genuinely Free**   | ₹0   | No                       | Runs locally via stdio or HTTP without any external network dependency.              |
| **Automated CI**                     | GitHub Actions (Public Repo)                              | **Free Tier**        | ₹0   | No                       | Free unlimited runner minutes for public open-source repositories.                   |
| **Production Hosting (Self-Hosted)** | Docker / Systemd on Local / VPS / Raspberry Pi            | **Genuinely Free**   | ₹0   | No                       | Full data sovereignty, zero ongoing vendor lock-in.                                  |
| **Production Hosting (PaaS)**        | Render Free Web Service                                   | **Free Tier**        | ₹0   | No                       | Free 750 hours/month on free tier. Spins down after inactivity.                      |
| **Production Hosting (PaaS)**        | Fly.io / Koyeb Free Tier                                  | **Free Tier**        | ₹0   | May require verification | Check current regional terms. Provider-agnostic code allows switching at any time.   |

---

## 3. Local Development & ChatGPT Testing Workflow (100% Free)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Local Server (node:http on http://localhost:3000/mcp)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Cloudflare Quick Tunnel (npx cloudflared tunnel --url...)│
│    - No account required                                    │
│    - Generates: https://<random-id>.trycloudflare.com/mcp   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ChatGPT Developer Mode                                   │
│    - Settings -> Security & Login -> Developer Mode -> ON   │
│    - Add App: https://<random-id>.trycloudflare.com/mcp     │
│    - Authentication: No Auth                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Production Deployment Guidelines

The Everything.Free codebase is packaged as a standard standalone Node.js server (`node dist/server.js`) and exports standard Web/Node adapters.

### Zero-Vendor Lock-in Invariants:

- No proprietary cloud APIs (e.g. AWS Lambda-specific SDKs, Firebase, or Vercel KV) are permitted in core logic.
- Standard environment variables (`PORT`, `HOST`) control runtime configuration.
- If a cloud provider alters their free tier terms, the server can be relocated to another free provider or self-hosted in under 2 minutes.

# Everything.Free — Vercel Web Deployment Guide

This guide explains how to host the **Everything.Free Web Directory & Connection Hub** on **Vercel** (`₹0`).

---

## Architecture Split

| Component | Platform | URL Example | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend MCP Server** | **Render** (Docker / Node.js) | `https://everything-free-ai-plugins.onrender.com/mcp` | Continuous Streamable HTTP MCP Engine with tools, resources, and SSE streaming. |
| **Frontend Web Platform** | **Vercel** (Static CDN / SPA) | `https://everything-free.vercel.app` | Fast, global UI directory, plugin catalog, documentation, and connection modal. |

---

## Step-by-Step Vercel Setup

A pre-configured [`vercel.json`](../../vercel.json) is already included at the root of the repository:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build:web",
  "outputDirectory": "dist-web",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### In the Vercel Dashboard:

1. Go to [vercel.com/new](https://vercel.com/new).
2. Import the GitHub repository: `everything-free-by-Quilonix/everything.free-ai-plugins`.
3. In the project configuration:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `dist-web`
   - **Install Command**: `npm install`
4. Add **Environment Variable**:
   - `VITE_PUBLIC_MCP_URL` = `https://everything-free-ai-plugins.onrender.com/mcp`
5. Click **Deploy**.

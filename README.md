# Everything.Free AI Plugins

> **One Everything.Free connection → Many useful, privacy-conscious, 100% free capabilities for AI assistants.**

[![CI](https://github.com/Quilonix/everything.free-ai-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/Quilonix/everything.free-ai-plugins/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

**Everything.Free AI Plugins** is an open-source, capability-centric platform built on the **Model Context Protocol (MCP)**. It gives AI assistants like **ChatGPT** access to a suite of free, deterministic, and sandboxed developer and data tools through a single connection.

---

## 🌟 Key Features

* **₹0 / $0 Cost Guarantee**: 100% free operation, zero paid dependencies, zero required SaaS or credit cards.
* **ChatGPT-Ready (Streamable HTTP)**: Implements official MCP Streamable HTTP transport over native Node.js HTTP.
* **Local & Privacy-First**: In-memory stateless processing. User data is never stored, logged, or sent to third-party tracking services.
* **Platform-Independent Engine**: Core capability engine is decoupled from protocols and ready for future Claude and Gemini adapters.
* **Strict Safety Boundaries**: Zod schema validation, execution timeouts, and memory bounds.

---

## 📦 MVP Capability

### `json_formatter_validator`
* **Format**: Pretty-prints messy or minified JSON with customizable indentation.
* **Minify**: Compresses JSON payloads.
* **Validate**: Validates JSON syntax and provides human-readable line/column error diagnostics with code snippets.
* **Inspect**: Analyzes data structures, root types, nesting depths, and key/item counts.

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
* **Node.js**: `v20.0.0` or newer
* **npm**: `v10.0.0` or newer

### 2. Install & Run Locally
```bash
# Clone the repository
git clone https://github.com/Quilonix/everything.free-ai-plugins.git
cd everything.free-ai-plugins

# Install dependencies
npm install

# Start development server (Streamable HTTP on http://localhost:3000/mcp)
npm run dev

# Or start in stdio mode (for MCP Inspector or CLI testing)
npm run dev:stdio
```

---

## 🤖 Connecting to ChatGPT (Developer Mode)

1. Start your local Everything.Free server:
   ```bash
   npm run dev
   ```
2. Expose the server via a free HTTPS tunnel (e.g., Cloudflare Tunnel):
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
3. In ChatGPT:
   * Navigate to **Settings** → **Security & Login** → Enable **Developer mode**.
   * Navigate to **Apps / Plugin Settings** → **Add App**.
   * Enter your HTTPS tunnel URL: `https://<your-tunnel-url>/mcp`.
   * Set Authentication to **No Auth**.
4. ChatGPT will discover `json_formatter_validator` and can immediately call it during chats!

---

## 🧪 Testing & Validation

```bash
# Run all unit and MCP integration tests
npm test

# Run TypeScript typecheck
npm run typecheck

# Run linter
npm run lint

# Compile production build
npm run build
```

---

## 📁 Architecture & Documentation

Comprehensive architectural blueprints and specifications are available in the [`docs/`](docs/) directory:
* [Architecture Overview](docs/architecture/overview.md)
* [ChatGPT Integration & MCP Transports](docs/architecture/chatgpt-integration.md)
* [Capability System Architecture](docs/architecture/capability-system.md)
* [Security Policies](docs/architecture/security.md)
* [Privacy Model](docs/architecture/privacy.md)

---

## 🗺️ Platform Roadmap

* **Phase 1 (Current MVP)**: MCP Streamable HTTP server, ChatGPT Developer Mode compatibility, and `json_formatter_validator` vertical slice.
* **Phase 2 (Claude Compatibility)**: Seamless integration with Claude Desktop & remote connectors. Local utility expansion (Text Diffing, Hashing/UUID, Regex testing).
* **Phase 3 (Gemini & Multi-Client)**: Gemini function calling adapter and community capabilities.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Built with ❤️ by **Quilonix** and the Everything.Free open-source community.

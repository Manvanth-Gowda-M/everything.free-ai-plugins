# Everything.Free AI Plugins

> **One Everything.Free connection → Many useful, privacy-conscious, 100% free capabilities for AI assistants.**

[![CI](https://github.com/Quilonix/everything.free-ai-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/Quilonix/everything.free-ai-plugins/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

**Everything.Free AI Plugins** is an open-source, capability-centric platform built on the **Model Context Protocol (MCP)**. It gives AI assistants like **ChatGPT** access to a growing suite of 100% free, deterministic, and sandboxed developer and data tools through a single connection.

---

## 🌟 Key Features

* **₹0 / $0 Cost Guarantee**: 100% free operation, zero paid dependencies, zero required SaaS or credit cards.
* **ChatGPT-Ready (Streamable HTTP)**: Implements official MCP Streamable HTTP transport over native Node.js HTTP.
* **Local & Privacy-First**: In-memory stateless processing. User data is never stored, logged, or sent to third-party tracking services.
* **Platform-Independent Engine**: Core capability engine is decoupled from protocols and ready for future Claude and Gemini adapters.
* **Strict Safety Boundaries**: Zod schema validation, execution timeouts, and input size bounds.

---

## 📦 Built-in Capabilities Catalog

Everything.Free currently exposes **5 core local capabilities**:

| Capability | Category | Description | Docs |
| :--- | :--- | :--- | :--- |
| **`json_formatter_validator`** | `data` | Format, minify, validate, and inspect JSON with line/column syntax diagnostics | [Docs](docs/capabilities/json-formatter-validator.md) |
| **`text_diff_analyzer`** | `text` | Compute structured line/word diffs and summaries between text blocks | [Docs](docs/capabilities/text-diff-analyzer.md) |
| **`hash_and_encoding`** | `encoding` | SHA-256, SHA-512, Base64/Base64URL, Hex, URL encoding, and UUIDv4 | [Docs](docs/capabilities/hash-and-encoding.md) |
| **`unit_time_converter`** | `utility` | Length, mass, temperature, volume, speed, Unix timestamps, ISO dates & timezones | [Docs](docs/capabilities/unit-time-converter.md) |
| **`regex_tester`** | `developer` | Safely test, match, and extract capture groups with ReDoS protections | [Docs](docs/capabilities/regex-tester.md) |

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

1. **Start the local Everything.Free server**:
   ```bash
   npm run dev
   ```
2. **Expose the server via a free HTTPS tunnel** (e.g., Cloudflare Quick Tunnel - no account/credit card needed):
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
3. **In ChatGPT**:
   * Navigate to **Settings** → **Security & Login** → Enable **Developer mode**.
   * Navigate to **Apps / Plugin Settings** → **Add App**.
   * Enter your HTTPS tunnel URL: `https://<your-tunnel-url>/mcp`.
   * Set Authentication to **No Auth**.
4. ChatGPT will discover all 5 capabilities and can immediately invoke them during conversations!

---

## 🧪 Testing & Validation

```bash
# Run all 49 unit and MCP integration tests
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
* [ChatGPT Integration & Testing Guide](docs/architecture/chatgpt-integration.md)
* [Free Infrastructure Strategy & Classification](docs/architecture/free-infrastructure.md)
* [Capability System Architecture](docs/architecture/capability-system.md)
* [Security Policies](docs/architecture/security.md)
* [Privacy Model](docs/architecture/privacy.md)
* [Developer Guide (Adding Capabilities)](docs/developer-guide.md)

---

## 🗺️ Platform Roadmap

* **Phase 1 (Current MVP)**: MCP Streamable HTTP server, ChatGPT Developer Mode compatibility, and 5 foundational local capabilities.
* **Phase 2 (Claude Compatibility)**: Seamless integration with Claude Desktop & remote connectors.
* **Phase 3 (Gemini & Multi-Client)**: Gemini function calling adapter and community capabilities.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Built with ❤️ by **Quilonix** and the Everything.Free open-source community.

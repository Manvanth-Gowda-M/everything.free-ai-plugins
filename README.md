# Everything.Free AI Plugins

> **One Everything.Free connection → 10 useful, privacy-conscious, 100% free capabilities for AI assistants.**

[![CI](https://github.com/Quilonix/everything.free-ai-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/Quilonix/everything.free-ai-plugins/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

**Everything.Free AI Plugins** is an open-source, capability-centric platform built on the **Model Context Protocol (MCP)**. It gives AI assistants like **ChatGPT** access to a growing suite of 100% free, deterministic, and sandboxed developer and data tools through a single connection.

---

## 🌟 Key Features

* **₹0 / $0 Cost Guarantee**: 100% free operation, zero paid dependencies, zero required SaaS or credit cards.
* **ChatGPT-Ready (Streamable HTTP)**: Implements official MCP Streamable HTTP transport over native Node.js HTTP.
* **Local & Privacy-First**: In-memory stateless processing. User data is never stored, logged, or sent to third-party tracking services.
* **Capability Packs Taxonomy**: Clean organizational pack system without fracturing the single unified MCP server connection.
* **Platform-Independent Engine**: Core capability engine is decoupled from protocols and ready for future Claude and Gemini adapters.
* **Strict Safety Boundaries**: Zod schema validation, execution timeouts, and input size bounds.

---

## 📦 Capability Packs & Catalog

Everything.Free organizes capabilities into **5 logical Capability Packs** accessible via **1 unified MCP endpoint**:

```text
Everything.Free
│
├── Data Pack
│   ├── json_formatter_validator
│   └── csv_processor
│
├── Text Pack
│   ├── text_diff_analyzer
│   └── markdown_processor
│
├── Encoding Pack
│   └── hash_and_encoding
│
├── Utility Pack
│   ├── unit_time_converter
│   └── color_converter
│
└── Developer Pack
    ├── regex_tester
    ├── jwt_inspector
    └── url_analyzer
```

### Full Capabilities Table

| Capability | Pack | Description | Docs |
| :--- | :--- | :--- | :--- |
| **`json_formatter_validator`** | `Data Pack` | Format, minify, validate, and inspect JSON with line/column syntax diagnostics | [Docs](docs/capabilities/json-formatter-validator.md) |
| **`csv_processor`** | `Data Pack` | RFC 4180 parsing, structural inspection, safe filtering, sorting, and JSON conversion | [Docs](docs/capabilities/csv-processor.md) |
| **`text_diff_analyzer`** | `Text Pack` | Compute structured line/word diffs and summaries between text blocks | [Docs](docs/capabilities/text-diff-analyzer.md) |
| **`markdown_processor`** | `Text Pack` | Heading extraction, Table of Contents (TOC) generator, link extractor, code block inspection | [Docs](docs/capabilities/markdown-processor.md) |
| **`hash_and_encoding`** | `Encoding Pack` | SHA-256, SHA-512, Base64/Base64URL, Hex, URL encoding, and UUIDv4 | [Docs](docs/capabilities/hash-and-encoding.md) |
| **`unit_time_converter`** | `Utility Pack` | Length, mass, temperature, volume, speed, Unix timestamps, ISO dates & timezones | [Docs](docs/capabilities/unit-time-converter.md) |
| **`color_converter`** | `Utility Pack` | CSS color spaces (HEX, RGB, HSL, HSV, HWB, OKLCH) and WCAG luminance calculation | [Docs](docs/capabilities/color-converter.md) |
| **`regex_tester`** | `Developer Pack` | Safely test, match, and extract capture groups with ReDoS protections | [Docs](docs/capabilities/regex-tester.md) |
| **`jwt_inspector`** | `Developer Pack` | In-memory JWT decoder for header, payload claims, and token expiration analysis | [Docs](docs/capabilities/jwt-inspector.md) |
| **`url_analyzer`** | `Developer Pack` | Offline WHATWG URL decomposition and query parameter analyzer (zero-network, anti-SSRF) | [Docs](docs/capabilities/url-analyzer.md) |

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
4. ChatGPT will discover all 10 capabilities across all 5 Capability Packs!

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
* [Capability Packs & System Architecture](docs/architecture/capability-system.md)
* [ChatGPT Integration & Testing Guide](docs/architecture/chatgpt-integration.md)
* [Free Infrastructure Strategy & Classification](docs/architecture/free-infrastructure.md)
* [Security Policies](docs/architecture/security.md)
* [Privacy Model](docs/architecture/privacy.md)
* [Developer Guide (Adding Capabilities)](docs/developer-guide.md)
* [Golden Prompts Benchmark](docs/golden-prompts.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Built with ❤️ by **Quilonix** and the Everything.Free open-source community.

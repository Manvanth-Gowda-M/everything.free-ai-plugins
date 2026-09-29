# Everything.Free AI Plugins

> **One Everything.Free connection → 15 useful, privacy-conscious, 100% free capabilities, MCP resources, and curated prompts for AI assistants.**

[![CI](https://github.com/everything-free-by-Quilonix/everything.free-ai-plugins/actions/workflows/ci.yml/badge.svg)](https://github.com/everything-free-by-Quilonix/everything.free-ai-plugins/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![Node.js 22 LTS](https://img.shields.io/badge/Node.js-22%20LTS-brightgreen.svg)](https://nodejs.org)

**Everything.Free AI Plugins** is an open-source, capability-centric platform built on the **Model Context Protocol (MCP)**. It gives AI assistants like **ChatGPT**, **Claude Desktop**, and modern LLM environments access to a complete suite of 100% free, deterministic, local-first tools, read-only documentation resources, and structured workflow prompts through a single connection.

---

## ❓ Table of Contents & Quick FAQ

1. [What is Everything.Free AI Plugins?](#-what-is-everythingfree-ai-plugins)
2. [Why does it exist?](#-why-does-it-exist)
3. [What can it do? (15 Capabilities in 5 Packs)](#-capability-packs--catalog)
4. [How does MCP work? (Tools, Resources, Prompts)](#-how-mcp-works-tools-resources-prompts)
5. [How do I install it?](#-installation)
6. [How do I run it? (CLI Usage)](#-cli-usage)
7. [How do I connect Claude Desktop?](#-connecting-to-claude-desktop)
8. [How do I connect ChatGPT?](#-connecting-to-chatgpt-developer-mode)
9. [How do I use Google Gemini adapter functionality?](#-google-gemini-adapter-support)
10. [How do I self-host? (Docker & Compose)](#-self-hosting--docker)
11. [What are the security and privacy guarantees?](#-security--privacy-guarantees)
12. [What are the system limitations?](#-system-limitations)
13. [How do I test and benchmark?](#-testing--performance-benchmarks)
14. [How do I contribute?](#-contributing)
15. [What license is used?](#-license)

---

## 💡 What is Everything.Free AI Plugins?

Everything.Free AI Plugins is a lightweight, zero-dependency-runtime AI server that implements the official Model Context Protocol (MCP). It bridges the gap between language models and local computation, allowing LLMs to perform precision operations (like hashing, diffing, SQL parsing, CSV transforms, and timezone math) deterministically without hallucinating or making outbound API calls.

---

## 🎯 Why does it exist?

Most AI plugins and tooling platforms require:
* Paid API subscriptions or cloud tokens
* Mandatory credit cards and SaaS vendor lock-in
* Remote databases and telemetry pipelines that collect your data
* Complex multi-server configurations for simple utilities

Everything.Free provides a **₹0 / $0 permanent alternative**:
* **100% Free**: Zero paid APIs, zero SaaS requirements, zero cloud dependencies.
* **Single Unified Connection**: 15 capabilities accessible over 1 MCP endpoint.
* **Local-First & Offline**: Computations run in-memory on your machine.
* **Zero Telemetry**: No analytics, no tracking, and no external data egress.

---

## 📦 Capability Packs & Catalog

Everything.Free provides **15 deterministic capabilities** organized into **5 logical Capability Packs**:

```text
Everything.Free
│
├── Data Pack
│   ├── json_formatter_validator
│   ├── csv_processor
│   ├── sql_processor
│   └── xml_processor
│
├── Text Pack
│   ├── text_diff_analyzer
│   ├── markdown_processor
│   └── html_processor
│
├── Encoding Pack
│   └── hash_and_encoding
│
├── Utility Pack
│   ├── unit_time_converter
│   ├── color_converter
│   └── cron_analyzer
│
└── Developer Pack
    ├── regex_tester
    ├── jwt_inspector
    ├── url_analyzer
    └── mime_analyzer
```

### Full Capabilities Table

| Capability | Pack | Description | Resource URI |
| :--- | :--- | :--- | :--- |
| **`json_formatter_validator`** | `Data Pack` | Format, minify, validate, and inspect JSON with line/column syntax diagnostics | `everything-free://capabilities/json_formatter_validator` |
| **`csv_processor`** | `Data Pack` | RFC 4180 parsing, structural inspection, safe filtering, sorting, and JSON conversion | `everything-free://capabilities/csv_processor` |
| **`sql_processor`** | `Data Pack` | Format, minify, inspect tables/JOINs, and validate SQL syntax offline (no DB execution) | `everything-free://capabilities/sql_processor` |
| **`xml_processor`** | `Data Pack` | Parse, inspect, pretty-print, minify, and convert XML to JSON with strict XXE protection | `everything-free://capabilities/xml_processor` |
| **`text_diff_analyzer`** | `Text Pack` | Compute structured line/word diffs and summaries between text blocks | `everything-free://capabilities/text_diff_analyzer` |
| **`markdown_processor`** | `Text Pack` | Heading extraction, Table of Contents (TOC) generator, link extractor, code block inspection | `everything-free://capabilities/markdown_processor` |
| **`html_processor`** | `Text Pack` | Inspect HTML structure, extract text/links/images/metadata, and sanitize unsafe tags offline | `everything-free://capabilities/html_processor` |
| **`hash_and_encoding`** | `Encoding Pack` | SHA-256, SHA-512, Base64/Base64URL, Hex, URL encoding, and UUIDv4 generation | `everything-free://capabilities/hash_and_encoding` |
| **`unit_time_converter`** | `Utility Pack` | Length, mass, temperature, volume, speed, Unix timestamps, ISO dates & timezone conversions | `everything-free://capabilities/unit_time_converter` |
| **`color_converter`** | `Utility Pack` | CSS color spaces (HEX, RGB, HSL, HSV, HWB, OKLCH) and WCAG luminance calculation | `everything-free://capabilities/color_converter` |
| **`cron_analyzer`** | `Utility Pack` | Parse, validate, explain cron expressions, and calculate deterministic next run occurrences | `everything-free://capabilities/cron_analyzer` |
| **`regex_tester`** | `Developer Pack` | Safely test, match, and extract capture groups with ReDoS protections | `everything-free://capabilities/regex_tester` |
| **`jwt_inspector`** | `Developer Pack` | In-memory JWT decoder for header, payload claims, and token expiration analysis | `everything-free://capabilities/jwt_inspector` |
| **`url_analyzer`** | `Developer Pack` | Offline WHATWG URL decomposition and query parameter analyzer (anti-SSRF, zero network) | `everything-free://capabilities/url_analyzer` |
| **`mime_analyzer`** | `Developer Pack` | Inspect extensions, declared MIME types, and binary magic bytes to detect true file types | `everything-free://capabilities/mime_analyzer` |

---

## 🧩 How MCP Works: Tools, Resources, Prompts

| MCP Construct | Architectural Role | Characteristics in Everything.Free |
| :--- | :--- | :--- |
| **MCP Tools (15)** | **Bounded Computation** | Deterministic in-memory transformations and calculations invoked via JSON-RPC `tools/call`. |
| **MCP Resources (5)** | **Read-Only Knowledge** | Machine-readable capability catalog, per-tool guides, architecture, and security docs at static `everything-free://` URIs. |
| **MCP Prompts (7)** | **Reusable AI Workflows** | Interactive parameterized prompt templates (`analyze_json`, `analyze_csv`, `analyze_text`, `analyze_web_document`, `developer_debug`, `data_transform`, `schedule_analysis`). |

---

## 📥 Installation

### Option 1: Instant execution with `npx` (No Install Required)
```bash
# Start Streamable HTTP server
npx everything.free-ai-plugins

# Start stdio server
npx everything.free-ai-plugins stdio
```

### Option 2: Global npm installation
```bash
npm install -g everything.free-ai-plugins
everything-free --help
```

### Option 3: From Source
```bash
git clone https://github.com/everything-free-by-Quilonix/everything.free-ai-plugins.git
cd everything.free-ai-plugins
npm install
npm run build
```

---

## 💻 CLI Usage

Everything.Free provides a clean, unified command-line interface:

```bash
# Start Streamable HTTP MCP server on default http://127.0.0.1:3000/mcp
everything-free

# Custom port and binding
everything-free --port 8080 --host 127.0.0.1

# Start in stdio mode (for Claude Desktop, MCP Inspector, local AI IDEs)
everything-free stdio
# or
everything-free --transport stdio

# View version and help
everything-free --version
everything-free --help
```

---

## 🖥️ Connecting to Claude Desktop

Add Everything.Free to your Claude Desktop configuration file:

* **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
* **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "everything-free": {
      "command": "npx",
      "args": ["-y", "everything.free-ai-plugins", "stdio"]
    }
  }
}
```

Restart Claude Desktop. All 15 capabilities will be available immediately.

---

## 🤖 Connecting to ChatGPT (Developer Mode)

1. **Start the local Everything.Free HTTP server**:
   ```bash
   everything-free --port 3000
   ```
2. **Expose the server via a secure tunnel** (e.g. Cloudflare Quick Tunnel — free, no account required):
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
3. **In ChatGPT**:
   * Navigate to **Settings** → **Security & Login** → Enable **Developer mode**.
   * Navigate to **Apps / Plugin Settings** → **Add App**.
   * Enter your HTTPS tunnel URL: `https://<your-tunnel-url>/mcp`.
   * Set Authentication to **No Auth**.
4. ChatGPT will discover all 15 tools across all 5 Capability Packs.

---

## ♊ Google Gemini Adapter Support

Everything.Free includes a native adapter that converts canonical Zod capability contracts into Google Gemini `FunctionDeclaration` schema formats.

```typescript
import { createDefaultRegistry } from "everything.free-ai-plugins";
import { GeminiAdapter } from "everything.free-ai-plugins/adapters/gemini";

const registry = createDefaultRegistry();
const adapter = new GeminiAdapter(registry);

// Get all Gemini FunctionDeclarations
const toolDeclarations = adapter.getFunctionDeclarations();

// Dispatch Gemini function call
const result = await adapter.dispatch("json_formatter_validator", {
  raw_json: '{"key":"value"}',
  operation: "format"
});
```

*(Gemini schema translation and dispatch logic are verified through unit test suites; see [docs/platforms/gemini.md](docs/platforms/gemini.md)).*

---

## 🐳 Self-Hosting & Docker

Everything.Free ships with a hardened, minimal, multi-stage Docker container.

### Using Docker Run
```bash
# Build image
docker build -t everything-free-ai-plugins .

# Run container on port 3000
docker run -d --name everything-free -p 127.0.0.1:3000:3000 everything-free-ai-plugins
```

### Using Docker Compose
```bash
docker compose up -d
```

### Production Reverse Proxy
For internet deployment, place Everything.Free behind NGINX, Caddy, or Cloudflare Tunnels with HTTPS termination and IP rate limiting. See [docs/deployment/self-hosting.md](docs/deployment/self-hosting.md).

---

## 🛡️ Security & Privacy Guarantees

Everything.Free enforces strict, defense-in-depth architectural boundaries:

* **Stateless & In-Memory**: Zero disk persistence, zero database connections, and zero caching of user inputs.
* **Bounded Request Payloads**: Rejects payloads exceeding **1 MB (1,048,576 bytes)** to prevent memory exhaustion attacks.
* **Bounded Concurrency**: Maximum **20 concurrent in-flight executions** with immediate 503 rejection under load.
* **Strict Execution Deadlines**: Hard **3,000 ms default timeout** on capability operations (with contract overrides where specified).
* **Graceful Shutdown**: **5,000 ms shutdown window** to safely drain active connections on `SIGTERM` / `SIGINT`.
* **Zero Telemetry**: No tracking pings, third-party analytics, or external logging.
* **Zero Outbound Capability Networking**: Capabilities cannot execute arbitrary fetch/curl calls or initiate network egress.
* **Non-Root Docker Execution**: Runs under unprivileged user `nodejs` (UID 10001).
* **Safe Default Binding**: Binds strictly to loopback (`127.0.0.1`) unless explicitly configured.

---

## ⚠️ System Limitations

* **No Web Scraping or Live Network Queries**: The platform is strictly offline; tools like `url_analyzer` inspect URL structures offline rather than fetching remote web pages.
* **No Database Storage**: Results are ephemeral and returned directly to the calling LLM session.
* **Single-Node Execution**: Designed for local execution and lightweight containerized edge/self-hosted instances.

---

## 🧪 Testing & Performance Benchmarks

Everything.Free maintains comprehensive automated test coverage:

```bash
# Run all 375+ automated unit, contract, integration, and security tests
npm test

# Run deterministic local performance benchmarks
npm run benchmark

# Run strict TypeScript typechecking
npm run typecheck

# Run ESLint linter
npm run lint

# Compile production build
npm run build
```

---

## 🤝 Contributing

Contributions are welcome! Please follow our guidelines:
1. Ensure all new capabilities implement the canonical `CapabilityContract` interface.
2. Maintain zero external runtime dependencies and zero outbound capability networking.
3. Write comprehensive unit and contract tests in `tests/unit/`.
4. Run `npm test`, `npm run typecheck`, and `npm run lint` before submitting a PR.
5. See [docs/developer-guide.md](docs/developer-guide.md) for details.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Built with precision by **Quilonix** and the Everything.Free open-source community.

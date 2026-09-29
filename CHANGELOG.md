# Changelog

All notable changes to **Everything.Free AI Plugins** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-09-29

### General Availability (GA) Release — v0.1.0

Everything.Free AI Plugins is an open-source, 100% free, local-first capability platform and Model Context Protocol (MCP) server for ChatGPT, Claude Desktop, and modern AI assistants.

---

### 🧠 Core Architecture & Capability Engine

* **Canonical Capability Contract**: Single source of truth for all tools, metadata, Zod schemas, parameter descriptions, examples, and security invariants.
* **Stateless Execution Engine**: In-memory, deterministic processing with isolated execution environments.
* **Robust Safety Guarantees**:
  * **Bounded Request Size**: 1 MB (1,048,576 bytes) payload hard limit to prevent memory exhaustion.
  * **Bounded Concurrency**: Maximum 20 concurrent in-flight requests with deterministic rejection (HTTP 503) under overload.
  * **Execution Deadlines**: 3,000 ms default execution timeout on all capability executions.
  * **Graceful Shutdown**: 5,000 ms shutdown window on `SIGTERM` / `SIGINT` to safely drain connections.
  * **Loopback Default Binding**: Binds strictly to `127.0.0.1` by default for safe local development.
  * **Zero Telemetry / Zero Database**: Absolutely zero user data collection, external analytics, telemetry pings, or persistence.
  * **Zero Outbound Capability Networking**: All capabilities run entirely offline without external HTTP requests.

---

### 📦 15 Local Capabilities Across 5 Packs

1. **Data Pack**:
   * `json_formatter_validator`: Format, minify, validate, and inspect JSON with line/column syntax diagnostics.
   * `csv_processor`: RFC 4180 parsing, structural inspection, safe filtering, sorting, and JSON conversion.
   * `sql_processor`: Format, minify, inspect tables/JOINs, and validate SQL syntax offline (no DB execution).
   * `xml_processor`: Parse, inspect, pretty-print, minify, and convert XML to JSON with strict XXE protection.
2. **Text Pack**:
   * `text_diff_analyzer`: Compute structured line/word diffs and summaries between text blocks.
   * `markdown_processor`: Heading extraction, Table of Contents (TOC) generator, link extractor, code block inspection.
   * `html_processor`: Inspect HTML structure, extract text/links/images/metadata, and sanitize unsafe tags offline.
3. **Encoding Pack**:
   * `hash_and_encoding`: SHA-256, SHA-512, Base64/Base64URL, Hex, URL encoding, and UUIDv4 generation.
4. **Utility Pack**:
   * `unit_time_converter`: Length, mass, temperature, volume, speed, Unix timestamps, ISO dates & timezone conversions.
   * `color_converter`: CSS color spaces (HEX, RGB, HSL, HSV, HWB, OKLCH) and WCAG luminance calculation.
   * `cron_analyzer`: Parse, validate, explain cron expressions, and calculate deterministic next run occurrences.
5. **Developer Pack**:
   * `regex_tester`: Safely test, match, and extract capture groups with ReDoS protections.
   * `jwt_inspector`: In-memory JWT decoder for header, payload claims, and token expiration analysis (no signature verification).
   * `url_analyzer`: Offline WHATWG URL decomposition and query parameter analyzer (anti-SSRF, zero network).
   * `mime_analyzer`: Inspect extensions, declared MIME types, and binary magic bytes to detect true file types.

---

### 🔌 Model Context Protocol (MCP) Surface

* **MCP Streamable HTTP Transport**: Native Node.js HTTP implementation exposing `/mcp` with full SSE and session routing.
* **MCP Stdio Transport**: Standard I/O transport for seamless integration with Claude Desktop, MCP Inspector, and local AI IDEs.
* **15 MCP Tools**: Registered dynamically from canonical capability contracts with JSON Schema translation.
* **5 Static MCP Resources**:
  * `everything-free://capabilities` (Catalog of all capabilities)
  * `everything-free://capabilities/{name}` (Detailed per-capability documentation)
  * `everything-free://architecture` (System architecture specification)
  * `everything-free://security` (Security & threat model)
  * `everything-free://privacy` (Zero-retention privacy documentation)
* **7 Curated MCP Prompts**:
  * `analyze_json`
  * `analyze_csv`
  * `analyze_text`
  * `analyze_web_document`
  * `developer_debug`
  * `data_transform`
  * `schedule_analysis`

---

### 🌐 Platform Adapters & Compatibility

* **Model Context Protocol (MCP)**: Full end-to-end verification against official `@modelcontextprotocol/sdk` (v1.6.1) specification.
* **ChatGPT Developer Mode Compatibility**: Verified end-to-end Streamable HTTP support over HTTPS tunnels (Cloudflare / ngrok) with auth-less operation.
* **Claude Desktop Compatibility**: Verified end-to-end stdio execution via `everything-free stdio` or `npx everything.free-ai-plugins stdio`.
* **Google Gemini Adapter**: Adapter-level schema translation from canonical Zod contracts to Gemini `FunctionDeclaration` schema format, with isolated dispatch handler verified in automated unit test suite.

---

### 🚀 Packaging, CLI & Deployment

* **Unified CLI**: `everything-free` (and `everything-free-ai-plugins` / `everything.free-ai-plugins`) with `--help`, `--version`, `stdio`, `http`, `--port`, `--host`.
* **npm Distribution**: Zero dev dependencies in production bundle, strict whitelist distribution (`dist`, `README.md`, `LICENSE`, `CHANGELOG.md`).
* **Node.js LTS**: Fully optimized for Node.js 22 LTS (`>=22.0.0`).
* **Production Docker Container**:
  * Multi-stage build with minimal runtime image footprint.
  * Non-root execution under unprivileged `nodejs` user (UID 10001).
  * Built-in HTTP `/health` healthcheck probe.
* **Docker Compose**: Pre-configured `docker-compose.yml` for instant local or self-hosted deployment.
* **Reverse Proxy Documentation**: Production configurations for NGINX, Caddy, and Cloudflare Quick Tunnels.

---

### 🧪 Automated Testing & Verification

* **375 Passing Automated Tests**:
  * Unit tests for all 15 capabilities and utility modules.
  * Contract conformance and schema translation tests.
  * Integration tests for Streamable HTTP wire protocol and stdio lifecycle.
  * Security invariant tests (concurrency, payload size limits, timeouts).
  * Golden prompts benchmark validation.
  * CLI flag parsing and error handling tests.
* **Lint & Typecheck**: 100% strict TypeScript typing (`noEmit`), zero ESLint warnings.

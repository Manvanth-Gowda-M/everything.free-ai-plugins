# Everything.Free AI Plugins - Architecture Overview

## 1. System Vision & Purpose

**Everything.Free AI Plugins** is an open-source, capability-centric platform designed to bridge AI assistants to a rich ecosystem of 100% free, privacy-first, secure, and genuinely useful tools.

> **One Everything.Free connection → Many useful free capabilities.**

```
                                  ┌───────────────────────────┐
                                  │       AI Assistants       │
                                  │ (ChatGPT, Claude, Gemini) │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼ (MCP Streamable HTTP / stdio)
                                  ┌───────────────────────────┐
                                  │ Everything.Free AI Server │
                                  │ (Native Node.js / MCP SDK)│
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │     Capability Engine     │
                                  │  - Registry & Discovery   │
                                  │  - Zod Schema Validation  │
                                  │  - Local Sandboxed Exec   │
                                  │  - Platform-Independent   │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │      MVP Capability       │
                                  │ json_formatter_validator  │
                                  └───────────────────────────┘
```

---

## 2. Core Architecture Principles

1. **Hard 100% Free Constraint (₹0 / $0 Cost)**:
   - ₹0 development, ₹0 deployment, and ₹0 runtime operation.
   - Zero paid APIs, zero mandatory credit-card cloud services, zero paid SaaS.
   - Pure local deterministic compute and open-source packages.
2. **Platform Independence**:
   - The core Capability Engine is completely decoupled from HTTP, MCP, or any specific AI vendor protocol.
   - Adapters (ChatGPT/MCP, Claude, Gemini) only translate protocol schemas and serialize content blocks.
3. **Streamable HTTP & Stdio Only**:
   - **Streamable HTTP** (`/mcp`) is the official, primary, and production transport for ChatGPT and remote MCP clients.
   - **stdio** is provided for local CLI testing, automated testing, and MCP Inspector.
   - No legacy dual-endpoint SSE is implemented.
4. **Minimal & Dependency-Light**:
   - Uses the official `@modelcontextprotocol/sdk` on top of native Node.js HTTP (`node:http`).
   - No heavy web frameworks (no Express, no Hono), no databases, no telemetry, no UI.
5. **Zero-Trust Privacy & Local Sandboxing**:
   - Pure in-memory stateless processing. No disk logging of user payloads. Strict Zod schemas.

---

## 3. High-Level Component Layout

```
src/
├── core/                  # Platform-Independent Capability Engine
│   ├── capability.ts      # Capability interface & contract definition
│   ├── registry.ts        # In-memory Capability discovery & registry
│   ├── execution.ts       # Sandboxed execution runner with timeouts & safety
│   ├── errors.ts          # Standardized error definitions
│   └── types.ts           # Shared TypeScript types
├── capabilities/          # Modular capability implementations
│   ├── data/
│   │   └── json-formatter.ts  # MVP First Slice: json_formatter_validator
│   └── index.ts           # Capability registry exporter
├── adapters/              # AI Protocol Adapters
│   └── mcp/               # Model Context Protocol adapter
│       ├── server.ts      # MCP Server setup & capability mapping
│       ├── http.ts        # Native Node.js Streamable HTTP transport
│       └── stdio.ts       # Stdio transport runner
├── security/              # Security & safety enforcement
│   ├── validator.ts       # Input bounds & payload size validation
│   └── timeout.ts         # Hard execution timeout wrapper
├── server.ts              # Server launcher (Streamable HTTP & stdio modes)
└── index.ts               # Core library export
```

---

## 4. Multi-Phase Roadmap

- **Phase 1 (Current MVP)**:
  - Minimal production-ready MCP server using Streamable HTTP (`/mcp`) & Stdio.
  - Platform-independent Capability Engine with Zod contract validation.
  - MVP single vertical slice: `json_formatter_validator`.
  - Verified end-to-end flow: ChatGPT → MCP server → `tools/list` → `tools/call` → validated result → ChatGPT.
  - Automated testing, type checking, linting, CI, and ₹0 deployment documentation.
- **Phase 2 (Claude Adapter & Extended Local Utilities)**:
  - Stdio and remote connector compatibility for Claude Desktop/Web.
  - Additional local utilities (text diffing, hash/UUID generation, safe regex testing).
- **Phase 3 (Gemini Adapter & Community Extensions)**:
  - Gemini function calling adapter reusing the exact same Capability Engine.

# Multi-Platform Adapter Architecture

## 1. Overview

Everything.Free AI Plugins adopts a strict **Hub-and-Spoke Architecture** where the core computational engine is completely decoupled from AI client protocols.

```text
                    AI CLIENTS
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       ChatGPT        Claude        Gemini
   (Developer Mode) (Claude Desktop) (Function Call)
          │             │             │
          └─────────────┼─────────────┘
                        │
                  ADAPTER LAYER
         (MCP Server, Gemini Adapter)
                        │
                CORE CAPABILITY ENGINE
          (Registry, Contract v2, Runner)
                        │
             ┌──────────┴──────────┐
             │                     │
        15 CAPABILITIES       5 PACKS
```

---

## 2. Platform Adapter Contract

All platform adapters adhere to the common interface defined in `src/adapters/types.ts`:

```typescript
export interface PlatformAdapter<TDeclaration = unknown, TResponse = unknown> {
  readonly platformName: string;
  readonly registry: CapabilityRegistry;
  getToolDeclarations(): TDeclaration[];
  executeTool(toolName: string, rawArgs: unknown): Promise<TResponse>;
}
```

### Key Principles
1. **Single Source of Truth**: Exactly one implementation of each capability exists. Adapters NEVER duplicate processing logic.
2. **Schema Translation**: Parameter schemas are compiled directly from canonical Zod definitions into target platform formats (JSON Schema for MCP/ChatGPT, OpenAPI 3.0 for Gemini).
3. **Normalized Execution**: All executions route through `ExecutionRunner.run()`, ensuring uniform schema validation, execution timeouts (3000ms), and error normalization across all platforms.

---

## 3. Adapter Comparison Matrix

| Platform | Integration Channel | Protocol / Format | Adapter Component | External SDK Required |
| :--- | :--- | :--- | :--- | :--- |
| **ChatGPT** | Developer Mode | MCP Streamable HTTP (`/mcp`) | `McpServer` + `StreamableHTTPServerTransport` | None (`@modelcontextprotocol/sdk`) |
| **Claude** | Claude Desktop | MCP stdio IPC | `McpServer` + `StdioServerTransport` | None (`@modelcontextprotocol/sdk`) |
| **Gemini** | API / Function Calling | Gemini `FunctionDeclaration` & `functionCall` | `GeminiAdapter` (`src/adapters/gemini/`) | None (Zero extra dependencies) |

---

## 4. Result Normalization

Every execution produces an AI-friendly, deterministic response:

### Success Response
```json
{
  "ok": true,
  "data": { ... },
  "durationMs": 1.2
}
```

### Error Response
```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Field 'sql' is required",
    "details": { ... }
  },
  "durationMs": 0.4
}
```
Stack traces, environment variables, local filesystem paths, and internal implementation details are strictly excluded from output payloads.

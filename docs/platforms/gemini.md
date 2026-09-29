# Google Gemini Integration Guide

Everything.Free AI Plugins integrates with Google Gemini (Google AI Studio & Vertex AI) via the **Gemini Function Calling / Tool Declarations Adapter**.

**Status**: Verified / Adapter-Supported

---

## 1. Integration Architecture

```text
┌─────────────────────────┐                            ┌───────────────────────────┐
│ Google Gemini Client    │                            │  Everything.Free Engine   │
│ (AI Studio / Vertex AI) │                            │  (15 Capabilities Core)   │
└────────────┬────────────┘                            └─────────────┬─────────────┘
             │                                                       │
             │  1. getToolDeclarations() (FunctionDeclaration[])     │
             │ <──────────────────────────────────────────────────── │
             │                                                       │
             │  2. functionCall: { name, args }                      │
             │ ────────────────────────────────────────────────────> │
             │                                                       │
             │  3. functionResponse: { name, response: { ok, ... } } │
             │ <──────────────────────────────────────────────────── │
```

- **Adapter**: `GeminiAdapter` (`src/adapters/gemini/adapter.ts`).
- **Format**: Translates Zod schemas into OpenAPI 3.0 `OBJECT` schemas with uppercase types (`STRING`, `INTEGER`, `NUMBER`, `BOOLEAN`, `ARRAY`, `OBJECT`).
- **Zero External Dependencies**: Operates purely in-memory without requiring the `@google/genai` or `@google/generative-ai` SDKs.

---

## 2. Programmatic Usage Example

```typescript
import { createDefaultRegistry } from "everything.free-ai-plugins";
import { GeminiAdapter } from "everything.free-ai-plugins/adapters";

// 1. Initialize core registry and Gemini adapter
const registry = createDefaultRegistry();
const geminiAdapter = new GeminiAdapter(registry);

// 2. Extract official Gemini Tool Declarations
const tools = geminiAdapter.getToolDeclarations();
// Passed directly into Gemini API: { tools: tools }

// 3. When Gemini returns a functionCall in candidate parts:
const incomingPart = {
  functionCall: {
    name: "sql_processor",
    args: {
      sql: "SELECT id, name FROM users WHERE active = true;",
      operation: "format",
    },
  },
};

// 4. Handle execution and get standardized functionResponse part
const responsePart = await geminiAdapter.handleFunctionCall(incomingPart);
// Returns:
// {
//   functionResponse: {
//     name: "sql_processor",
//     response: {
//       ok: true,
//       result: { formatted: "...", stats: { ... } }
//     }
//   }
// }
```

---

## 3. Verified Functionality & Guarantees

| Feature                  | Status       | Details                                                                                   |
| :----------------------- | :----------- | :---------------------------------------------------------------------------------------- |
| **Tool Declarations**    | **Verified** | Automatically translates all 15 capabilities into Gemini `FunctionDeclaration` objects.   |
| **Execution Bridge**     | **Verified** | Direct invocation through `ExecutionRunner` with input validation and execution timeouts. |
| **Result Normalization** | **Verified** | Structured `{ ok: boolean, result?: ..., error?: { code, message } }` output.             |
| **Security & Privacy**   | **Verified** | 100% local in-memory execution, zero telemetry, no credential storage.                    |

---

## 4. Platform Requirements & Limitations

- External calls to the Gemini API itself require a Google AI Studio API key or Vertex AI credentials.
- The Everything.Free adapter and capability engine remain **₹0 / $0, local, and completely free** to run.

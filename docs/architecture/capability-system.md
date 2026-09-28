# Capability System Architecture

## 1. Design Overview

The **Capability System** is the standalone, platform-independent core of Everything.Free AI Plugins. It has zero coupling to HTTP frameworks, MCP SDK details, or AI vendor APIs.

Each **Capability** represents a discrete, self-contained, 100% free computational unit:
- **Identifier & Metadata**: Name, version, category, description, and zero-cost guarantee (`isFree: true`).
- **Input Schema**: Strongly-typed Zod schema providing validation, type-inference, and automatic JSON Schema conversion.
- **Execution Logic**: Deterministic, pure in-memory local logic.
- **Output Contract**: Structured result with error diagnostic payloads.

---

## 2. The Capability Contract (`CapabilityDefinition`)

```typescript
import { z } from "zod";

export interface CapabilityMetadata {
  name: string;
  version: string;
  category: "data" | "text" | "dev";
  displayName: string;
  description: string;
  isFree: true; // Hard architectural invariant
  requiresExternalNetwork: false; // MVP is 100% local
  timeoutMs?: number;
}

export interface CapabilityResult<TOutput = unknown> {
  success: boolean;
  data?: TOutput;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metrics?: {
    durationMs: number;
  };
}

export interface Capability<
  TInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny = z.ZodTypeAny
> {
  metadata: CapabilityMetadata;
  inputSchema: TInputSchema;
  outputSchema?: TOutputSchema;
  execute(
    input: z.infer<TInputSchema>
  ): Promise<CapabilityResult<z.infer<TOutputSchema>>>;
}
```

---

## 3. MVP First Vertical Slice: `json_formatter_validator`

For the initial MVP, exactly **one** capability is registered: `json_formatter_validator`.

### Contract:
* **Input**:
  - `jsonString` (string, max 1MB): The raw JSON text to process.
  - `action` (enum: `"format"` | `"minify"` | `"validate"` | `"inspect"`): Desired operation.
  - `indent` (number, 1-8, optional, default: 2): Indentation spacing for formatted output.
* **Output**:
  - `valid` (boolean): Whether input is valid JSON.
  - `formatted` (string, optional): Formatted / minified JSON output.
  - `stats` (object, optional): Key counts, byte size, nesting depth, top-level type.
  - `error` (object, optional): Line number, column number, and snippet pointing to syntax errors.

---

## 4. Capability Lifecycle & Platform Independence

```
   ┌────────────────────────────────────────────────┐
   │         Capability: json_formatter_validator   │
   │           (Pure logic + Zod schema)            │
   └───────────────────────┬────────────────────────┘
                           │
                           ▼
   ┌────────────────────────────────────────────────┐
   │         CapabilityRegistry (In-Memory)         │
   │  - register(capability)                        │
   │  - get(name) / list()                          │
   └───────┬────────────────────────────────┬───────┘
           │                                │
           ▼                                ▼
┌──────────────────────┐        ┌──────────────────────┐
│  MCP Adapter (Live)  │        │ Future Claude/Gemini │
│ - tools/list mapped  │        │ - Platform adapters  │
│ - tools/call routed  │        │   reusing same core  │
└──────────────────────┘        └──────────────────────┘
```

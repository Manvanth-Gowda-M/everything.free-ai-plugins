# Capability System Architecture

## 1. Design Overview

The **Capability System** is the standalone, platform-independent core of Everything.Free AI Plugins. It has zero coupling to HTTP frameworks, MCP SDK details, or AI vendor APIs.

Each **Capability** represents a discrete, self-contained, 100% free computational unit:
- **Identifier & Metadata**: Name, version, category, description, and zero-cost guarantee (`isFree: true`).
- **Input Schema**: Strongly-typed Zod schema providing validation, type-inference, and automatic JSON Schema conversion.
- **Execution Logic**: Deterministic, pure in-memory local logic.
- **Output Contract**: Structured result with error diagnostic payloads.

---

## 2. Standardized Category Vocabulary

The Capability Engine defines a compact set of standardized categories:

* **`data`**: Data formatting, validation, JSON, tabular transformations.
* **`text`**: Text diffing, text normalization, markdown utilities.
* **`encoding`**: Cryptographic hashing (SHA-256/512), encodings (Base64, Hex, URL), UUID generation.
* **`utility`**: Physical unit conversions (length, mass, volume, speed, temp) and date/timezone calculations.
* **`developer`**: Regex testing, code analysis, debugging utilities.

---

## 3. The Capability Contract (`CapabilityDefinition`)

```typescript
import { z } from "zod";

export interface CapabilityMetadata {
  name: string;
  version: string;
  category: "data" | "text" | "encoding" | "developer" | "utility";
  displayName: string;
  description: string;
  isFree: true; // Hard architectural invariant
  requiresExternalNetwork: false; // Always false for local capabilities
  privacy?: "local-only";
  externalDependencies?: string[];
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
  TOutput = unknown
> {
  readonly metadata: CapabilityMetadata;
  readonly inputSchema: TInputSchema;
  execute(input: z.infer<TInputSchema>): Promise<CapabilityResult<TOutput>>;
}
```

---

## 4. Current Built-in Capabilities Suite

1. **`json_formatter_validator`** (`data`): Format, minify, validate, and inspect JSON payloads with line/column syntax diagnostics.
2. **`text_diff_analyzer`** (`text`): Line and word diff analysis with LCS algorithms.
3. **`hash_and_encoding`** (`encoding`): Cryptographic hashing (SHA-256, SHA-512), Base64/Base64URL, Hex, URL encoding, and UUIDv4 generation.
4. **`unit_time_converter`** (`utility`): Physical unit conversion across 5 families and ISO date/Unix timestamp/timezone transformations.
5. **`regex_tester`** (`developer`): Regular expression matching, testing, and capture group extraction with ReDoS protection.

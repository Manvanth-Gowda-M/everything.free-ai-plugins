# Capability System Architecture & Capability Packs

## 1. Design Overview

The **Capability System** is the standalone, platform-independent core of Everything.Free AI Plugins. It has zero coupling to HTTP frameworks, MCP SDK details, or AI vendor APIs.

Each **Capability** represents a discrete, self-contained, 100% free computational unit:
- **Identifier & Metadata**: Name, version, category, pack, description, AI usage guidance, and zero-cost guarantee (`isFree: true`).
- **Input Schema**: Strongly-typed Zod schema providing validation, type-inference, and automatic JSON Schema conversion with property descriptions.
- **Execution Logic**: Deterministic, pure in-memory local logic.
- **Output Contract**: Structured result with actionable error diagnostic payloads.

---

## 2. Capability Packs Taxonomy

To maintain clean organization as the suite expands without fragmenting the single unified MCP connection, capabilities are categorized into **5 primary Capability Packs**:

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

### Pack Definitions

* **Data Pack (`data`)**: Structured data transformation, validation, CSV processing, JSON inspection, and tabular data conversion.
* **Text Pack (`text`)**: Text diffing, structural Markdown inspection, heading hierarchy, link extraction, and TOC generation.
* **Encoding Pack (`encoding`)**: Cryptographic hashing (SHA-256/512), encodings (Base64, Hex, URL), UUID generation.
* **Utility Pack (`utility`)**: Physical unit conversions (length, mass, volume, speed, temp), date/timezone calculations, CSS color space conversion (HEX, RGB, HSL, HSV, HWB, OKLCH), and contrast metrics.
* **Developer Pack (`developer`)**: Regex testing with ReDoS guards, in-memory JWT claim decoding, offline WHATWG URL decomposition.

---

## 3. The Capability Contract (`CapabilityDefinition`)

```typescript
import { z } from "zod";

export interface CapabilityMetadata {
  name: string;
  version: string;
  category: "data" | "text" | "encoding" | "developer" | "utility";
  pack?: "Data Pack" | "Text Pack" | "Encoding Pack" | "Utility Pack" | "Developer Pack";
  displayName: string;
  description: string;
  isFree: true; // Hard architectural invariant
  requiresExternalNetwork: false; // Always false for local capabilities
  privacy?: "local-only";
  externalDependencies?: string[];
  timeoutMs?: number;
  usageGuidance?: {
    useWhen: string[];
    doNotUseWhen: string[];
    exampleRequests: string[];
  };
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

## 4. Complete Built-in Capabilities Suite (10 Total)

1. **`json_formatter_validator`** (`Data Pack` / `data`): Format, minify, validate, and inspect JSON payloads with line/column syntax diagnostics.
2. **`csv_processor`** (`Data Pack` / `data`): RFC 4180 parsing, structural inspection, safe filtering, column sorting, and JSON conversion.
3. **`text_diff_analyzer`** (`Text Pack` / `text`): Line and word diff analysis with LCS algorithms and change summary metrics.
4. **`markdown_processor`** (`Text Pack` / `text`): Heading extraction, Table of Contents generation, link/image extraction, and code block inspection.
5. **`hash_and_encoding`** (`Encoding Pack` / `encoding`): Cryptographic hashing (SHA-256, SHA-512), Base64/Base64URL, Hex, URL encoding, and UUIDv4 generation.
6. **`unit_time_converter`** (`Utility Pack` / `utility`): Physical unit conversion across 5 families and ISO date/Unix timestamp/timezone transformations.
7. **`color_converter`** (`Utility Pack` / `utility`): CSS color spaces (HEX, RGB, HSL, HSV, HWB, OKLCH) and WCAG luminance calculation.
8. **`regex_tester`** (`Developer Pack` / `developer`): Regular expression matching, testing, and capture group extraction with ReDoS protection.
9. **`jwt_inspector`** (`Developer Pack` / `developer`): In-memory JWT decoder for header, payload claims, and token expiration analysis.
10. **`url_analyzer`** (`Developer Pack` / `developer`): Offline WHATWG URL decomposition and query parameter analyzer (zero-network, anti-SSRF).

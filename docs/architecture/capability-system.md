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

### Pack Definitions

* **Data Pack (`data`)**: Structured data transformation, validation, CSV processing, JSON inspection, SQL formatting/inspection, and XML to JSON conversion.
* **Text Pack (`text`)**: Text diffing, structural Markdown inspection, heading hierarchy, TOC generation, and offline HTML extraction/cleaning.
* **Encoding Pack (`encoding`)**: Cryptographic hashing (SHA-256/512), encodings (Base64, Hex, URL), UUID generation.
* **Utility Pack (`utility`)**: Physical unit conversions, date/timezone calculations, CSS color space conversion (HEX, RGB, HSL, HSV, HWB, OKLCH), and deterministic cron expression analysis.
* **Developer Pack (`developer`)**: Regex testing with ReDoS guards, in-memory JWT claim decoding, offline WHATWG URL decomposition, and binary MIME/magic-byte detection.

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
  operations?: CapabilityOperationInfo[];
  limits?: CapabilityLimits;
  security?: CapabilitySecurityInfo;
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

## 4. Complete Built-in Capabilities Suite (15 Total)

1. **`json_formatter_validator`** (`Data Pack` / `data`): Format, minify, validate, and inspect JSON payloads with line/column syntax diagnostics.
2. **`csv_processor`** (`Data Pack` / `data`): RFC 4180 parsing, structural inspection, safe filtering, column sorting, and JSON conversion.
3. **`sql_processor`** (`Data Pack` / `data`): Format, minify, inspect referenced tables/JOINs/parameters, and validate SQL syntax offline (no DB execution).
4. **`xml_processor`** (`Data Pack` / `data`): Safe in-memory parsing, structural inspection, formatting, minification, and JSON conversion with strict XXE protection.
5. **`text_diff_analyzer`** (`Text Pack` / `text`): Line and word diff analysis with LCS algorithms and change summary metrics.
6. **`markdown_processor`** (`Text Pack` / `text`): Heading extraction, Table of Contents generation, link/image extraction, and code block inspection.
7. **`html_processor`** (`Text Pack` / `text`): Inspect HTML structure, extract text/links/images/metadata, and sanitize unsafe tags offline without browser runtimes.
8. **`hash_and_encoding`** (`Encoding Pack` / `encoding`): Cryptographic hashing (SHA-256, SHA-512), Base64/Base64URL, Hex, URL encoding, and UUIDv4 generation.
9. **`unit_time_converter`** (`Utility Pack` / `utility`): Physical unit conversion across 5 families and ISO date/Unix timestamp/timezone transformations.
10. **`color_converter`** (`Utility Pack` / `utility`): CSS color spaces (HEX, RGB, HSL, HSV, HWB, OKLCH) and WCAG luminance calculation.
11. **`cron_analyzer`** (`Utility Pack` / `utility`): Parse, validate, explain cron expressions, and calculate deterministic future run occurrences without background timers.
12. **`regex_tester`** (`Developer Pack` / `developer`): Regular expression matching, testing, and capture group extraction with ReDoS protection.
13. **`jwt_inspector`** (`Developer Pack` / `developer`): In-memory JWT decoder for header, payload claims, and token expiration analysis.
14. **`url_analyzer`** (`Developer Pack` / `developer`): Offline WHATWG URL decomposition and query parameter analyzer (zero-network, anti-SSRF).
15. **`mime_analyzer`** (`Developer Pack` / `developer`): Inspect filename extensions, declared MIME types, and binary magic bytes to detect true file types and security mismatches offline.

---

## 5. Tools vs Resources vs Prompts

Everything.Free strictly partitions capabilities across three MCP primitives:

```text
       ┌─────────────────────────────────────────────────────────┐
       │              Everything.Free MCP Architecture           │
       └────────────────────────────┬────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
  │  MCP TOOLS   │           │MCP RESOURCES │           │ MCP PROMPTS  │
  ├──────────────┤           ├──────────────┤           ├──────────────┤
  │ Bounded      │           │ Read-Only    │           │ Reusable AI  │
  │ In-Memory    │           │ Knowledge &  │           │ Structured   │
  │ Computation  │           │ Documentation│           │ Workflows    │
  └──────────────┘           └──────────────┘           └──────────────┘
```

1. **MCP Tools (`tools/list`, `tools/call`)**:
   - Perform active, bounded computation on caller-provided data.
   - Strictly stateless, in-memory, zero-retention.
   - Never fetch from the network or access arbitrary filesystem paths.

2. **MCP Resources (`resources/list`, `resources/read`)**:
   - Expose read-only knowledge and machine-readable metadata.
   - Dynamic catalog (`everything-free://capabilities`) and per-capability documentation (`everything-free://capabilities/{id}`) generated directly from Capability Contract v2 metadata.
   - Architectural and security reference documents (`everything-free://architecture`, `everything-free://security`, `everything-free://privacy`).
   - Strictly deterministic, static, zero-filesystem traversal.

3. **MCP Prompts (`prompts/list`, `prompts/get`)**:
   - Provide structured interactive workflows guiding AI assistants on how to compose Everything.Free tools.
   - Accept typed Zod arguments (e.g. `json`, `csv`, `expression`).
   - Reinforce local-only offline processing guardrails and never instruct the server to fetch external credentials or network URLs.


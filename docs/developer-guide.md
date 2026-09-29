# Developer Guide: Adding New Capabilities

This guide explains how to build, test, and register a new capability in **Everything.Free AI Plugins**.

---

## 1. Capability Principles

Before creating a capability, ensure it meets the Everything.Free standards:
1. **100% Free**: Operates with ₹0/$0 cost.
2. **Deterministic & Local**: Pure in-memory computation whenever possible.
3. **Privacy-Safe**: Zero persistent logging or data harvesting.
4. **Strict Schema**: Strongly typed inputs parsed with Zod.
5. **Bounded Execution**: Protected by execution timeouts and error normalization.

---

## 2. Step-by-Step Implementation

### Step 1: Create the Capability File
Create a new file in `src/capabilities/<category>/<capability-name>.ts`.

```typescript
import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

// 1. Define input schema
export const ExampleInputSchema = z.object({
  text: z.string().min(1).max(50000).describe("Text to process"),
});

export type ExampleInput = z.infer<typeof ExampleInputSchema>;

export interface ExampleOutput {
  transformed: string;
}

// 2. Implement Capability interface
export class ExampleCapability
  implements Capability<typeof ExampleInputSchema, ExampleOutput>
{
  public readonly metadata: CapabilityMetadata = {
    name: "example_transformer",
    version: "1.0.0",
    category: "text",
    pack: "Text Pack",
    displayName: "Example Text Transformer",
    description: "Transforms text with zero cost and local privacy.",
    isFree: true,
    requiresExternalNetwork: false,
    timeoutMs: 3000,
    usageGuidance: {
      useWhen: ["User asks to transform text format"],
      doNotUseWhen: ["User asks to translate between languages"],
      exampleRequests: ["Transform this text to uppercase"],
    },
  };

  public readonly inputSchema = ExampleInputSchema;

  public async execute(
    input: ExampleInput
  ): Promise<CapabilityResult<ExampleOutput>> {
    return {
      success: true,
      data: {
        transformed: input.text.toUpperCase(),
      },
    };
  }
}
```

---

### Step 2: Register in `src/capabilities/index.ts`
Register the new capability in `createDefaultRegistry`:

```typescript
import { ExampleCapability } from "./text/example.js";

export function createDefaultRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  
  registry.register(new JsonFormatterValidatorCapability());
  registry.register(new ExampleCapability()); // Added here

  return registry;
}
```

---

### Step 3: Add Unit & Integration Tests
Create `tests/unit/example.test.ts` to test schema validation, edge cases, and execution:

```typescript
import { describe, it, expect } from "vitest";
import { ExampleCapability } from "../../src/capabilities/text/example.js";

describe("ExampleCapability", () => {
  const capability = new ExampleCapability();

  it("should process input successfully", async () => {
    const res = await capability.execute({ text: "hello" });
    expect(res.success).toBe(true);
    expect(res.data?.transformed).toBe("HELLO");
  });
});
```

---

### Step 4: Automatic MCP Resources & Tools Generation
When registered in `createDefaultRegistry()`, the new capability automatically:
- Exposes an MCP Tool (`tools/list` and `tools/call`).
- Registers a static documentation resource at `everything-free://capabilities/<name>`.
- Is indexed into the machine-readable capability catalog at `everything-free://capabilities`.
- Is benchmarkable via `npm run benchmark`.

---

### Step 5: Validate Suite & Run Benchmarks
Run the full verification and benchmark suites:
```bash
npm run typecheck
npm test
npm run lint
npm run benchmark
npm run build
```

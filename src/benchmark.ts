import { createDefaultRegistry } from "./capabilities/index.js";
import { ExecutionRunner } from "./core/execution.js";
import { Capability } from "./core/types.js";
import { performance } from "node:perf_hooks";

export interface BenchmarkCase {
  capabilityName: string;
  operationDescription: string;
  input: Record<string, unknown>;
  iterations?: number;
}

export interface BenchmarkResult {
  capability: string;
  pack: string;
  operation: string;
  iterations: number;
  inputSizeBytes: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  opsPerSec: number;
}

export const BENCHMARK_CASES: BenchmarkCase[] = [
  // 1. JSON Formatter & Validator
  {
    capabilityName: "json_formatter_validator",
    operationDescription: "Validate & Pretty-Print 5KB JSON",
    input: {
      jsonString: JSON.stringify({
        project: "Everything.Free",
        version: "0.1.0",
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          name: `item_${i}`,
          active: i % 2 === 0,
        })),
      }),
      action: "format",
    },
    iterations: 100,
  },
  // 2. CSV Processor
  {
    capabilityName: "csv_processor",
    operationDescription: "Parse, Filter & JSON Convert 500-row CSV",
    input: {
      csvText:
        "id,name,age,role\n" +
        Array.from(
          { length: 500 },
          (_, i) => `${i},User_${i},${20 + (i % 40)},${i % 5 === 0 ? "admin" : "member"}`
        ).join("\n"),
      operation: "filter",
      filterColumn: "age",
      filterOperator: "greater_than",
      filterValue: "30",
    },
    iterations: 50,
  },
  // 3. SQL Processor
  {
    capabilityName: "sql_processor",
    operationDescription: "Inspect & Format Complex Multi-JOIN SQL",
    input: {
      sql: "SELECT u.id, u.name, count(o.id) as total_orders, sum(p.amount) as total_spent FROM users u INNER JOIN orders o ON u.id = o.user_id LEFT JOIN payments p ON o.id = p.order_id WHERE u.status = 'active' AND u.created_at >= '2024-01-01' GROUP BY u.id, u.name HAVING count(o.id) > 5 ORDER BY total_spent DESC LIMIT 50;",
      operation: "format",
    },
    iterations: 100,
  },
  // 4. XML Processor
  {
    capabilityName: "xml_processor",
    operationDescription: "Parse, Inspect & Convert Nested XML to JSON",
    input: {
      xmlString: `<catalog id="cat_1"><books>${Array.from({ length: 50 }, (_, i) => `<book id="b_${i}"><title>Book Title ${i}</title><price currency="USD">${10 + i}</price><author>Author ${i}</author></book>`).join("")}</books></catalog>`,
      operation: "to_json",
    },
    iterations: 50,
  },
  // 5. Text Diff Analyzer
  {
    capabilityName: "text_diff_analyzer",
    operationDescription: "Line Diff 100-line Configuration Files",
    input: {
      original: Array.from({ length: 100 }, (_, i) => `CONFIG_KEY_${i}=value_${i}`).join("\n"),
      modified: Array.from(
        { length: 100 },
        (_, i) => `CONFIG_KEY_${i}=value_${i % 3 === 0 ? "MODIFIED" : i}`
      ).join("\n"),
      mode: "line",
    },
    iterations: 50,
  },
  // 6. Markdown Processor
  {
    capabilityName: "markdown_processor",
    operationDescription: "Extract Outline & TOC from 200-line Markdown",
    input: {
      markdownText: Array.from(
        { length: 20 },
        (_, i) =>
          `# Section ${i}\n\nContent paragraph for section ${i}.\n\n## Subsection ${i}.1\nDetails\n\n\`\`\`ts\nconst x = ${i};\n\`\`\``
      ).join("\n\n"),
      operation: "toc",
    },
    iterations: 100,
  },
  // 7. HTML Processor
  {
    capabilityName: "html_processor",
    operationDescription: "Sanitize & Extract Links/Headings from HTML",
    input: {
      htmlText: `<!DOCTYPE html><html><head><title>Benchmark Document</title></head><body>${Array.from({ length: 40 }, (_, i) => `<div><h2>Heading ${i}</h2><p>Paragraph with <a href="https://example.com/page/${i}">Link ${i}</a></p><img src="https://img.example.com/${i}.png" alt="Img ${i}" /><script>evil()</script></div>`).join("")}</body></html>`,
      operation: "extract",
    },
    iterations: 50,
  },
  // 8. Hash & Encoding
  {
    capabilityName: "hash_and_encoding",
    operationDescription: "Compute SHA-256 Checksum on 64KB Payload",
    input: {
      operation: "sha256",
      input: "A".repeat(65536),
    },
    iterations: 100,
  },
  // 9. Unit & Time Converter
  {
    capabilityName: "unit_time_converter",
    operationDescription: "Unit & Timezone Timestamp Transformations",
    input: {
      mode: "unit",
      value: 12345.67,
      fromUnit: "mi",
      toUnit: "km",
    },
    iterations: 200,
  },
  // 10. Color Converter
  {
    capabilityName: "color_converter",
    operationDescription: "Color Space Conversion & WCAG Luminance",
    input: {
      color: "#2E8B57",
    },
    iterations: 200,
  },
  // 11. Cron Analyzer
  {
    capabilityName: "cron_analyzer",
    operationDescription: "Explain & Calculate Next 20 Occurrences",
    input: {
      expression: "0 9 * * 1-5",
      operation: "next_matches",
      baseTime: "2025-01-01T00:00:00.000Z",
      count: 20,
    },
    iterations: 100,
  },
  // 12. Regex Tester
  {
    capabilityName: "regex_tester",
    operationDescription: "ReDoS-Guarded Regex Capture Group Extraction",
    input: {
      pattern: "([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,})",
      text: "Contact support at help@everything.free or billing@quilonix.dev or admin@sample.org",
      operation: "match",
    },
    iterations: 100,
  },
  // 13. JWT Inspector
  {
    capabilityName: "jwt_inspector",
    operationDescription: "Decode & Inspect Header/Claims of Signed JWT",
    input: {
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    },
    iterations: 200,
  },
  // 14. URL Analyzer
  {
    capabilityName: "url_analyzer",
    operationDescription: "Decompose WHATWG Complex URL with Query Params",
    input: {
      url: "https://api.quilonix.dev:8443/v1/search?query=mcp&filter=free&sort=asc#results",
    },
    iterations: 200,
  },
  // 15. MIME Analyzer
  {
    capabilityName: "mime_analyzer",
    operationDescription: "Binary Magic Header Detection & Mismatch Check",
    input: {
      filename: "sample_image.png",
      byteSample: "89504E470D0A1A0A0000000D49484452000001000000010008060000005C72A866",
      declaredMimeType: "image/png",
    },
    iterations: 200,
  },
];

/**
 * Runs performance benchmark for a single capability.
 */
export async function runSingleBenchmark(
  capability: Capability,
  testCase: BenchmarkCase
): Promise<BenchmarkResult> {
  const iterations = testCase.iterations || 100;
  const inputSizeBytes = Buffer.byteLength(JSON.stringify(testCase.input), "utf8");

  // Warm-up run
  await ExecutionRunner.run(capability, testCase.input);

  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await ExecutionRunner.run(capability, testCase.input);
    const end = performance.now();
    durations.push(end - start);
  }

  const totalDuration = durations.reduce((a, b) => a + b, 0);
  const avgDurationMs = totalDuration / iterations;
  const minDurationMs = Math.min(...durations);
  const maxDurationMs = Math.max(...durations);
  const opsPerSec = avgDurationMs > 0 ? 1000 / avgDurationMs : Infinity;

  return {
    capability: testCase.capabilityName,
    pack: capability.metadata.pack,
    operation: testCase.operationDescription,
    iterations,
    inputSizeBytes,
    avgDurationMs,
    minDurationMs,
    maxDurationMs,
    opsPerSec,
  };
}

/**
 * Runs the complete benchmark suite across all 15 capabilities.
 */
export async function runAllBenchmarks(): Promise<BenchmarkResult[]> {
  const registry = createDefaultRegistry();
  const results: BenchmarkResult[] = [];

  for (const testCase of BENCHMARK_CASES) {
    const capability = registry.get(testCase.capabilityName);
    if (!capability) {
      throw new Error(`Capability '${testCase.capabilityName}' not found in registry`);
    }

    const result = await runSingleBenchmark(capability, testCase);
    results.push(result);
  }

  return results;
}

/**
 * Prints formatted benchmark results table.
 */
export function printBenchmarkReport(results: BenchmarkResult[]): void {
  process.stdout.write(
    "\n========================================================================================================\n"
  );
  process.stdout.write(
    "             EVERYTHING.FREE AI PLUGINS — LOCAL CAPABILITY BENCHMARK REPORT\n"
  );
  process.stdout.write(
    "========================================================================================================\n"
  );
  process.stdout.write(
    `| ${"Capability".padEnd(26)} | ${"Pack".padEnd(16)} | ${"Input".padStart(7)} | ${"Avg (ms)".padStart(8)} | ${"Min (ms)".padStart(8)} | ${"Max (ms)".padStart(8)} | ${"Ops/sec".padStart(10)} |\n`
  );
  process.stdout.write(
    "--------------------------------------------------------------------------------------------------------\n"
  );

  for (const r of results) {
    const cap = r.capability.padEnd(26);
    const pack = r.pack.padEnd(16);
    const inputSize = `${r.inputSizeBytes}B`.padStart(7);
    const avg = r.avgDurationMs.toFixed(3).padStart(8);
    const min = r.minDurationMs.toFixed(3).padStart(8);
    const max = r.maxDurationMs.toFixed(3).padStart(8);
    const ops = Math.round(r.opsPerSec).toLocaleString().padStart(10);

    process.stdout.write(
      `| ${cap} | ${pack} | ${inputSize} | ${avg} | ${min} | ${max} | ${ops} |\n`
    );
  }
  process.stdout.write(
    "========================================================================================================\n\n"
  );
}

// Direct execution runner
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") || "")) {
  runAllBenchmarks()
    .then((results) => {
      printBenchmarkReport(results);
    })
    .catch((err) => {
      process.stderr.write(`Benchmark error: ${err}\n`);
      process.exit(1);
    });
}

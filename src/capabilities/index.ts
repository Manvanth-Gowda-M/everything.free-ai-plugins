import { CapabilityRegistry } from "../core/registry.js";
import { CapabilityPackInfo } from "../core/types.js";

// Data Pack
import { JsonFormatterValidatorCapability } from "./data/json-formatter.js";
import { CsvProcessorCapability } from "./data/csv-processor.js";
import { SqlProcessorCapability } from "./data/sql-processor.js";
import { XmlProcessorCapability } from "./data/xml-processor.js";

// Text Pack
import { TextDiffAnalyzerCapability } from "./text/text-diff.js";
import { MarkdownProcessorCapability } from "./text/markdown-processor.js";
import { HtmlProcessorCapability } from "./text/html-processor.js";

// Encoding Pack
import { HashAndEncodingCapability } from "./encoding/hash-encoding.js";

// Utility Pack
import { UnitTimeConverterCapability } from "./utility/unit-time-converter.js";
import { ColorConverterCapability } from "./utility/color-converter.js";
import { CronAnalyzerCapability } from "./utility/cron-analyzer.js";

// Developer Pack
import { RegexTesterCapability } from "./developer/regex-tester.js";
import { JwtInspectorCapability } from "./developer/jwt-inspector.js";
import { UrlAnalyzerCapability } from "./developer/url-analyzer.js";
import { MimeAnalyzerCapability } from "./developer/mime-analyzer.js";

/**
 * Standard Capability Pack definitions.
 */
export const CAPABILITY_PACKS: CapabilityPackInfo[] = [
  {
    id: "data",
    name: "Data Pack",
    description:
      "High-performance local tools for inspecting, formatting, and transforming structured data (JSON, CSV, SQL, XML).",
  },
  {
    id: "text",
    name: "Text Pack",
    description:
      "Tools for text diffing, structural document analysis, markdown processing, and HTML extraction/cleaning.",
  },
  {
    id: "encoding",
    name: "Encoding Pack",
    description:
      "Cryptographic hashing (SHA-256, SHA-512), standard encodings (Base64, Hex, URL), and UUID generation.",
  },
  {
    id: "utility",
    name: "Utility Pack",
    description:
      "Physical unit conversions, timezone/date parsing, color space transformations, and cron expression analysis.",
  },
  {
    id: "developer",
    name: "Developer Pack",
    description:
      "Essential developer utilities for regular expressions, JWT inspection, URL analysis, and MIME / magic-byte detection.",
  },
];

/**
 * Creates and initializes a CapabilityRegistry populated with all 15 active capabilities across 5 packs.
 */
export function createDefaultRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();

  // Data Pack (4 capabilities)
  registry.register(new JsonFormatterValidatorCapability());
  registry.register(new CsvProcessorCapability());
  registry.register(new SqlProcessorCapability());
  registry.register(new XmlProcessorCapability());

  // Text Pack (3 capabilities)
  registry.register(new TextDiffAnalyzerCapability());
  registry.register(new MarkdownProcessorCapability());
  registry.register(new HtmlProcessorCapability());

  // Encoding Pack (1 capability)
  registry.register(new HashAndEncodingCapability());

  // Utility Pack (3 capabilities)
  registry.register(new UnitTimeConverterCapability());
  registry.register(new ColorConverterCapability());
  registry.register(new CronAnalyzerCapability());

  // Developer Pack (4 capabilities)
  registry.register(new RegexTesterCapability());
  registry.register(new JwtInspectorCapability());
  registry.register(new UrlAnalyzerCapability());
  registry.register(new MimeAnalyzerCapability());

  return registry;
}

// Export all capability modules
export * from "./data/json-formatter.js";
export * from "./data/csv-processor.js";
export * from "./data/sql-processor.js";
export * from "./data/xml-processor.js";
export * from "./text/text-diff.js";
export * from "./text/markdown-processor.js";
export * from "./text/html-processor.js";
export * from "./encoding/hash-encoding.js";
export * from "./utility/unit-time-converter.js";
export * from "./utility/color-converter.js";
export * from "./utility/cron-analyzer.js";
export * from "./developer/regex-tester.js";
export * from "./developer/jwt-inspector.js";
export * from "./developer/url-analyzer.js";
export * from "./developer/mime-analyzer.js";

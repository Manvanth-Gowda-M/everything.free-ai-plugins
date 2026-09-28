import { CapabilityRegistry } from "../core/registry.js";
import { CapabilityPackInfo } from "../core/types.js";

// Data Pack
import { JsonFormatterValidatorCapability } from "./data/json-formatter.js";
import { CsvProcessorCapability } from "./data/csv-processor.js";

// Text Pack
import { TextDiffAnalyzerCapability } from "./text/text-diff.js";
import { MarkdownProcessorCapability } from "./text/markdown-processor.js";

// Encoding Pack
import { HashAndEncodingCapability } from "./encoding/hash-encoding.js";

// Utility Pack
import { UnitTimeConverterCapability } from "./utility/unit-time-converter.js";
import { ColorConverterCapability } from "./utility/color-converter.js";

// Developer Pack
import { RegexTesterCapability } from "./developer/regex-tester.js";
import { JwtInspectorCapability } from "./developer/jwt-inspector.js";
import { UrlAnalyzerCapability } from "./developer/url-analyzer.js";

/**
 * Standard Capability Pack definitions.
 */
export const CAPABILITY_PACKS: CapabilityPackInfo[] = [
  {
    id: "data",
    name: "Data Pack",
    description: "High-performance local tools for inspecting, formatting, and transforming structured data (JSON, CSV).",
  },
  {
    id: "text",
    name: "Text Pack",
    description: "Tools for text diffing, structural document analysis, and markdown processing.",
  },
  {
    id: "encoding",
    name: "Encoding Pack",
    description: "Cryptographic hashing (SHA-256, SHA-512), standard encodings (Base64, Hex, URL), and UUID generation.",
  },
  {
    id: "utility",
    name: "Utility Pack",
    description: "Physical unit conversions, timezone/date parsing, and color space transformations.",
  },
  {
    id: "developer",
    name: "Developer Pack",
    description: "Essential developer utilities for regular expressions, JWT inspection, and URL analysis.",
  },
];

/**
 * Creates and initializes a CapabilityRegistry populated with all 10 active capabilities across 5 packs.
 */
export function createDefaultRegistry(): CapabilityRegistry {
  const registry = new CapabilityRegistry();

  // Data Pack
  registry.register(new JsonFormatterValidatorCapability());
  registry.register(new CsvProcessorCapability());

  // Text Pack
  registry.register(new TextDiffAnalyzerCapability());
  registry.register(new MarkdownProcessorCapability());

  // Encoding Pack
  registry.register(new HashAndEncodingCapability());

  // Utility Pack
  registry.register(new UnitTimeConverterCapability());
  registry.register(new ColorConverterCapability());

  // Developer Pack
  registry.register(new RegexTesterCapability());
  registry.register(new JwtInspectorCapability());
  registry.register(new UrlAnalyzerCapability());

  return registry;
}

// Export all capability modules
export * from "./data/json-formatter.js";
export * from "./data/csv-processor.js";
export * from "./text/text-diff.js";
export * from "./text/markdown-processor.js";
export * from "./encoding/hash-encoding.js";
export * from "./utility/unit-time-converter.js";
export * from "./utility/color-converter.js";
export * from "./developer/regex-tester.js";
export * from "./developer/jwt-inspector.js";
export * from "./developer/url-analyzer.js";

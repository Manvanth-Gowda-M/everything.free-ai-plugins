import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const RegexTesterInputSchema = z.object({
  pattern: z
    .string()
    .min(1, "Regex pattern cannot be empty")
    .max(500, "Regex pattern exceeds maximum length of 500 characters")
    .describe("The regular expression pattern (without surrounding slashes)"),
  text: z
    .string()
    .max(50_000, "Input text exceeds maximum size limit of 50KB")
    .describe("The target text string to test against"),
  flags: z
    .string()
    .max(10)
    .optional()
    .default("g")
    .describe("RegExp flags (e.g., 'g', 'i', 'm', 's', 'u')"),
  operation: z
    .enum(["test", "match", "extract"])
    .default("test")
    .describe("Operation: 'test' (boolean check), 'match' (all matches), or 'extract' (capture groups)"),
});

export type RegexTesterInput = z.infer<typeof RegexTesterInputSchema>;

export interface RegexMatchDetail {
  index: number;
  match: string;
  groups?: Record<string, string> | string[];
}

export interface RegexTesterOutput {
  operation: "test" | "match" | "extract";
  pattern: string;
  flags: string;
  matched: boolean;
  matchCount: number;
  matches?: string[];
  details?: RegexMatchDetail[];
}

export class RegexTesterCapability
  implements Capability<typeof RegexTesterInputSchema, RegexTesterOutput>
{
  public readonly metadata: CapabilityMetadata = {
    name: "regex_tester",
    version: "1.0.0",
    category: "developer",
    displayName: "Regular Expression Tester & Extractor",
    description:
      "Safely tests, matches, and extracts capture groups from text using regular expressions with ReDoS and input bounds protection. 100% local, free, and privacy-safe.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 2000,
  };

  public readonly inputSchema = RegexTesterInputSchema;

  public async execute(input: RegexTesterInput): Promise<CapabilityResult<RegexTesterOutput>> {
    const { pattern, text, flags = "g", operation = "test" } = input;

    // Sanitize and validate flags
    const sanitizedFlags = Array.from(new Set(flags.split(""))).join("");
    if (!/^[dgimsuvy]*$/.test(sanitizedFlags)) {
      return {
        success: false,
        error: {
          code: "INVALID_REGEX_FLAGS",
          message: `Invalid regex flag(s) provided: '${flags}'. Allowed flags are d, g, i, m, s, u, v, y.`,
        },
      };
    }

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, sanitizedFlags);
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: "INVALID_REGEX_PATTERN",
          message: err instanceof Error ? err.message : `Invalid regular expression: ${pattern}`,
        },
      };
    }

    // 1. Operation: test
    if (operation === "test") {
      const isMatch = regex.test(text);
      return {
        success: true,
        data: {
          operation: "test",
          pattern,
          flags: sanitizedFlags,
          matched: isMatch,
          matchCount: isMatch ? 1 : 0,
        },
      };
    }

    // 2. Operation: match
    if (operation === "match") {
      // Ensure 'g' flag is present for full matching
      const matchFlags = sanitizedFlags.includes("g") ? sanitizedFlags : `${sanitizedFlags}g`;
      const matchRegex = new RegExp(pattern, matchFlags);

      const matches: string[] = [];
      let m: RegExpExecArray | null;
      let iterations = 0;
      const MAX_MATCHES = 500;

      while ((m = matchRegex.exec(text)) !== null) {
        matches.push(m[0]);
        iterations++;

        // Prevent infinite loops on zero-length matches
        if (m.index === matchRegex.lastIndex) {
          matchRegex.lastIndex++;
        }

        if (iterations >= MAX_MATCHES) break;
      }

      return {
        success: true,
        data: {
          operation: "match",
          pattern,
          flags: matchFlags,
          matched: matches.length > 0,
          matchCount: matches.length,
          matches,
        },
      };
    }

    // 3. Operation: extract
    const extractFlags = sanitizedFlags.includes("g") ? sanitizedFlags : `${sanitizedFlags}g`;
    const extractRegex = new RegExp(pattern, extractFlags);

    const details: RegexMatchDetail[] = [];
    let matchObj: RegExpExecArray | null;
    let iterations = 0;
    const MAX_EXTRACTS = 500;

    while ((matchObj = extractRegex.exec(text)) !== null) {
      const detail: RegexMatchDetail = {
        index: matchObj.index,
        match: matchObj[0],
      };

      if (matchObj.groups) {
        detail.groups = { ...matchObj.groups };
      } else if (matchObj.length > 1) {
        detail.groups = matchObj.slice(1);
      }

      details.push(detail);
      iterations++;

      if (matchObj.index === extractRegex.lastIndex) {
        extractRegex.lastIndex++;
      }

      if (iterations >= MAX_EXTRACTS) break;
    }

    return {
      success: true,
      data: {
        operation: "extract",
        pattern,
        flags: extractFlags,
        matched: details.length > 0,
        matchCount: details.length,
        details,
      },
    };
  }
}

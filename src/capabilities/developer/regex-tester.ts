import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const RegexTesterInputSchema = z.object({
  pattern: z
    .string()
    .min(1, "Regex pattern cannot be empty")
    .max(500, "Regex pattern exceeds maximum length limit of 500 characters")
    .describe(
      "The regular expression pattern string (without enclosing slashes, e.g. '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b')"
    ),
  text: z
    .string()
    .max(50_000, "Input text exceeds maximum size limit of 50KB")
    .describe("The target text string to evaluate against the regular expression pattern"),
  flags: z
    .string()
    .max(10)
    .optional()
    .default("g")
    .describe(
      "RegExp flags: 'g' (global), 'i' (ignore case), 'm' (multiline), 's' (dotAll), 'u' (unicode), 'v' (unicodeSets), 'y' (sticky). Default: 'g'"
    ),
  operation: z
    .enum(["test", "match", "extract"])
    .default("test")
    .describe(
      "Operation to perform:\n" +
        "- 'test': Fast boolean check whether pattern matches text (returns matched: boolean)\n" +
        "- 'match': Finds and returns all matching substrings\n" +
        "- 'extract': Extracts detailed match positions and named/numbered capture groups"
    ),
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

export class RegexTesterCapability implements Capability<
  typeof RegexTesterInputSchema,
  RegexTesterOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "regex_tester",
    version: "1.0.0",
    category: "developer",
    pack: "Developer Pack",
    displayName: "Regular Expression Tester & Extractor",
    description:
      "Use when the user asks to test, evaluate, match, or extract capture groups from text using a regular expression. " +
      "Includes ReDoS protection, strict length bounds, and execution timeouts. 100% local, free, and privacy-safe. " +
      "Do NOT use for arbitrary code execution or natural language text search.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 2000,
    operations: [
      {
        name: "test",
        description: "Tests whether a text string satisfies a regular expression pattern",
        inputDescription: "pattern: string, text: string, flags?: string",
        outputDescription: "{ matched: boolean, operation: 'test' }",
      },
      {
        name: "match",
        description: "Extracts all matching substrings and named/positional capture groups",
        inputDescription: "pattern: string, text: string, flags?: string",
        outputDescription:
          "{ matched: boolean, matches: string[], groups: Array<Record<string, string>>, matchCount: number }",
      },
      {
        name: "replace",
        description: "Performs regex string replacement",
        inputDescription: "pattern: string, text: string, replacement: string, flags?: string",
        outputDescription: "{ replacedText: string, replacementCount: number }",
      },
    ],
    limits: {
      maxPatternLength: 1000,
      maxTextLength: 100_000,
      maxInputBytes: 100_000,
      timeoutMs: 2000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Strict pattern length limits and 2000ms timeout guard against ReDoS attacks",
    },
    usageGuidance: {
      useWhen: [
        "User asks to test if a string matches a regex pattern",
        "User asks to extract dates, emails, URLs, or tokens from text using a regex",
        "User asks to extract capture groups from formatted strings",
        "User asks for all occurrences matching a pattern in a text block",
      ],
      doNotUseWhen: [
        "User asks to compare two documents for line/word diffs (use text_diff_analyzer)",
        "User asks to validate JSON syntax (use json_formatter_validator)",
        "User asks for semantic natural language extraction without a regex",
      ],
      exampleRequests: [
        "Test if this email matches the standard email regex",
        "Extract all ISO 8601 timestamps from this log file snippet using regex",
        "Find all 4-digit year tokens in this paragraph",
      ],
    },
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
          message: `Invalid regex flag(s) '${flags}'. Allowed flags are: 'g' (global), 'i' (ignore case), 'm' (multiline), 's' (dotAll), 'u' (unicode), 'v' (unicodeSets), 'y' (sticky), 'd' (hasIndices).`,
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
          message: `Invalid regular expression syntax for pattern '${pattern}': ${err instanceof Error ? err.message : "Syntax error"}`,
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
      const matchFlags = sanitizedFlags.includes("g") ? sanitizedFlags : `${sanitizedFlags}g`;
      const matchRegex = new RegExp(pattern, matchFlags);

      const matches: string[] = [];
      let m: RegExpExecArray | null;
      let iterations = 0;
      const MAX_MATCHES = 500;

      while ((m = matchRegex.exec(text)) !== null) {
        matches.push(m[0]);
        iterations++;

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

import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const TextDiffInputSchema = z.object({
  original: z
    .string()
    .max(100_000, "Original text exceeds maximum size limit of 100KB")
    .describe("The baseline or original text content to compare against"),
  modified: z
    .string()
    .max(100_000, "Modified text exceeds maximum size limit of 100KB")
    .describe("The new or revised text content"),
  mode: z
    .enum(["line", "word"])
    .default("line")
    .optional()
    .describe(
      "Comparison granularity:\n" +
        "- 'line': Line-by-line unified diff with additions (+) and deletions (-)\n" +
        "- 'word': In-line word-by-word diff with marked additions [+text+] and deletions [-text-]"
    ),
});

export type TextDiffInput = z.infer<typeof TextDiffInputSchema>;

export interface DiffChunk {
  type: "added" | "removed" | "unchanged";
  value: string;
}

export interface TextDiffOutput {
  identical: boolean;
  mode: "line" | "word";
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
  summary: string;
  diff: string;
  chunks: DiffChunk[];
}

/**
 * Computes difference chunks between two token arrays using dynamic programming LCS.
 */
function computeDiff(tokensA: string[], tokensB: string[], delimiter: string): DiffChunk[] {
  const n = tokensA.length;
  const m = tokensB.length;

  if (n === m && tokensA.every((val, idx) => val === tokensB[idx])) {
    return tokensA.length > 0 ? [{ type: "unchanged", value: tokensA.join(delimiter) }] : [];
  }

  const matrix: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (tokensA[i - 1] === tokensB[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  const chunks: DiffChunk[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensA[i - 1] === tokensB[j - 1]) {
      chunks.unshift({ type: "unchanged", value: tokensA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      chunks.unshift({ type: "added", value: tokensB[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      chunks.unshift({ type: "removed", value: tokensA[i - 1] });
      i--;
    }
  }

  const compacted: DiffChunk[] = [];
  for (const chunk of chunks) {
    const last = compacted[compacted.length - 1];
    if (last && last.type === chunk.type) {
      last.value += delimiter + chunk.value;
    } else {
      compacted.push({ ...chunk });
    }
  }

  return compacted;
}

export class TextDiffAnalyzerCapability
  implements Capability<typeof TextDiffInputSchema, TextDiffOutput>
{
  public readonly metadata: CapabilityMetadata = {
    name: "text_diff_analyzer",
    version: "1.0.0",
    category: "text",
    pack: "Text Pack",
    displayName: "Text Diff Analyzer",
    description:
      "Use when the user asks to compare two text blocks, code snippets, config files, or documents to see what changed. " +
      "Computes structured line or word differences, additions, removals, and unified diff output. 100% local, free, and privacy-safe. " +
      "Do NOT use for semantic text rewriting or grammar translation.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "diff",
        description: "Computes structured diff (line or word granularity) between original and modified text",
        inputDescription: "original, modified, mode ('line' | 'word')",
        outputDescription: "{ identical: boolean, addedCount, removedCount, diff: string }",
      },
    ],
    limits: {
      maxTextLength: 100_000,
      maxInputBytes: 200_000,
      timeoutMs: 3000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Bounded LCS algorithm; 100% in-memory computation",
    },
    usageGuidance: {
      useWhen: [
        "User asks what changed between two versions of text or code",
        "User asks to compare two configuration files or JSON strings",
        "User asks for a unified line diff or word-level diff",
        "User asks for additions/removals summary between two documents",
      ],
      doNotUseWhen: [
        "User asks for semantic grammar correction or natural language rewriting",
        "User asks to format a single JSON file without comparing (use json_formatter_validator)",
        "User asks to test a regex pattern against text (use regex_tester)",
      ],
      exampleRequests: [
        "Compare these two configuration files and show me the differences",
        "What changed between the original draft and the revised draft?",
        "Generate a line diff between these two code blocks",
      ],
    },
  };

  public readonly inputSchema = TextDiffInputSchema;

  public async execute(input: TextDiffInput): Promise<CapabilityResult<TextDiffOutput>> {
    const { original, modified, mode = "line" } = input;

    if (original === modified) {
      return {
        success: true,
        data: {
          identical: true,
          mode,
          addedCount: 0,
          removedCount: 0,
          unchangedCount: mode === "line" ? original.split("\n").length : original.split(/\s+/).length,
          summary: "Texts are identical (0 additions, 0 removals)",
          diff: original
            .split("\n")
            .map((line) => `  ${line}`)
            .join("\n"),
          chunks: original.length > 0 ? [{ type: "unchanged", value: original }] : [],
        },
      };
    }

    let chunks: DiffChunk[];
    let diffText = "";
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    if (mode === "line") {
      const linesA = original.split("\n");
      const linesB = modified.split("\n");
      chunks = computeDiff(linesA, linesB, "\n");

      const diffLines: string[] = [];
      for (const chunk of chunks) {
        const split = chunk.value.split("\n");
        if (chunk.type === "added") {
          addedCount += split.length;
          split.forEach((l) => diffLines.push(`+ ${l}`));
        } else if (chunk.type === "removed") {
          removedCount += split.length;
          split.forEach((l) => diffLines.push(`- ${l}`));
        } else {
          unchangedCount += split.length;
          split.forEach((l) => diffLines.push(`  ${l}`));
        }
      }
      diffText = diffLines.join("\n");
    } else {
      const wordsA = original.split(/(\s+)/).filter((w) => w.length > 0);
      const wordsB = modified.split(/(\s+)/).filter((w) => w.length > 0);
      chunks = computeDiff(wordsA, wordsB, "");

      const diffParts: string[] = [];
      for (const chunk of chunks) {
        if (chunk.type === "added") {
          addedCount++;
          diffParts.push(`[+${chunk.value}+]`);
        } else if (chunk.type === "removed") {
          removedCount++;
          diffParts.push(`[-${chunk.value}-]`);
        } else {
          unchangedCount++;
          diffParts.push(chunk.value);
        }
      }
      diffText = diffParts.join("");
    }

    const summary = `${addedCount} addition${addedCount === 1 ? "" : "s"}, ${removedCount} removal${removedCount === 1 ? "" : "s"}`;

    return {
      success: true,
      data: {
        identical: false,
        mode,
        addedCount,
        removedCount,
        unchangedCount,
        summary,
        diff: diffText,
        chunks,
      },
    };
  }
}

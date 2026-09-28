import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const TextDiffInputSchema = z.object({
  original: z
    .string()
    .max(100_000, "Original text exceeds maximum limit of 100KB")
    .describe("The baseline / original text"),
  modified: z
    .string()
    .max(100_000, "Modified text exceeds maximum limit of 100KB")
    .describe("The revised / modified text"),
  mode: z
    .enum(["line", "word"])
    .default("line")
    .optional()
    .describe("Comparison granularity: 'line' (default) or 'word'"),
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

  // Optimize identical case
  if (n === m && tokensA.every((val, idx) => val === tokensB[idx])) {
    return tokensA.length > 0 ? [{ type: "unchanged", value: tokensA.join(delimiter) }] : [];
  }

  // LCS Matrix
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

  // Backtrack to build diff chunks
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

  // Compact consecutive chunks of same type
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
    displayName: "Text Diff Analyzer",
    description:
      "Analyzes and computes structured differences between two text blocks with line or word granularity. Returns diff summaries, counts, and unified diff output. 100% local, free, and privacy-safe.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
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

      // Build unified diff presentation
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
      // Word mode
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

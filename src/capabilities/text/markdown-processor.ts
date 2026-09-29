import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const MarkdownProcessorInputSchema = z.object({
  markdownText: z
    .string()
    .min(1, "Markdown text cannot be empty")
    .max(100_000, "Markdown text exceeds maximum size limit of 100KB")
    .describe("The raw Markdown document content to process"),
  operation: z
    .enum(["inspect", "headings", "links", "code_blocks", "toc", "normalize"])
    .default("inspect")
    .describe(
      "Operation to perform:\n" +
        "- 'inspect': Reports document structure statistics (headings, links, code blocks, words)\n" +
        "- 'headings': Extracts full heading hierarchy with heading levels (H1-H6) and anchor IDs\n" +
        "- 'links': Extracts all hyperlinked URLs, markdown links, and embedded images\n" +
        "- 'code_blocks': Extracts all fenced code blocks with their programming language tags\n" +
        "- 'toc': Generates a clickable markdown Table of Contents from headings\n" +
        "- 'normalize': Normalizes heading spacing, list bullet formatting, and trailing spaces"
    ),
});

export type MarkdownProcessorInput = z.infer<typeof MarkdownProcessorInputSchema>;

export interface MarkdownHeading {
  level: number;
  text: string;
  id: string;
  line: number;
}

export interface MarkdownLink {
  text: string;
  url: string;
  isImage: boolean;
  line: number;
}

export interface MarkdownCodeBlock {
  language: string;
  code: string;
  lineCount: number;
  line: number;
}

export interface MarkdownInspectStats {
  headingCount: number;
  linkCount: number;
  codeBlockCount: number;
  paragraphCount: number;
  listCount: number;
  wordCount: number;
  lineCount: number;
}

export interface MarkdownProcessorOutput {
  operation: "inspect" | "headings" | "links" | "code_blocks" | "toc" | "normalize";
  stats?: MarkdownInspectStats;
  headings?: MarkdownHeading[];
  links?: MarkdownLink[];
  codeBlocks?: MarkdownCodeBlock[];
  toc?: string;
  normalized?: string;
}

/**
 * Slugify heading text to anchor ID (e.g. "My Heading 1" -> "my-heading-1")
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export class MarkdownProcessorCapability implements Capability<
  typeof MarkdownProcessorInputSchema,
  MarkdownProcessorOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "markdown_processor",
    version: "1.0.0",
    category: "text",
    pack: "Text Pack",
    displayName: "Markdown Structure Processor",
    description:
      "Use when the user asks to inspect structure, extract headings, links, code blocks, generate a Table of Contents (TOC), or normalize Markdown documents. " +
      "Processes Markdown locally in memory with zero remote rendering and zero network requests. " +
      "Do NOT use for converting Markdown to HTML rendering or remote link fetching.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "inspect",
        description:
          "Reports document metrics (headings, links, code blocks, paragraphs, lists, words, lines)",
        inputDescription: "markdownText",
        outputDescription:
          "{ stats: { headingCount, linkCount, codeBlockCount, paragraphCount, listCount, wordCount, lineCount } }",
      },
      {
        name: "headings",
        description:
          "Extracts full heading hierarchy (H1-H6) with levels, line numbers, and anchor slugs",
        inputDescription: "markdownText",
        outputDescription: "{ headings: [{ level, text, id, line }] }",
      },
      {
        name: "links",
        description: "Extracts all markdown links and images with target URLs",
        inputDescription: "markdownText",
        outputDescription: "{ links: [{ text, url, isImage, line }] }",
      },
      {
        name: "code_blocks",
        description: "Extracts fenced code blocks with language identifiers and line numbers",
        inputDescription: "markdownText",
        outputDescription: "{ codeBlocks: [{ language, code, lineCount, line }] }",
      },
      {
        name: "toc",
        description: "Generates a clickable markdown Table of Contents from headings",
        inputDescription: "markdownText",
        outputDescription: "{ toc: string }",
      },
      {
        name: "normalize",
        description: "Normalizes heading spacing, bullet styles, and trailing whitespace",
        inputDescription: "markdownText",
        outputDescription: "{ normalizedMarkdown: string }",
      },
    ],
    limits: {
      maxTextLength: 100_000,
      maxInputBytes: 100_000,
      timeoutMs: 3000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Static AST parser; raw HTML treated as plain text strings without rendering",
    },
    usageGuidance: {
      useWhen: [
        "User asks to extract all headings from a Markdown document",
        "User asks to generate a Table of Contents (TOC) for Markdown",
        "User asks to extract all code blocks or language snippets from Markdown",
        "User asks to list all URLs or links mentioned in Markdown",
        "User asks to inspect document metrics (word counts, heading depth)",
        "User asks to clean up or normalize Markdown formatting",
      ],
      doNotUseWhen: [
        "User asks to compare two documents for diffs (use text_diff_analyzer)",
        "User asks to fetch or scrape a remote webpage from a URL (use url_analyzer or local text tools)",
        "User asks to evaluate or execute the code inside code blocks",
      ],
      exampleRequests: [
        "Generate a table of contents for this Markdown documentation",
        "Extract all code blocks and their languages from this README",
        "List all links and images in this Markdown draft",
        "Inspect the structural metrics of this Markdown file",
      ],
    },
  };

  public readonly inputSchema = MarkdownProcessorInputSchema;

  public async execute(
    input: MarkdownProcessorInput
  ): Promise<CapabilityResult<MarkdownProcessorOutput>> {
    const { markdownText, operation = "inspect" } = input;
    const lines = markdownText.split(/\r?\n/);

    // 1. Extract Headings
    const headings: MarkdownHeading[] = [];
    lines.forEach((line, idx) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const text = match[2].trim();
        headings.push({
          level: match[1].length,
          text,
          id: slugify(text),
          line: idx + 1,
        });
      }
    });

    // 2. Extract Links & Images
    const links: MarkdownLink[] = [];
    const linkRegex = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;
    lines.forEach((line, idx) => {
      let m: RegExpExecArray | null;
      while ((m = linkRegex.exec(line)) !== null) {
        links.push({
          isImage: m[1] === "!",
          text: m[2],
          url: m[3].trim(),
          line: idx + 1,
        });
      }
    });

    // 3. Extract Code Blocks
    const codeBlocks: MarkdownCodeBlock[] = [];
    let insideCode = false;
    let currentLang = "";
    let currentCode: string[] = [];
    let startLine = 0;

    lines.forEach((line, idx) => {
      const match = line.match(/^```(\w*)/);
      if (match) {
        if (!insideCode) {
          insideCode = true;
          currentLang = match[1] || "text";
          currentCode = [];
          startLine = idx + 1;
        } else {
          insideCode = false;
          codeBlocks.push({
            language: currentLang,
            code: currentCode.join("\n"),
            lineCount: currentCode.length,
            line: startLine,
          });
        }
      } else if (insideCode) {
        currentCode.push(line);
      }
    });

    // 4. Operation: inspect
    if (operation === "inspect") {
      let listCount = 0;
      let paragraphCount = 0;
      let inParagraph = false;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.match(/^(\*|-|\+|\d+\.)\s+/)) {
          listCount++;
          inParagraph = false;
        } else if (trimmed.length > 0 && !trimmed.startsWith("#") && !trimmed.startsWith("```")) {
          if (!inParagraph) {
            paragraphCount++;
            inParagraph = true;
          }
        } else if (trimmed.length === 0) {
          inParagraph = false;
        }
      });

      const words = markdownText
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[#*`_~[\]()]/g, "")
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      return {
        success: true,
        data: {
          operation: "inspect",
          stats: {
            headingCount: headings.length,
            linkCount: links.length,
            codeBlockCount: codeBlocks.length,
            paragraphCount,
            listCount,
            wordCount: words.length,
            lineCount: lines.length,
          },
        },
      };
    }

    // 5. Operation: headings
    if (operation === "headings") {
      return {
        success: true,
        data: {
          operation: "headings",
          headings,
        },
      };
    }

    // 6. Operation: links
    if (operation === "links") {
      return {
        success: true,
        data: {
          operation: "links",
          links,
        },
      };
    }

    // 7. Operation: code_blocks
    if (operation === "code_blocks") {
      return {
        success: true,
        data: {
          operation: "code_blocks",
          codeBlocks,
        },
      };
    }

    // 8. Operation: toc
    if (operation === "toc") {
      if (headings.length === 0) {
        return {
          success: true,
          data: {
            operation: "toc",
            toc: "No headings found in document.",
          },
        };
      }

      const minLevel = Math.min(...headings.map((h) => h.level));
      const tocLines = headings.map((h) => {
        const indent = "  ".repeat(Math.max(0, h.level - minLevel));
        return `${indent}- [${h.text}](#${h.id})`;
      });

      return {
        success: true,
        data: {
          operation: "toc",
          headings,
          toc: tocLines.join("\n"),
        },
      };
    }

    // 9. Operation: normalize
    const normalizedLines: string[] = [];
    let prevEmpty = false;

    lines.forEach((line) => {
      let clean = line.replace(/\s+$/, ""); // Remove trailing whitespace

      // Standardize bullet points (* / + to -)
      clean = clean.replace(/^(\s*)[*+]\s+/, "$1- ");

      const isEmpty = clean.trim() === "";
      if (isEmpty) {
        if (!prevEmpty) normalizedLines.push("");
        prevEmpty = true;
      } else {
        normalizedLines.push(clean);
        prevEmpty = false;
      }
    });

    return {
      success: true,
      data: {
        operation: "normalize",
        normalized: normalizedLines.join("\n").trim(),
      },
    };
  }
}

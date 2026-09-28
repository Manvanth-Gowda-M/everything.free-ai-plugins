import { describe, it, expect } from "vitest";
import { MarkdownProcessorCapability } from "../../src/capabilities/text/markdown-processor.js";

describe("MarkdownProcessorCapability", () => {
  const capability = new MarkdownProcessorCapability();
  const sampleMarkdown = `# Everything.Free

Welcome to Everything.Free AI Plugins.

## Features
- Fast
- Free
- Local

## Code Example
\`\`\`typescript
const x = 42;
\`\`\`

Visit [Official Spec](https://modelcontextprotocol.io) or see ![Logo](https://example.com/logo.png).
`;

  it("should inspect Markdown structure and metrics", async () => {
    const res = await capability.execute({
      markdownText: sampleMarkdown,
      operation: "inspect",
    });

    expect(res.success).toBe(true);
    expect(res.data?.stats?.headingCount).toBe(3); // H1, H2, H2
    expect(res.data?.stats?.codeBlockCount).toBe(1);
    expect(res.data?.stats?.linkCount).toBe(2); // link + image
    expect(res.data?.stats?.listCount).toBe(3);
  });

  it("should extract headings with levels and anchor IDs", async () => {
    const res = await capability.execute({
      markdownText: sampleMarkdown,
      operation: "headings",
    });

    expect(res.success).toBe(true);
    expect(res.data?.headings?.length).toBe(3);
    expect(res.data?.headings?.[0]).toEqual({
      level: 1,
      text: "Everything.Free",
      id: "everythingfree",
      line: 1,
    });
  });

  it("should extract links and image references", async () => {
    const res = await capability.execute({
      markdownText: sampleMarkdown,
      operation: "links",
    });

    expect(res.success).toBe(true);
    expect(res.data?.links?.length).toBe(2);
    expect(res.data?.links?.[0]).toEqual({
      isImage: false,
      text: "Official Spec",
      url: "https://modelcontextprotocol.io",
      line: 15,
    });
    expect(res.data?.links?.[1].isImage).toBe(true);
  });

  it("should extract fenced code blocks and languages", async () => {
    const res = await capability.execute({
      markdownText: sampleMarkdown,
      operation: "code_blocks",
    });

    expect(res.success).toBe(true);
    expect(res.data?.codeBlocks?.length).toBe(1);
    expect(res.data?.codeBlocks?.[0].language).toBe("typescript");
    expect(res.data?.codeBlocks?.[0].code).toBe("const x = 42;");
  });

  it("should generate a clickable Table of Contents (TOC)", async () => {
    const res = await capability.execute({
      markdownText: sampleMarkdown,
      operation: "toc",
    });

    expect(res.success).toBe(true);
    expect(res.data?.toc).toContain("- [Everything.Free](#everythingfree)");
    expect(res.data?.toc).toContain("  - [Features](#features)");
  });

  it("should normalize markdown formatting", async () => {
    const dirtyMarkdown = "# Heading\n\n\n* bullet 1\n+ bullet 2   \n\n\nParagraph text";
    const res = await capability.execute({
      markdownText: dirtyMarkdown,
      operation: "normalize",
    });

    expect(res.success).toBe(true);
    expect(res.data?.normalized).toContain("- bullet 1");
    expect(res.data?.normalized).toContain("- bullet 2");
  });
});

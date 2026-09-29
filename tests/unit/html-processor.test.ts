import { describe, it, expect } from "vitest";
import { HtmlProcessorCapability, HtmlProcessorOutput } from "../../src/capabilities/text/html-processor.js";
import { ExecutionRunner } from "../../src/core/execution.js";

describe("HtmlProcessorCapability", () => {
  const capability = new HtmlProcessorCapability();

  const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="description" content="Free AI Capability Engine">
  <meta name="keywords" content="mcp, ai, tools, free">
  <meta property="og:title" content="Everything.Free Plugins">
  <title>Everything.Free - Home</title>
  <style>body { background: #000; }</style>
  <script>console.log("analytics");</script>
</head>
<body>
  <header>
    <h1>Welcome to Everything.Free</h1>
    <p>Empowering AI with 100% free local tools.</p>
  </header>
  <main>
    <h2>Capabilities Catalog</h2>
    <p>Explore our fast in-memory tools:</p>
    <ul>
      <li><a href="https://quilonix.dev/docs" title="Documentation" target="_blank">Documentation</a></li>
      <li><a href="https://github.com/quilonix" rel="noopener">GitHub Repository</a></li>
    </ul>
    <img src="https://quilonix.dev/logo.png" alt="Quilonix Logo" width="200" height="50" />
    <form action="/search" method="POST">
      <input type="text" name="q" />
      <button type="submit">Search</button>
    </form>
  </main>
</body>
</html>`;

  describe("inspect operation", () => {
    it("should extract title, headings, links, images, and meta tags", async () => {
      const res = await ExecutionRunner.run<HtmlProcessorOutput>(capability, {
        htmlText: sampleHtml,
        operation: "inspect",
      });

      expect(res.success).toBe(true);
      const stats = res.data?.stats;
      expect(stats).toBeDefined();
      expect(stats?.title).toBe("Everything.Free - Home");
      expect(stats?.headingsCount.h1).toBe(1);
      expect(stats?.headingsCount.h2).toBe(1);
      expect(stats?.headingsCount.total).toBe(2);
      expect(stats?.linksCount).toBe(2);
      expect(stats?.imagesCount).toBe(1);
      expect(stats?.formsCount).toBe(1);
      expect(stats?.scriptsCount).toBe(1);
      expect(stats?.stylesCount).toBe(1);
      expect(stats?.metaTags.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("extract operation", () => {
    it("should extract structured headings, links, images, and metadata", async () => {
      const res = await ExecutionRunner.run<HtmlProcessorOutput>(capability, {
        htmlText: sampleHtml,
        operation: "extract",
        extractTarget: "all",
      });

      expect(res.success).toBe(true);
      const extracted = res.data?.extracted;
      expect(extracted).toBeDefined();

      // Headings
      expect(extracted?.headings).toHaveLength(2);
      expect(extracted?.headings?.[0].text).toBe("Welcome to Everything.Free");

      // Links
      expect(extracted?.links).toHaveLength(2);
      expect(extracted?.links?.[0].href).toBe("https://quilonix.dev/docs");
      expect(extracted?.links?.[0].text).toBe("Documentation");

      // Images
      expect(extracted?.images).toHaveLength(1);
      expect(extracted?.images?.[0].src).toBe("https://quilonix.dev/logo.png");
      expect(extracted?.images?.[0].alt).toBe("Quilonix Logo");

      // Metadata
      expect(extracted?.metadata?.title).toBe("Everything.Free - Home");
      expect(extracted?.metadata?.description).toBe("Free AI Capability Engine");
      expect(extracted?.metadata?.keywords).toEqual(["mcp", "ai", "tools", "free"]);
      expect(extracted?.metadata?.og?.title).toBe("Everything.Free Plugins");

      // Clean Text (without scripts or styles)
      expect(extracted?.text).toContain("Welcome to Everything.Free");
      expect(extracted?.text).not.toContain("console.log");
      expect(extracted?.text).not.toContain("background: #000");
    });
  });

  describe("clean operation", () => {
    it("should strip unsafe scripts, iframes, and inline onclick event handlers", async () => {
      const dirtyHtml = `
        <div onclick="alert('xss')" onmouseover="evil()">
          <h1>Secure Content</h1>
          <script>document.cookie = 'stolen';</script>
          <iframe src="http://phishing.com"></iframe>
          <a href="javascript:alert(1)">Click me</a>
          <p>Valid paragraph text</p>
        </div>
      `;

      const res = await ExecutionRunner.run<HtmlProcessorOutput>(capability, {
        htmlText: dirtyHtml,
        operation: "clean",
      });

      expect(res.success).toBe(true);
      const cleanResult = res.data?.cleanResult;
      expect(cleanResult).toBeDefined();
      expect(cleanResult?.removedTagsCount).toBeGreaterThanOrEqual(2);
      expect(cleanResult?.removedAttributesCount).toBeGreaterThanOrEqual(3);
      expect(cleanResult?.cleanedHtml).not.toContain("<script>");
      expect(cleanResult?.cleanedHtml).not.toContain("<iframe>");
      expect(cleanResult?.cleanedHtml).not.toContain("onclick=");
      expect(cleanResult?.cleanedHtml).not.toContain("onmouseover=");
      expect(cleanResult?.cleanedHtml).not.toContain("javascript:");
      expect(cleanResult?.cleanedHtml).toContain("<h1>Secure Content</h1>");
      expect(cleanResult?.cleanedHtml).toContain("Valid paragraph text");
      expect(cleanResult?.disclaimer).toBeDefined();
    });
  });

  describe("format & minify operations", () => {
    it("should format and minify HTML without corrupting content", async () => {
      const compact = `<div><h1>Hello</h1><p>World</p></div>`;
      const formatRes = await ExecutionRunner.run<HtmlProcessorOutput>(capability, {
        htmlText: compact,
        operation: "format",
      });

      expect(formatRes.success).toBe(true);
      expect(formatRes.data?.result).toContain("<div>\n  <h1>Hello</h1>\n  <p>World</p>\n</div>");

      const minifyRes = await ExecutionRunner.run<HtmlProcessorOutput>(capability, {
        htmlText: formatRes.data?.result || "",
        operation: "minify",
      });

      expect(minifyRes.success).toBe(true);
      expect(minifyRes.data?.result).toBe("<div><h1>Hello</h1><p>World</p></div>");
    });
  });
});

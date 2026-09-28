import { describe, it, expect } from "vitest";
import { TextDiffAnalyzerCapability } from "../../src/capabilities/text/text-diff.js";

describe("TextDiffAnalyzerCapability", () => {
  const capability = new TextDiffAnalyzerCapability();

  it("should detect identical texts", async () => {
    const res = await capability.execute({
      original: "Hello world\nLine 2",
      modified: "Hello world\nLine 2",
      mode: "line",
    });

    expect(res.success).toBe(true);
    expect(res.data?.identical).toBe(true);
    expect(res.data?.addedCount).toBe(0);
    expect(res.data?.removedCount).toBe(0);
  });

  it("should calculate line additions, removals, and diff presentation", async () => {
    const res = await capability.execute({
      original: "Apple\nBanana\nCherry",
      modified: "Apple\nBlueberry\nCherry\nDate",
      mode: "line",
    });

    expect(res.success).toBe(true);
    expect(res.data?.identical).toBe(false);
    expect(res.data?.addedCount).toBe(2); // Blueberry, Date
    expect(res.data?.removedCount).toBe(1); // Banana
    expect(res.data?.diff).toContain("+ Blueberry");
    expect(res.data?.diff).toContain("- Banana");
    expect(res.data?.summary).toContain("2 additions, 1 removal");
  });

  it("should support word diff mode", async () => {
    const res = await capability.execute({
      original: "The quick brown fox",
      modified: "The fast brown fox",
      mode: "word",
    });

    expect(res.success).toBe(true);
    expect(res.data?.identical).toBe(false);
    expect(res.data?.mode).toBe("word");
    expect(res.data?.diff).toContain("[-quick-]");
    expect(res.data?.diff).toContain("[+fast+]");
  });

  it("should handle empty inputs gracefully", async () => {
    const res = await capability.execute({
      original: "",
      modified: "",
      mode: "line",
    });

    expect(res.success).toBe(true);
    expect(res.data?.identical).toBe(true);
  });
});

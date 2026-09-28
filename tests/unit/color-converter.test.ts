import { describe, it, expect } from "vitest";
import { ColorConverterCapability } from "../../src/capabilities/utility/color-converter.js";

describe("ColorConverterCapability", () => {
  const capability = new ColorConverterCapability();

  describe("HEX conversion", () => {
    it("converts 6-digit HEX correctly (#D4AF37)", async () => {
      const result = await capability.execute({ color: "#D4AF37" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formats.hex).toBe("#D4AF37");
        expect(result.data.formats.rgb).toBe("rgb(212, 175, 55)");
        expect(result.data.channels.r).toBe(212);
        expect(result.data.channels.g).toBe(175);
        expect(result.data.channels.b).toBe(55);
        expect(result.data.formats.hsl).toContain("hsl(46");
        expect(result.data.metrics.alpha).toBe(1);
      }
    });

    it("converts 3-digit shorthand HEX (#F00)", async () => {
      const result = await capability.execute({ color: "#F00" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formats.hex).toBe("#FF0000");
        expect(result.data.formats.rgb).toBe("rgb(255, 0, 0)");
        expect(result.data.formats.hsl).toBe("hsl(0, 100%, 50%)");
      }
    });

    it("converts 8-digit HEX with alpha (#00FF0080)", async () => {
      const result = await capability.execute({ color: "#00FF0080" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formats.hex).toBe("#00FF00");
        expect(result.data.channels.a).toBeCloseTo(0.5, 1);
        expect(result.data.formats.rgba).toContain("rgba(0, 255, 0, 0.5");
      }
    });
  });

  describe("RGB/RGBA conversion", () => {
    it("converts rgb(0, 0, 0) - black", async () => {
      const result = await capability.execute({ color: "rgb(0, 0, 0)" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formats.hex).toBe("#000000");
        expect(result.data.metrics.isDark).toBe(true);
        expect(result.data.metrics.relativeLuminance).toBe(0);
      }
    });

    it("converts rgb(255, 255, 255) - white", async () => {
      const result = await capability.execute({ color: "rgb(255, 255, 255)" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formats.hex).toBe("#FFFFFF");
        expect(result.data.metrics.isDark).toBe(false);
        expect(result.data.metrics.relativeLuminance).toBe(1);
      }
    });

    it("converts rgba with float alpha", async () => {
      const result = await capability.execute({ color: "rgba(100, 150, 200, 0.75)" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.channels.r).toBe(100);
        expect(result.data.channels.g).toBe(150);
        expect(result.data.channels.b).toBe(200);
        expect(result.data.metrics.alpha).toBe(0.75);
      }
    });
  });

  describe("HSL/HSLA conversion", () => {
    it("converts hsl(120, 100%, 50%) - pure green", async () => {
      const result = await capability.execute({ color: "hsl(120, 100%, 50%)" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formats.hex).toBe("#00FF00");
        expect(result.data.channels.r).toBe(0);
        expect(result.data.channels.g).toBe(255);
        expect(result.data.channels.b).toBe(0);
      }
    });

    it("converts hsla with percentage alpha", async () => {
      const result = await capability.execute({ color: "hsla(240, 100%, 50%, 50%)" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formats.hex).toBe("#0000FF");
        expect(result.data.metrics.alpha).toBe(0.5);
      }
    });
  });

  describe("Extended formats (HSV, HWB, OKLCH)", () => {
    it("provides HWB and OKLCH representations", async () => {
      const result = await capability.execute({ color: "#D4AF37" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formats.hwb).toBeDefined();
        expect(result.data.formats.hwb).toMatch(/^hwb\(\d+\s+\d+%\s+\d+%\)$/);
        expect(result.data.formats.oklch).toBeDefined();
        expect(result.data.formats.oklch).toMatch(/^oklch\(/);
        expect(result.data.formats.hsv).toBeDefined();
      }
    });
  });

  describe("Error handling", () => {
    it("returns an AI-friendly error on invalid color strings", async () => {
      const result = await capability.execute({ color: "not-a-color" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INVALID_COLOR_FORMAT");
        expect(result.error.message).toContain("Could not parse color 'not-a-color'");
        expect(result.error.message).toContain("Supported CSS formats");
      }
    });
  });
});

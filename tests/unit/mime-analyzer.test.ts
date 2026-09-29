import { describe, it, expect } from "vitest";
import {
  MimeAnalyzerCapability,
  MimeAnalyzerOutput,
} from "../../src/capabilities/developer/mime-analyzer.js";
import { ExecutionRunner } from "../../src/core/execution.js";

describe("MimeAnalyzerCapability", () => {
  const capability = new MimeAnalyzerCapability();

  describe("Magic Signature Detection", () => {
    it("should detect PNG from Hex magic bytes (89504E470D0A1A0A)", async () => {
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(capability, {
        byteSample: "89504E470D0A1A0A0000000D49484452",
        sampleEncoding: "hex",
      });

      expect(res.success).toBe(true);
      expect(res.data?.detectedMimeType).toBe("image/png");
      expect(res.data?.category).toBe("image");
      expect(res.data?.confidence).toBe("high");
      expect(res.data?.magicSignature.matched).toBe(true);
      expect(res.data?.magicSignature.signatureName).toBe("PNG");
    });

    it("should detect PDF from Base64 byte sample (%PDF...)", async () => {
      // JVBERi0xLjQ = '%PDF-1.4' in Base64
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(capability, {
        byteSample: "JVBERi0xLjQ=",
        sampleEncoding: "base64",
      });

      expect(res.success).toBe(true);
      expect(res.data?.detectedMimeType).toBe("application/pdf");
      expect(res.data?.category).toBe("document");
      expect(res.data?.confidence).toBe("high");
      expect(res.data?.magicSignature.signatureName).toBe("PDF");
    });

    it("should detect ZIP archive magic header", async () => {
      // PK\x03\x04 = 504B0304
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(capability, {
        byteSample: "504B030414000000",
      });

      expect(res.success).toBe(true);
      expect(res.data?.detectedMimeType).toBe("application/zip");
      expect(res.data?.category).toBe("archive");
    });
  });

  describe("Extension & Filename Analysis", () => {
    it("should identify multi-part compound extension (.tar.gz)", async () => {
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(capability, {
        filename: "backup-2025.tar.gz",
      });

      expect(res.success).toBe(true);
      expect(res.data?.extension).toBe(".tar.gz");
      expect(res.data?.detectedMimeType).toBe("application/gzip");
      expect(res.data?.category).toBe("archive");
      expect(res.data?.confidence).toBe("low");
    });

    it("should identify JSON data file", async () => {
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(capability, {
        filename: "config.json",
        declaredMimeType: "application/json",
      });

      expect(res.success).toBe(true);
      expect(res.data?.extension).toBe(".json");
      expect(res.data?.detectedMimeType).toBe("application/json");
      expect(res.data?.category).toBe("data");
      expect(res.data?.confidence).toBe("medium");
    });
  });

  describe("Mismatch & Security Risk Detection", () => {
    it("should detect mismatch when a PNG is named as a PDF", async () => {
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(capability, {
        filename: "invoice.pdf",
        byteSample: "89504E470D0A1A0A", // PNG magic
      });

      expect(res.success).toBe(true);
      expect(res.data?.mismatchDetected).toBe(true);
      expect(res.data?.mismatchDetails).toContain(
        "File extension '.pdf' implies 'application/pdf', but magic byte header indicates 'image/png'"
      );
      expect(res.data?.detectedMimeType).toBe("image/png");
    });

    it("should flag security risk when an executable (MZ) is disguised as an image (.jpg)", async () => {
      // 4D5A = 'MZ' (Windows PE Executable)
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(capability, {
        filename: "cute_cat.jpg",
        byteSample: "4D5A90000300000004000000FFFF0000",
      });

      expect(res.success).toBe(true);
      expect(res.data?.mismatchDetected).toBe(true);
      expect(res.data?.category).toBe("executable");
      expect(res.data?.potentialRisks).toBeDefined();
      expect(res.data?.potentialRisks?.[0]).toContain("Executable binary magic header");
    });
  });

  describe("Fallback and Edge Cases", () => {
    it("should handle unknown files gracefully", async () => {
      const res = await ExecutionRunner.run<MimeAnalyzerOutput>(capability, {
        filename: "unknown_file_without_extension",
      });

      expect(res.success).toBe(true);
      expect(res.data?.extension).toBeNull();
      expect(res.data?.category).toBe("unknown");
      expect(res.data?.confidence).toBe("none");
    });
  });
});

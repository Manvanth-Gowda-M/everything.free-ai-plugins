import { z } from "zod";
import crypto from "node:crypto";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const HashAndEncodingOperations = [
  "sha256",
  "sha512",
  "base64_encode",
  "base64_decode",
  "base64url_encode",
  "base64url_decode",
  "hex_encode",
  "hex_decode",
  "url_encode",
  "url_decode",
  "uuid_v4",
] as const;

export const HashAndEncodingInputSchema = z.object({
  operation: z
    .enum(HashAndEncodingOperations)
    .describe("Cryptographic hash, encoding/decoding, or UUID generation operation"),
  input: z
    .string()
    .max(100_000, "Input text exceeds maximum size limit of 100KB")
    .optional()
    .describe("Input string to hash or encode/decode (not required for uuid_v4)"),
});

export type HashAndEncodingInput = z.infer<typeof HashAndEncodingInputSchema>;

export interface HashAndEncodingOutput {
  operation: (typeof HashAndEncodingOperations)[number];
  output: string;
  inputLength?: number;
  outputLength: number;
}

export class HashAndEncodingCapability
  implements Capability<typeof HashAndEncodingInputSchema, HashAndEncodingOutput>
{
  public readonly metadata: CapabilityMetadata = {
    name: "hash_and_encoding",
    version: "1.0.0",
    category: "encoding",
    displayName: "Hash and Encoding Utilities",
    description:
      "Performs secure cryptographic hashing (SHA-256, SHA-512), standard encodings (Base64, Base64URL, Hex, URL), and UUIDv4 generation. 100% local, built-in Node crypto, free, and privacy-safe.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
  };

  public readonly inputSchema = HashAndEncodingInputSchema;

  public async execute(
    input: HashAndEncodingInput
  ): Promise<CapabilityResult<HashAndEncodingOutput>> {
    const { operation, input: text = "" } = input;

    // UUIDv4 Generation
    if (operation === "uuid_v4") {
      const uuid = crypto.randomUUID();
      return {
        success: true,
        data: {
          operation: "uuid_v4",
          output: uuid,
          outputLength: uuid.length,
        },
      };
    }

    if (!text) {
      // Empty input handling
      if (operation === "sha256") {
        const hash = crypto.createHash("sha256").update("").digest("hex");
        return {
          success: true,
          data: { operation, output: hash, inputLength: 0, outputLength: hash.length },
        };
      }
      if (operation === "sha512") {
        const hash = crypto.createHash("sha512").update("").digest("hex");
        return {
          success: true,
          data: { operation, output: hash, inputLength: 0, outputLength: hash.length },
        };
      }
      return {
        success: true,
        data: { operation, output: "", inputLength: 0, outputLength: 0 },
      };
    }

    const inputLength = text.length;

    try {
      let output = "";

      switch (operation) {
        case "sha256":
          output = crypto.createHash("sha256").update(text, "utf8").digest("hex");
          break;

        case "sha512":
          output = crypto.createHash("sha512").update(text, "utf8").digest("hex");
          break;

        case "base64_encode":
          output = Buffer.from(text, "utf8").toString("base64");
          break;

        case "base64_decode": {
          // Validate base64 format
          const clean = text.trim();
          if (!/^[A-Za-z0-9+/=]+$/.test(clean) || clean.length % 4 !== 0) {
            return {
              success: false,
              error: {
                code: "INVALID_ENCODING",
                message: "Input is not a valid Base64 string",
              },
            };
          }
          output = Buffer.from(clean, "base64").toString("utf8");
          break;
        }

        case "base64url_encode":
          output = Buffer.from(text, "utf8").toString("base64url");
          break;

        case "base64url_decode": {
          const clean = text.trim();
          if (!/^[A-Za-z0-9_-]+$/.test(clean)) {
            return {
              success: false,
              error: {
                code: "INVALID_ENCODING",
                message: "Input is not a valid Base64URL string",
              },
            };
          }
          output = Buffer.from(clean, "base64url").toString("utf8");
          break;
        }

        case "hex_encode":
          output = Buffer.from(text, "utf8").toString("hex");
          break;

        case "hex_decode": {
          const clean = text.trim();
          if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) {
            return {
              success: false,
              error: {
                code: "INVALID_ENCODING",
                message: "Input is not a valid Hex string (must be even length hex digits)",
              },
            };
          }
          output = Buffer.from(clean, "hex").toString("utf8");
          break;
        }

        case "url_encode":
          output = encodeURIComponent(text);
          break;

        case "url_decode":
          output = decodeURIComponent(text);
          break;
      }

      return {
        success: true,
        data: {
          operation,
          output,
          inputLength,
          outputLength: output.length,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: "ENCODING_ERROR",
          message: err instanceof Error ? err.message : "Failed to execute encoding operation",
        },
      };
    }
  }
}

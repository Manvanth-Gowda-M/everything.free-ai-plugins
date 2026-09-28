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
    .describe(
      "Operation to perform:\n" +
        "- 'sha256': Generates 256-bit SHA-2 cryptographic hash (hex string)\n" +
        "- 'sha512': Generates 512-bit SHA-2 cryptographic hash (hex string)\n" +
        "- 'base64_encode': Encodes UTF-8 string to standard Base64\n" +
        "- 'base64_decode': Decodes standard Base64 string to UTF-8 text\n" +
        "- 'base64url_encode': Encodes string to URL-safe Base64URL\n" +
        "- 'base64url_decode': Decodes Base64URL string to UTF-8 text\n" +
        "- 'hex_encode': Encodes UTF-8 string to hexadecimal representation\n" +
        "- 'hex_decode': Decodes hexadecimal string to UTF-8 text\n" +
        "- 'url_encode': Encodes string using standard URI percent-encoding\n" +
        "- 'url_decode': Decodes URI percent-encoded string to UTF-8 text\n" +
        "- 'uuid_v4': Generates a cryptographically random RFC 4122 UUID version 4"
    ),
  input: z
    .string()
    .max(100_000, "Input text exceeds maximum size limit of 100KB")
    .optional()
    .describe("Input string to hash or encode/decode (UTF-8). Not required when operation is 'uuid_v4'"),
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
    pack: "Encoding Pack",
    displayName: "Hash and Encoding Utilities",
    description:
      "Use when the user asks to compute SHA-256 or SHA-512 hashes, encode/decode Base64, Base64URL, Hex, URL strings, or generate UUIDs. " +
      "Executes locally using Node.js built-in cryptography with zero external APIs and zero data persistence. " +
      "Do NOT use for password cracking, brute forcing, or encryption with secret keys.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "sha256",
        description: "Computes cryptographic SHA-256 hash in hex or base64 format",
        inputDescription: "input: string, outputFormat?: 'hex' | 'base64'",
        outputDescription: "{ operation: 'sha256', output: string, byteLength: number }",
      },
      {
        name: "sha512",
        description: "Computes cryptographic SHA-512 hash in hex or base64 format",
        inputDescription: "input: string, outputFormat?: 'hex' | 'base64'",
        outputDescription: "{ operation: 'sha512', output: string, byteLength: number }",
      },
      {
        name: "base64_encode",
        description: "Encodes UTF-8 string into standard Base64 format",
        inputDescription: "input: string",
        outputDescription: "{ operation: 'base64_encode', output: string }",
      },
      {
        name: "base64_decode",
        description: "Decodes standard Base64 string into UTF-8 text",
        inputDescription: "input: string",
        outputDescription: "{ operation: 'base64_decode', output: string }",
      },
      {
        name: "base64url_encode",
        description: "Encodes UTF-8 string into URL-safe Base64URL format without padding",
        inputDescription: "input: string",
        outputDescription: "{ operation: 'base64url_encode', output: string }",
      },
      {
        name: "base64url_decode",
        description: "Decodes URL-safe Base64URL string into UTF-8 text",
        inputDescription: "input: string",
        outputDescription: "{ operation: 'base64url_decode', output: string }",
      },
      {
        name: "hex_encode",
        description: "Encodes UTF-8 string into hexadecimal character sequence",
        inputDescription: "input: string",
        outputDescription: "{ operation: 'hex_encode', output: string }",
      },
      {
        name: "hex_decode",
        description: "Decodes hexadecimal character sequence into UTF-8 text",
        inputDescription: "input: string",
        outputDescription: "{ operation: 'hex_decode', output: string }",
      },
      {
        name: "url_encode",
        description: "Percent-encodes URI characters in string",
        inputDescription: "input: string",
        outputDescription: "{ operation: 'url_encode', output: string }",
      },
      {
        name: "url_decode",
        description: "Decodes percent-encoded URI string",
        inputDescription: "input: string",
        outputDescription: "{ operation: 'url_decode', output: string }",
      },
      {
        name: "uuid_v4",
        description: "Generates a cryptographically random UUIDv4 string using native node:crypto",
        inputDescription: "None required",
        outputDescription: "{ operation: 'uuid_v4', output: string }",
      },
    ],
    limits: {
      maxTextLength: 500_000,
      maxInputBytes: 500_000,
      timeoutMs: 3000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Native Node.js crypto module; pure in-memory transformations",
    },
    usageGuidance: {
      useWhen: [
        "User asks for SHA-256 or SHA-512 hash of text or data",
        "User asks to encode or decode Base64 / Base64URL text",
        "User asks to convert text to/from Hexadecimal",
        "User asks to URL-encode or URL-decode a string or query param",
        "User asks to generate a random UUIDv4 identifier",
      ],
      doNotUseWhen: [
        "User asks to compare two texts for differences (use text_diff_analyzer)",
        "User asks to format JSON (use json_formatter_validator)",
        "User asks for password cracking or brute-forcing hash inversions",
      ],
      exampleRequests: [
        "Generate a SHA-256 checksum for this configuration string",
        "Base64-encode this API payload",
        "Decode this percent-encoded URL string",
        "Generate a new random UUID v4",
      ],
    },
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
          const clean = text.trim();
          if (!/^[A-Za-z0-9+/=]+$/.test(clean) || clean.length % 4 !== 0) {
            return {
              success: false,
              error: {
                code: "INVALID_ENCODING",
                message:
                  `Invalid Base64 input: '${text.slice(0, 30)}${text.length > 30 ? "..." : ""}'. ` +
                  "Base64 strings must contain only valid Base64 characters (A-Z, a-z, 0-9, +, /, =) and have a length divisible by 4.",
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
                message:
                  `Invalid Base64URL input: '${text.slice(0, 30)}${text.length > 30 ? "..." : ""}'. ` +
                  "Base64URL strings must contain only URL-safe Base64 characters (A-Z, a-z, 0-9, _, -).",
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
                message:
                  `Invalid Hex input: '${text.slice(0, 30)}${text.length > 30 ? "..." : ""}'. ` +
                  "Hex strings must contain only hexadecimal digits (0-9, a-f, A-F) and have an even number of characters.",
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

import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const JwtInspectorInputSchema = z.object({
  token: z
    .string()
    .min(1, "JWT token string cannot be empty")
    .max(10_000, "JWT token exceeds maximum size limit of 10KB")
    .describe("The raw JSON Web Token (JWT) string to inspect (format: 'header.payload.signature')"),
});

export type JwtInspectorInput = z.infer<typeof JwtInspectorInputSchema>;

export interface JwtTimestamps {
  issuedAt?: { timestamp: number; iso: string };
  notBefore?: { timestamp: number; iso: string };
  expiresAt?: { timestamp: number; iso: string };
  isExpired?: boolean;
  expiresInSeconds?: number;
}

export interface JwtInspectionOutput {
  validStructure: boolean;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signatureAlgorithm?: string;
  tokenType?: string;
  issuer?: string;
  subject?: string;
  audience?: string | string[];
  jwtId?: string;
  timestamps: JwtTimestamps;
  signaturePreview: string;
  verificationNotice: string;
}

/**
 * Decodes Base64URL string to UTF-8 text safely.
 */
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export class JwtInspectorCapability
  implements Capability<typeof JwtInspectorInputSchema, JwtInspectionOutput>
{
  public readonly metadata: CapabilityMetadata = {
    name: "jwt_inspector",
    version: "1.0.0",
    category: "developer",
    pack: "Developer Pack",
    displayName: "JWT Token Inspector",
    description:
      "Use when the user asks to decode, inspect, or understand the claims, header, and expiration timestamps inside a JSON Web Token (JWT). " +
      "Decodes Base64URL parts locally in memory with zero network calls and zero token persistence. " +
      "Important: Decodes claims only; does NOT verify cryptographic signature.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 2000,
    operations: [
      {
        name: "inspect",
        description: "Decodes JWT header, payload claims, timestamps, and calculates expiration status",
        inputDescription: "token: string (format: 'header.payload.signature')",
        outputDescription: "{ validStructure, header, payload, subject, issuer, audience, timestamps, signaturePreview, verificationNotice }",
      },
    ],
    limits: {
      maxTextLength: 10_000,
      maxInputBytes: 10_000,
      timeoutMs: 2000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Strict structural decoding without signature verification; zero token logging or persistence",
    },
    usageGuidance: {
      useWhen: [
        "User asks to inspect or decode a JWT string",
        "User asks what claims, issuer, subject, or audience are in a JWT",
        "User asks if a JWT is expired or when it expires",
        "User asks to inspect JWT header algorithm (alg) or type (typ)",
      ],
      doNotUseWhen: [
        "User asks to cryptographically verify a JWT with a secret key",
        "User asks to sign or issue a new JWT token",
        "User asks for general hashing or Base64 conversion (use hash_and_encoding)",
      ],
      exampleRequests: [
        "Inspect this JWT and show me what claims and expiration date it has",
        "Decode this auth token and check if it is expired",
        "Show me the header and payload of this JWT",
      ],
    },
  };

  public readonly inputSchema = JwtInspectorInputSchema;

  public async execute(
    input: JwtInspectorInput
  ): Promise<CapabilityResult<JwtInspectionOutput>> {
    const { token } = input;
    const cleanToken = token.trim();

    const parts = cleanToken.split(".");
    if (parts.length !== 3) {
      return {
        success: false,
        error: {
          code: "INVALID_JWT_FORMAT",
          message:
            `Invalid JWT structure. Expected 3 dot-separated parts (header.payload.signature), but found ${parts.length} part(s). ` +
            "Ensure you provided a complete standard JWT token.",
        },
      };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode Header
    let header: Record<string, unknown>;
    try {
      const headerJson = decodeBase64Url(headerB64);
      header = JSON.parse(headerJson);
    } catch {
      return {
        success: false,
        error: {
          code: "INVALID_JWT_HEADER",
          message: "Failed to decode JWT header. Header is not valid Base64URL-encoded JSON.",
        },
      };
    }

    // Decode Payload
    let payload: Record<string, unknown>;
    try {
      const payloadJson = decodeBase64Url(payloadB64);
      payload = JSON.parse(payloadJson);
    } catch {
      return {
        success: false,
        error: {
          code: "INVALID_JWT_PAYLOAD",
          message: "Failed to decode JWT payload. Payload is not valid Base64URL-encoded JSON.",
        },
      };
    }

    // Parse Standard Timestamps
    const nowSeconds = Math.floor(Date.now() / 1000);
    const timestamps: JwtTimestamps = {};

    if (typeof payload.iat === "number") {
      timestamps.issuedAt = {
        timestamp: payload.iat,
        iso: new Date(payload.iat * 1000).toISOString(),
      };
    }

    if (typeof payload.nbf === "number") {
      timestamps.notBefore = {
        timestamp: payload.nbf,
        iso: new Date(payload.nbf * 1000).toISOString(),
      };
    }

    if (typeof payload.exp === "number") {
      const expDate = new Date(payload.exp * 1000);
      timestamps.expiresAt = {
        timestamp: payload.exp,
        iso: expDate.toISOString(),
      };
      timestamps.isExpired = nowSeconds >= payload.exp;
      timestamps.expiresInSeconds = payload.exp - nowSeconds;
    }

    // Redacted signature preview
    const signaturePreview =
      signatureB64.length > 12
        ? `${signatureB64.slice(0, 6)}...${signatureB64.slice(-6)}`
        : signatureB64;

    return {
      success: true,
      data: {
        validStructure: true,
        header,
        payload,
        signatureAlgorithm: typeof header.alg === "string" ? header.alg : undefined,
        tokenType: typeof header.typ === "string" ? header.typ : undefined,
        issuer: typeof payload.iss === "string" ? payload.iss : undefined,
        subject: typeof payload.sub === "string" ? payload.sub : undefined,
        audience: typeof payload.aud === "string" || Array.isArray(payload.aud) ? (payload.aud as string | string[]) : undefined,
        jwtId: typeof payload.jti === "string" ? payload.jti : undefined,
        timestamps,
        signaturePreview,
        verificationNotice:
          "DECODED ONLY. This tool inspected the token structure and claims without cryptographic signature verification. Do not trust unverified claims in security-critical contexts.",
      },
    };
  }
}

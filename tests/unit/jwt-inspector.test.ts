import { describe, it, expect } from "vitest";
import { JwtInspectorCapability } from "../../src/capabilities/developer/jwt-inspector.js";

describe("JwtInspectorCapability", () => {
  const capability = new JwtInspectorCapability();

  // Standard sample token:
  // Header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
  // Payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":2500000000,"iss":"quilonix.dev"}
  //   -> eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MDAwMDAwMDAsImlzcyI6InF1aWxvbml4LmRldiJ9
  // Sig: SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
  const sampleJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MDAwMDAwMDAsImlzcyI6InF1aWxvbml4LmRldiJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  it("should decode and inspect JWT structure and claims", async () => {
    const res = await capability.execute({
      token: sampleJwt,
    });

    expect(res.success).toBe(true);
    expect(res.data?.validStructure).toBe(true);
    expect(res.data?.signatureAlgorithm).toBe("HS256");
    expect(res.data?.tokenType).toBe("JWT");
    expect(res.data?.subject).toBe("1234567890");
    expect(res.data?.issuer).toBe("quilonix.dev");
    expect(res.data?.payload.name).toBe("John Doe");
    expect(res.data?.timestamps.issuedAt?.timestamp).toBe(1516239022);
    expect(res.data?.timestamps.expiresAt?.timestamp).toBe(2500000000);
    expect(res.data?.timestamps.isExpired).toBe(false);
    expect(res.data?.verificationNotice).toContain("DECODED ONLY");
  });

  it("should detect expired JWT token", async () => {
    // exp in past: 1000000000 (year 2001)
    const expiredPayload = Buffer.from(
      JSON.stringify({ sub: "user1", exp: 1000000000 })
    ).toString("base64url");
    const expiredJwt = `eyJhbGciOiJIUzI1NiJ9.${expiredPayload}.signature123`;

    const res = await capability.execute({
      token: expiredJwt,
    });

    expect(res.success).toBe(true);
    expect(res.data?.timestamps.isExpired).toBe(true);
    expect(res.data?.timestamps.expiresInSeconds).toBeLessThan(0);
  });

  it("should fail gracefully on invalid JWT format (missing dot parts)", async () => {
    const res = await capability.execute({
      token: "not.a.valid.jwt.with.too.many.dots",
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INVALID_JWT_FORMAT");
  });
});

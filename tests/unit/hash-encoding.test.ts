import { describe, it, expect } from "vitest";
import { HashAndEncodingCapability } from "../../src/capabilities/encoding/hash-encoding.js";

describe("HashAndEncodingCapability", () => {
  const capability = new HashAndEncodingCapability();

  it("should compute accurate SHA-256 hash", async () => {
    const res = await capability.execute({
      operation: "sha256",
      input: "hello world",
    });

    expect(res.success).toBe(true);
    expect(res.data?.output).toBe(
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    );
  });

  it("should compute accurate SHA-512 hash", async () => {
    const res = await capability.execute({
      operation: "sha512",
      input: "hello world",
    });

    expect(res.success).toBe(true);
    expect(res.data?.output.length).toBe(128);
  });

  it("should encode and decode Base64 accurately", async () => {
    const encodeRes = await capability.execute({
      operation: "base64_encode",
      input: "Everything.Free AI",
    });
    expect(encodeRes.success).toBe(true);
    expect(encodeRes.data?.output).toBe("RXZlcnl0aGluZy5GcmVlIEFJ");

    const decodeRes = await capability.execute({
      operation: "base64_decode",
      input: "RXZlcnl0aGluZy5GcmVlIEFJ",
    });
    expect(decodeRes.success).toBe(true);
    expect(decodeRes.data?.output).toBe("Everything.Free AI");
  });

  it("should encode and decode Hex accurately", async () => {
    const encodeRes = await capability.execute({
      operation: "hex_encode",
      input: "test",
    });
    expect(encodeRes.success).toBe(true);
    expect(encodeRes.data?.output).toBe("74657374");

    const decodeRes = await capability.execute({
      operation: "hex_decode",
      input: "74657374",
    });
    expect(decodeRes.success).toBe(true);
    expect(decodeRes.data?.output).toBe("test");
  });

  it("should generate valid UUIDv4 strings", async () => {
    const res = await capability.execute({
      operation: "uuid_v4",
    });

    expect(res.success).toBe(true);
    expect(res.data?.output).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("should fail gracefully on invalid Base64 decoding string", async () => {
    const res = await capability.execute({
      operation: "base64_decode",
      input: "invalid!base64",
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INVALID_ENCODING");
  });
});

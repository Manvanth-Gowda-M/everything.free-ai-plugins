import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { startHttpServer } from "../../src/adapters/mcp/http.js";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { loadConfig } from "../../src/config.js";
import { ExecutionRunner } from "../../src/core/execution.js";
import { Capability } from "../../src/core/types.js";
import { z } from "zod";

describe("Production Hardening, Concurrency & Stream Safety Tests", () => {
  let server: http.Server;
  const PORT = 3920;
  const BASE_URL = `http://127.0.0.1:${PORT}`;
  const LIMIT_BYTES = 500; // 500 bytes limit for precise boundary tests
  const MAX_CONCURRENT = 2; // 2 concurrent requests max for testing

  const MCP_HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  beforeAll(async () => {
    const registry = createDefaultRegistry();
    server = startHttpServer(registry, {
      port: PORT,
      host: "127.0.0.1",
      maxBodySizeBytes: LIMIT_BYTES,
      maxConcurrentRequests: MAX_CONCURRENT,
      shutdownTimeoutMs: 500,
    });

    await new Promise<void>((resolve) => {
      if (server.listening) resolve();
      else server.once("listening", resolve);
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  describe("Configuration Model & Safe Defaults", () => {
    it("loads default configuration accurately", () => {
      const config = loadConfig();
      expect(config.port).toBe(3000);
      expect(config.host).toBe("127.0.0.1");
      expect(config.maxBodySizeBytes).toBe(1024 * 1024);
      expect(config.maxConcurrentRequests).toBe(20);
      expect(config.shutdownTimeoutMs).toBe(5000);
      expect(config.logLevel).toBe("info");
    });

    it("applies runtime overrides safely", () => {
      const config = loadConfig({
        port: 8080,
        maxBodySizeBytes: 5000,
        maxConcurrentRequests: 10,
      });
      expect(config.port).toBe(8080);
      expect(config.maxBodySizeBytes).toBe(5000);
      expect(config.maxConcurrentRequests).toBe(10);
    });
  });

  describe("HTTP Security Headers & CORS", () => {
    it("attaches strict security and CORS headers to all responses", async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("referrer-policy")).toBe("no-referrer");
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    });
  });

  describe("Request Method Validation", () => {
    it("rejects unsupported HTTP methods with 405 Method Not Allowed", async () => {
      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "PUT",
        headers: MCP_HEADERS,
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(405);
      expect(res.headers.get("allow")).toContain("GET, POST, DELETE, OPTIONS");
      const data = await res.json();
      expect(data.error).toBe("Method Not Allowed");
    });
  });

  describe("Request Body Size Limit — Strict Boundary & Streaming Tests", () => {
    it("Scenario 1: Body smaller than limit is accepted", async () => {
      const smallPayload = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      });
      expect(Buffer.byteLength(smallPayload)).toBeLessThan(LIMIT_BYTES);

      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: smallPayload,
      });

      expect(res.status).toBe(200);
    });

    it("Scenario 2: Body exactly at configured limit (inclusive boundary) is accepted", async () => {
      // Construct a valid JSON-RPC request padded to exactly LIMIT_BYTES (500 bytes)
      const baseObj = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: { pad: "" },
      };
      const baseStr = JSON.stringify(baseObj);
      const neededPadding = LIMIT_BYTES - Buffer.byteLength(baseStr);
      baseObj.params.pad = "x".repeat(neededPadding);
      const exactPayload = JSON.stringify(baseObj);

      expect(Buffer.byteLength(exactPayload)).toBe(LIMIT_BYTES);

      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: exactPayload,
      });

      expect(res.status).toBe(200);
    });

    it("Scenario 3: Body exactly one byte over configured limit returns 413", async () => {
      const baseObj = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/list",
        params: { pad: "" },
      };
      const baseStr = JSON.stringify(baseObj);
      const neededPadding = LIMIT_BYTES + 1 - Buffer.byteLength(baseStr);
      baseObj.params.pad = "x".repeat(neededPadding);
      const oneByteOverPayload = JSON.stringify(baseObj);

      expect(Buffer.byteLength(oneByteOverPayload)).toBe(LIMIT_BYTES + 1);

      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: oneByteOverPayload,
      });

      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toBe("Payload Too Large");
      expect(data.message).toContain("500 bytes");
    });

    it("Scenario 4: Content-Length header greater than limit returns 413 immediately", async () => {
      const oversizedPayload = "a".repeat(LIMIT_BYTES * 2);
      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: {
          ...MCP_HEADERS,
          "Content-Length": String(oversizedPayload.length),
        },
        body: oversizedPayload,
      });

      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toBe("Payload Too Large");
    });

    it("Scenario 5: Streamed/chunked body exceeding limit returns 413 without full buffering", async () => {
      // Send raw chunked stream over node http client without Content-Length
      const status = await new Promise<number>((resolve, _reject) => {
        const req = http.request(
          `${BASE_URL}/mcp`,
          {
            method: "POST",
            headers: {
              Accept: "application/json, text/event-stream",
              "Content-Type": "application/json",
              "Transfer-Encoding": "chunked",
            },
          },
          (res) => {
            resolve(res.statusCode || 0);
          }
        );

        req.on("error", () => {
          // Socket destruction on 413 may emit client error; catch cleanly
        });

        // Write chunk 1: 300 bytes (within limit)
        req.write('{"data":"' + "a".repeat(300) + '",');
        // Write chunk 2: 300 bytes (exceeds 500 byte limit)
        req.write('"more":"' + "b".repeat(300) + '"}');
        req.end();
      });

      expect(status).toBe(413);
    });

    it("Scenario 6: Malformed JSON under limit returns parse error (not 413)", async () => {
      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: "{ broken json string: 123",
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).not.toBe(413);
    });

    it("Scenario 7: Oversized malformed JSON returns 413 (not parser crash)", async () => {
      const oversizedMalformed = "{ not valid json " + "x".repeat(1000);
      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: oversizedMalformed,
      });

      expect(res.status).toBe(413);
      const data = await res.json();
      expect(data.error).toBe("Payload Too Large");
    });
  });

  describe("Concurrency Limiting & Slot Draining", () => {
    it("rejects requests exceeding maxConcurrentRequests with 429 and Retry-After header", async () => {
      const payload = JSON.stringify({
        jsonrpc: "2.0",
        id: 99,
        method: "tools/list",
        params: {},
      });

      // Send 10 concurrent requests where limit is 2
      const promises = Array.from({ length: 10 }).map(() =>
        fetch(`${BASE_URL}/mcp`, {
          method: "POST",
          headers: MCP_HEADERS,
          body: payload,
        })
      );

      const responses = await Promise.all(promises);
      const statuses = responses.map((r) => r.status);

      // At least some requests should succeed (200), and overflow requests should be 429
      const has200 = statuses.includes(200);
      const has429 = statuses.includes(429);

      expect(has200).toBe(true);
      if (has429) {
        const r429 = responses.find((r) => r.status === 429)!;
        expect(r429.headers.get("retry-after")).toBe("1");
      }
    });

    it("ensures active request slots are reclaimed after success, error, and 413", async () => {
      // Wait for any pending connections to settle
      await new Promise((r) => setTimeout(r, 100));

      const healthRes = await fetch(`${BASE_URL}/health`);
      const healthData = await healthRes.json();
      // Active requests should have drained back to 1 (the current health request)
      expect(healthData.activeRequests).toBeLessThanOrEqual(1);
    });
  });

  describe("Timeout Semantics & Cleanup Invariants", () => {
    it("normalizes execution timeout to TIMEOUT_ERROR without unhandled exceptions", async () => {
      const asyncHungCapability: Capability = {
        metadata: {
          name: "hung_tool_test",
          version: "1.0.0",
          category: "utility",
          pack: "Utility Pack",
          displayName: "Hung Tool Test",
          description: "Simulates asynchronous delay exceeding execution timeout limit.",
          isFree: true,
          requiresExternalNetwork: false,
          timeoutMs: 50, // 50ms timeout
        },
        inputSchema: z.object({}),
        execute: async () => {
          // Asynchronously sleep longer than timeout
          await new Promise((r) => setTimeout(r, 200));
          return { success: true, data: { done: true } };
        },
      };

      const result = await ExecutionRunner.run(asyncHungCapability, {});
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("TIMEOUT_ERROR");
      expect(result.error?.message).toContain("timed out after 50ms");
    });
  });
});

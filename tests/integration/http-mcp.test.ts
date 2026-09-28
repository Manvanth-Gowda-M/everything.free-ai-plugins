import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { startHttpServer } from "../../src/adapters/mcp/http.js";
import { createDefaultRegistry } from "../../src/capabilities/index.js";

/**
 * Helper to parse either standard JSON or Streamable HTTP SSE responses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseMcpResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (text.includes("data:")) {
    // Extract JSON from SSE data lines
    const dataLines = text
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter((line) => line.length > 0);

    if (dataLines.length > 0) {
      return JSON.parse(dataLines[dataLines.length - 1]);
    }
  }
  return JSON.parse(text);
}

describe("Streamable HTTP MCP Integration (Real HTTP Wire Tests)", () => {
  let server: http.Server;
  const PORT = 3456;
  const BASE_URL = `http://127.0.0.1:${PORT}`;
  const MCP_HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  beforeAll(async () => {
    const registry = createDefaultRegistry();
    server = startHttpServer(registry, { port: PORT, host: "127.0.0.1" });
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

  it("should respond to GET /health", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("everything-free-ai-plugins");
    expect(data.capabilitiesCount).toBe(1);
  });

  it("should respond 404 for unknown endpoints", async () => {
    const res = await fetch(`${BASE_URL}/unknown-path`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Not Found");
  });

  it("should handle MCP initialize handshake via POST /mcp", async () => {
    const initPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "chatgpt-test-client",
          version: "1.0.0",
        },
      },
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(initPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(1);
    expect(data.result).toBeDefined();
    expect(data.result.serverInfo.name).toBe("everything-free-ai-plugins");
    expect(data.result.capabilities.tools).toBeDefined();
  });

  it("should list tools via POST /mcp tools/list", async () => {
    const listPayload = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(listPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(2);
    expect(data.result.tools).toBeInstanceOf(Array);

    const tool = data.result.tools.find(
      (t: { name: string }) => t.name === "json_formatter_validator"
    );
    expect(tool).toBeDefined();
    expect(tool.description).toContain("Validates, formats");
    expect(tool.inputSchema).toBeDefined();
  });

  it("Test 1: Valid JSON validation tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "json_formatter_validator",
        arguments: {
          jsonString: '{"name": "Everything.Free", "free": true}',
          action: "validate",
        },
      },
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(callPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    expect(data.result.content).toBeInstanceOf(Array);

    const output = JSON.parse(data.result.content[0].text);
    expect(output.valid).toBe(true);
    expect(output.action).toBe("validate");
  });

  it("Test 2: Formatting pretty-print tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "json_formatter_validator",
        arguments: {
          jsonString: '{"name":"Everything.Free","version":1}',
          action: "format",
          indent: 2,
        },
      },
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(callPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    const output = JSON.parse(data.result.content[0].text);
    expect(output.valid).toBe(true);
    expect(output.action).toBe("format");
    expect(output.result).toBe('{\n  "name": "Everything.Free",\n  "version": 1\n}');
  });

  it("Test 3: Minification tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "json_formatter_validator",
        arguments: {
          jsonString: '{\n  "name": "Everything.Free",\n  "version": 1\n}',
          action: "minify",
        },
      },
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(callPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    const output = JSON.parse(data.result.content[0].text);
    expect(output.valid).toBe(true);
    expect(output.action).toBe("minify");
    expect(output.result).toBe('{"name":"Everything.Free","version":1}');
  });

  it("Test 4: Inspection tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "json_formatter_validator",
        arguments: {
          jsonString: '{"items": [1, 2, {"nested": true}], "title": "Test"}',
          action: "inspect",
        },
      },
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(callPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    const output = JSON.parse(data.result.content[0].text);
    expect(output.valid).toBe(true);
    expect(output.action).toBe("inspect");
    expect(output.stats.rootType).toBe("object");
    expect(output.stats.maxDepth).toBe(3);
    expect(output.stats.keyCount).toBe(2);
  });

  it("Test 5: Malformed JSON syntax error handling", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "json_formatter_validator",
        arguments: {
          jsonString: '{\n  "unclosed": "brace"\n',
          action: "validate",
        },
      },
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(callPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    const output = JSON.parse(data.result.content[0].text);
    expect(output.valid).toBe(false);
    expect(output.syntaxError).toBeDefined();
    expect(output.syntaxError.snippet).toBeDefined();
  });

  it("Security: Malformed JSON-RPC request", async () => {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: "{ not valid json",
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("Security: Unknown tool call returns structured error without crashing server", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "non_existent_tool_12345",
        arguments: {},
      },
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(callPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    expect(data.error || data.result?.isError).toBeTruthy();
  });

  it("Security: Oversized payload exceeds maximum size limit safely", async () => {
    const hugeString = "a".repeat(1_000_001);
    const callPayload = {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "json_formatter_validator",
        arguments: {
          jsonString: hugeString,
          action: "format",
        },
      },
    };

    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: MCP_HEADERS,
      body: JSON.stringify(callPayload),
    });

    expect(res.status).toBe(200);
    const data = await parseMcpResponse(res);
    expect(data.error || data.result?.isError).toBeTruthy();
  });
});

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

  it("should respond to GET /health with safe diagnostics and 10 capabilities", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("everything-free-ai-plugins");
    expect(data.version).toBe("0.1.0");
    expect(data.capabilitiesCount).toBe(10);
    expect(data.packsCount).toBe(5);
    expect(data.transports).toEqual(["streamable-http", "stdio"]);
    expect(data.timestamp).toBeDefined();
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

  it("should list all 10 tools via POST /mcp tools/list", async () => {
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
    expect(data.result.tools.length).toBe(10);

    const toolNames = data.result.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("json_formatter_validator");
    expect(toolNames).toContain("text_diff_analyzer");
    expect(toolNames).toContain("hash_and_encoding");
    expect(toolNames).toContain("unit_time_converter");
    expect(toolNames).toContain("regex_tester");
    expect(toolNames).toContain("csv_processor");
    expect(toolNames).toContain("markdown_processor");
    expect(toolNames).toContain("jwt_inspector");
    expect(toolNames).toContain("url_analyzer");
    expect(toolNames).toContain("color_converter");
  });

  it("Test 1: JSON Formatter & Validator tool call", async () => {
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

  it("Test 2: Text Diff Analyzer tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "text_diff_analyzer",
        arguments: {
          original: "hello\nworld",
          modified: "hello\nearth",
          mode: "line",
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
    expect(output.identical).toBe(false);
    expect(output.diff).toContain("+ earth");
  });

  it("Test 3: Hash and Encoding tool call (SHA-256)", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "hash_and_encoding",
        arguments: {
          operation: "sha256",
          input: "test",
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
    expect(output.operation).toBe("sha256");
    expect(output.output).toBe("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
  });

  it("Test 4: Unit Time Converter tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "unit_time_converter",
        arguments: {
          mode: "unit",
          value: 100,
          fromUnit: "C",
          toUnit: "F",
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
    expect(output.mode).toBe("unit");
    expect(output.unitResult.toValue).toBe(212);
  });

  it("Test 5: Regex Tester tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "regex_tester",
        arguments: {
          pattern: "\\d+",
          text: "Order 42 and 99",
          operation: "match",
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
    expect(output.matched).toBe(true);
    expect(output.matches).toEqual(["42", "99"]);
  });

  it("Test 6: CSV Processor tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "csv_processor",
        arguments: {
          csvText: "name,score\nAlice,95\nBob,80",
          operation: "inspect",
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
    expect(output.stats.rowCount).toBe(2);
    expect(output.stats.headers).toEqual(["name", "score"]);
  });

  it("Test 7: Markdown Processor tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "markdown_processor",
        arguments: {
          markdownText: "# Overview\n\nSome text.",
          operation: "headings",
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
    expect(output.headings[0].text).toBe("Overview");
  });

  it("Test 8: JWT Inspector tool call", async () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const callPayload = {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "jwt_inspector",
        arguments: { token },
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
    expect(output.validStructure).toBe(true);
    expect(output.header.alg).toBe("HS256");
  });

  it("Test 9: URL Analyzer tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "url_analyzer",
        arguments: { url: "https://everything.free/docs?version=2#setup" },
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
    expect(output.components.protocol).toBe("https");
    expect(output.components.hostname).toBe("everything.free");
    expect(output.components.queryParams.version).toBe("2");
  });

  it("Test 10: Color Converter tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "color_converter",
        arguments: { color: "#D4AF37" },
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
    expect(output.formats.rgb).toBe("rgb(212, 175, 55)");
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
      id: 13,
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
});

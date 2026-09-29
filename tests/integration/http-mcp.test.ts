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

  it("should respond to GET /health with safe diagnostics and 15 capabilities", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("everything-free-ai-plugins");
    expect(data.version).toBe("0.1.0");
    expect(data.capabilitiesCount).toBe(15);
    expect(data.packsCount).toBe(5);
    expect(data.transports).toEqual(["streamable-http", "stdio"]);
    expect(data.timestamp).toBeDefined();
  });

  it("should respond to GET /ready with readiness probe confirmation", async () => {
    const res = await fetch(`${BASE_URL}/ready`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ready");
    expect(data.ready).toBe(true);
    expect(data.service).toBe("everything-free-ai-plugins");
    expect(data.capabilitiesCount).toBe(15);
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

  it("should list all 15 tools via POST /mcp tools/list", async () => {
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
    expect(data.result.tools.length).toBe(15);

    const toolNames = data.result.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain("json_formatter_validator");
    expect(toolNames).toContain("csv_processor");
    expect(toolNames).toContain("sql_processor");
    expect(toolNames).toContain("xml_processor");
    expect(toolNames).toContain("text_diff_analyzer");
    expect(toolNames).toContain("markdown_processor");
    expect(toolNames).toContain("html_processor");
    expect(toolNames).toContain("hash_and_encoding");
    expect(toolNames).toContain("unit_time_converter");
    expect(toolNames).toContain("color_converter");
    expect(toolNames).toContain("cron_analyzer");
    expect(toolNames).toContain("regex_tester");
    expect(toolNames).toContain("jwt_inspector");
    expect(toolNames).toContain("url_analyzer");
    expect(toolNames).toContain("mime_analyzer");
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
  });

  it("Test 3: Hash & Encoding tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "hash_and_encoding",
        arguments: {
          operation: "sha256",
          input: "everything.free",
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
    expect(output.output).toHaveLength(64);
  });

  it("Test 4: Unit & Time Converter tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "unit_time_converter",
        arguments: {
          mode: "unit",
          value: 100,
          fromUnit: "m",
          toUnit: "ft",
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
    expect(output.unitResult.toValue).toBeCloseTo(328.084, 1);
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
          text: "Item 42 and 99",
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
          csvText: "name,age\nAlice,30",
          operation: "to_json",
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
    expect(output.jsonData[0]).toEqual({ name: "Alice", age: 30 });
  });

  it("Test 7: Markdown Processor tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "markdown_processor",
        arguments: {
          markdownText: "# Heading 1\n## Heading 2",
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
    expect(output.headings).toHaveLength(2);
  });

  it("Test 8: JWT Inspector tool call", async () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiaWF0IjoxNTE2MjM5MDIyfQ.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o";
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

  it("Test 11: SQL Processor tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 13,
      method: "tools/call",
      params: {
        name: "sql_processor",
        arguments: {
          sql: "SELECT id, name FROM users WHERE active = 1;",
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
    expect(output.stats.totalTables).toContain("users");
  });

  it("Test 12: XML Processor tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 14,
      method: "tools/call",
      params: {
        name: "xml_processor",
        arguments: {
          xmlString: "<item id='42'><name>Widget</name></item>",
          operation: "to_json",
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
    expect(output.jsonData.item["@id"]).toBe("42");
    expect(output.jsonData.item.name).toBe("Widget");
  });

  it("Test 13: HTML Processor tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 15,
      method: "tools/call",
      params: {
        name: "html_processor",
        arguments: {
          htmlText: "<html><head><title>Hello</title></head><body><p>World</p></body></html>",
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
    expect(output.stats.title).toBe("Hello");
  });

  it("Test 14: Cron Analyzer tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 16,
      method: "tools/call",
      params: {
        name: "cron_analyzer",
        arguments: {
          expression: "*/15 * * * *",
          operation: "explain",
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
    expect(output.explanation).toBe("Every 15 minutes");
  });

  it("Test 15: MIME Analyzer tool call", async () => {
    const callPayload = {
      jsonrpc: "2.0",
      id: 17,
      method: "tools/call",
      params: {
        name: "mime_analyzer",
        arguments: {
          filename: "document.pdf",
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
    expect(output.detectedMimeType).toBe("application/pdf");
    expect(output.category).toBe("document");
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
      id: 18,
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

  describe("MCP Resources over HTTP Wire", () => {
    it("should list resources via resources/list", async () => {
      const payload = {
        jsonrpc: "2.0",
        id: 19,
        method: "resources/list",
        params: {},
      };

      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await parseMcpResponse(res);
      expect(data.result.resources).toBeInstanceOf(Array);
      expect(data.result.resources.length).toBeGreaterThanOrEqual(4);

      const uris = data.result.resources.map((r: { uri: string }) => r.uri);
      expect(uris).toContain("everything-free://capabilities");
      expect(uris).toContain("everything-free://architecture");
    });

    it("should read capability catalog via resources/read", async () => {
      const payload = {
        jsonrpc: "2.0",
        id: 20,
        method: "resources/read",
        params: {
          uri: "everything-free://capabilities",
        },
      };

      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await parseMcpResponse(res);
      expect(data.result.contents).toHaveLength(1);
      const catalog = JSON.parse(data.result.contents[0].text);
      expect(catalog.totalCapabilities).toBe(15);
    });
  });

  describe("MCP Prompts over HTTP Wire", () => {
    it("should list prompts via prompts/list", async () => {
      const payload = {
        jsonrpc: "2.0",
        id: 21,
        method: "prompts/list",
        params: {},
      };

      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await parseMcpResponse(res);
      expect(data.result.prompts).toHaveLength(7);
    });

    it("should get prompt via prompts/get", async () => {
      const payload = {
        jsonrpc: "2.0",
        id: 22,
        method: "prompts/get",
        params: {
          name: "analyze_json",
          arguments: {
            json: '{"test": 123}',
          },
        },
      };

      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: MCP_HEADERS,
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const data = await parseMcpResponse(res);
      expect(data.result.messages).toHaveLength(1);
      expect(data.result.messages[0].content.text).toContain("json_formatter_validator");
    });
  });
});

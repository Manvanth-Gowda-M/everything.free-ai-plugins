import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { createMcpServer } from "../../src/adapters/mcp/server.js";

describe("MCP Server Integration (E2E Client Simulation)", () => {
  let client: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeAll(async () => {
    const registry = createDefaultRegistry();
    const mcpServer = createMcpServer(registry);

    // Create linked in-memory transport pair
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client(
      {
        name: "test-ai-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await Promise.all([
      mcpServer.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterAll(async () => {
    await client.close();
  });

  it("should discover all 10 capabilities via tools/list", async () => {
    const toolsResult = await client.listTools();

    expect(toolsResult).toBeDefined();
    expect(toolsResult.tools).toBeInstanceOf(Array);
    expect(toolsResult.tools.length).toBe(10);

    const toolNames = toolsResult.tools.map((t) => t.name).sort();
    expect(toolNames).toEqual([
      "color_converter",
      "csv_processor",
      "hash_and_encoding",
      "json_formatter_validator",
      "jwt_inspector",
      "markdown_processor",
      "regex_tester",
      "text_diff_analyzer",
      "unit_time_converter",
      "url_analyzer",
    ]);
  });

  it("should execute json_formatter_validator via tools/call", async () => {
    const callResult = await client.callTool({
      name: "json_formatter_validator",
      arguments: {
        jsonString: '{"test": "mcp_call", "count": 42}',
        action: "format",
        indent: 2,
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.valid).toBe(true);
    expect(parsedData.action).toBe("format");
  });

  it("should execute text_diff_analyzer via tools/call", async () => {
    const callResult = await client.callTool({
      name: "text_diff_analyzer",
      arguments: {
        original: "line 1\nline 2",
        modified: "line 1\nline 2 modified",
        mode: "line",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.identical).toBe(false);
    expect(parsedData.diff).toContain("+ line 2 modified");
  });

  it("should execute hash_and_encoding via tools/call", async () => {
    const callResult = await client.callTool({
      name: "hash_and_encoding",
      arguments: {
        operation: "sha256",
        input: "everything.free",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.operation).toBe("sha256");
    expect(parsedData.output).toBeDefined();
  });

  it("should execute unit_time_converter via tools/call", async () => {
    const callResult = await client.callTool({
      name: "unit_time_converter",
      arguments: {
        mode: "unit",
        value: 5,
        fromUnit: "km",
        toUnit: "mi",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.mode).toBe("unit");
    expect(parsedData.unitResult.toValue).toBeCloseTo(3.10686, 2);
  });

  it("should execute regex_tester via tools/call", async () => {
    const callResult = await client.callTool({
      name: "regex_tester",
      arguments: {
        pattern: "(\\w+)",
        text: "hello world",
        operation: "match",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.matched).toBe(true);
    expect(parsedData.matches).toEqual(["hello", "world"]);
  });

  it("should execute csv_processor via tools/call", async () => {
    const callResult = await client.callTool({
      name: "csv_processor",
      arguments: {
        csvText: "id,name,role\n1,Alice,admin\n2,Bob,user",
        operation: "to_json",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.jsonData).toHaveLength(2);
    expect(parsedData.jsonData[0]).toEqual({ id: 1, name: "Alice", role: "admin" });
  });

  it("should execute markdown_processor via tools/call", async () => {
    const callResult = await client.callTool({
      name: "markdown_processor",
      arguments: {
        markdownText: "# Title\n\n## Subtitle\n\n```js\nconsole.log(1);\n```",
        operation: "inspect",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.stats.headingCount).toBe(2);
    expect(parsedData.stats.codeBlockCount).toBe(1);
  });

  it("should execute jwt_inspector via tools/call", async () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiaWF0IjoxNTE2MjM5MDIyfQ.XbPfbIHMI6arZ3Y922BhjWgQzWXcXNrz0ogtVhfEd2o";
    const callResult = await client.callTool({
      name: "jwt_inspector",
      arguments: { token },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.validStructure).toBe(true);
    expect(parsedData.header.alg).toBe("HS256");
    expect(parsedData.subject).toBe("1234567890");
  });

  it("should execute url_analyzer via tools/call", async () => {
    const callResult = await client.callTool({
      name: "url_analyzer",
      arguments: { url: "https://example.com:8080/api/v1/users?role=admin#section" },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.components.protocol).toBe("https");
    expect(parsedData.components.hostname).toBe("example.com");
    expect(parsedData.components.port).toBe("8080");
    expect(parsedData.components.queryParams.role).toBe("admin");
  });

  it("should execute color_converter via tools/call", async () => {
    const callResult = await client.callTool({
      name: "color_converter",
      arguments: { color: "#D4AF37" },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.valid).toBe(true);
    expect(parsedData.formats.rgb).toBe("rgb(212, 175, 55)");
  });
});

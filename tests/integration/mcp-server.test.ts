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

  it("should discover all 5 capabilities via tools/list", async () => {
    const toolsResult = await client.listTools();

    expect(toolsResult).toBeDefined();
    expect(toolsResult.tools).toBeInstanceOf(Array);
    expect(toolsResult.tools.length).toBe(5);

    const toolNames = toolsResult.tools.map((t) => t.name).sort();
    expect(toolNames).toEqual([
      "hash_and_encoding",
      "json_formatter_validator",
      "regex_tester",
      "text_diff_analyzer",
      "unit_time_converter",
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
});

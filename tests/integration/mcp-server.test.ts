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

  it("should discover tools via tools/list", async () => {
    const toolsResult = await client.listTools();

    expect(toolsResult).toBeDefined();
    expect(toolsResult.tools).toBeInstanceOf(Array);
    expect(toolsResult.tools.length).toBeGreaterThanOrEqual(1);

    const jsonTool = toolsResult.tools.find(
      (t) => t.name === "json_formatter_validator"
    );
    expect(jsonTool).toBeDefined();
    expect(jsonTool?.description).toContain("Validates, formats");
    expect(jsonTool?.inputSchema).toBeDefined();
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
    expect(callResult.content).toBeInstanceOf(Array);
    expect(callResult.content.length).toBeGreaterThan(0);

    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.valid).toBe(true);
    expect(parsedData.action).toBe("format");
    expect(parsedData.result).toContain('"test": "mcp_call"');
  });

  it("should return syntax diagnostics on invalid JSON tool call", async () => {
    const callResult = await client.callTool({
      name: "json_formatter_validator",
      arguments: {
        jsonString: '{"broken": }',
        action: "validate",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.valid).toBe(false);
    expect(parsedData.syntaxError).toBeDefined();
    expect(parsedData.syntaxError.line).toBe(1);
  });
});

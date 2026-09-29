import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createDefaultRegistry } from "../../src/capabilities/index.js";
import { createMcpServer } from "../../src/adapters/mcp/server.js";
import { GeminiAdapter } from "../../src/adapters/gemini/adapter.js";
import { ExecutionRunner } from "../../src/core/execution.js";

describe("Cross-Platform Adapter Contract Tests", () => {
  const registry = createDefaultRegistry();
  const geminiAdapter = new GeminiAdapter(registry);
  let mcpClient: Client;
  let clientTransport: InMemoryTransport;
  let serverTransport: InMemoryTransport;

  beforeAll(async () => {
    const mcpServer = createMcpServer(registry);
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    mcpClient = new Client(
      {
        name: "test-cross-adapter-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await Promise.all([
      mcpServer.connect(serverTransport),
      mcpClient.connect(clientTransport),
    ]);
  });

  afterAll(async () => {
    await mcpClient.close();
  });

  it("guarantees identical capability discovery across MCP and Gemini adapters", async () => {
    const mcpTools = await mcpClient.listTools();
    const geminiTools = geminiAdapter.getToolDeclarations();

    const mcpNames = mcpTools.tools.map((t) => t.name).sort();
    const geminiNames = geminiTools[0].functionDeclarations.map((f) => f.name).sort();
    const registryNames = registry.getAll().map((c) => c.metadata.name).sort();

    expect(mcpNames).toHaveLength(15);
    expect(geminiNames).toHaveLength(15);
    expect(registryNames).toHaveLength(15);

    expect(mcpNames).toEqual(registryNames);
    expect(geminiNames).toEqual(registryNames);
  });

  describe("Invariance: Same capability + Same arguments = Same core result", () => {
    it("produces identical result for json_formatter_validator format call", async () => {
      const args = {
        jsonString: '{"test": 123, "active": true}',
        action: "format",
        indent: 2,
      };

      // 1. Direct Engine Execution
      const directCapability = registry.get("json_formatter_validator")!;
      const directResult = await ExecutionRunner.run(directCapability, args);

      // 2. MCP Adapter Execution
      const mcpResult = await mcpClient.callTool({
        name: "json_formatter_validator",
        arguments: args,
      });
      const mcpData = JSON.parse((mcpResult.content[0] as { type: string; text: string }).text);

      // 3. Gemini Adapter Execution
      const geminiResult = await geminiAdapter.executeTool("json_formatter_validator", args);
      const geminiData = geminiResult.response.result;

      expect(directResult.success).toBe(true);
      expect(geminiResult.response.ok).toBe(true);

      // Assert core data equality across all three
      expect(mcpData).toEqual(directResult.data);
      expect(geminiData).toEqual(directResult.data);
    });

    it("produces identical result for sql_processor inspect call", async () => {
      const args = {
        sql: "SELECT u.id, u.email FROM users u JOIN orders o ON u.id = o.user_id WHERE u.active = 1;",
        operation: "inspect",
      };

      const directResult = await ExecutionRunner.run(registry.get("sql_processor")!, args);
      const mcpResult = await mcpClient.callTool({ name: "sql_processor", arguments: args });
      const mcpData = JSON.parse((mcpResult.content[0] as { type: string; text: string }).text);
      const geminiResult = await geminiAdapter.executeTool("sql_processor", args);

      expect(directResult.success).toBe(true);
      expect(mcpData).toEqual(directResult.data);
      expect(geminiResult.response.result).toEqual(directResult.data);
    });

    it("produces identical result for hash_and_encoding sha256 call", async () => {
      const args = {
        operation: "sha256",
        input: "Cross-Platform Adapter Test Payload",
      };

      const directResult = await ExecutionRunner.run(registry.get("hash_and_encoding")!, args);
      const mcpResult = await mcpClient.callTool({ name: "hash_and_encoding", arguments: args });
      const mcpData = JSON.parse((mcpResult.content[0] as { type: string; text: string }).text);
      const geminiResult = await geminiAdapter.executeTool("hash_and_encoding", args);

      expect(directResult.success).toBe(true);
      expect(mcpData).toEqual(directResult.data);
      expect(geminiResult.response.result).toEqual(directResult.data);
    });

    it("produces identical result for cron_analyzer explain call", async () => {
      const args = {
        expression: "*/30 9-17 * * 1-5",
        operation: "explain",
      };

      const directResult = await ExecutionRunner.run(registry.get("cron_analyzer")!, args);
      const mcpResult = await mcpClient.callTool({ name: "cron_analyzer", arguments: args });
      const mcpData = JSON.parse((mcpResult.content[0] as { type: string; text: string }).text);
      const geminiResult = await geminiAdapter.executeTool("cron_analyzer", args);

      expect(directResult.success).toBe(true);
      expect(mcpData).toEqual(directResult.data);
      expect(geminiResult.response.result).toEqual(directResult.data);
    });

    it("produces identical normalized error on invalid input", async () => {
      const invalidArgs = {
        mode: "unit",
        value: 100,
        fromUnit: "not_a_valid_unit_name",
        toUnit: "m",
      };

      const directResult = await ExecutionRunner.run(registry.get("unit_time_converter")!, invalidArgs);
      const geminiResult = await geminiAdapter.executeTool("unit_time_converter", invalidArgs);

      expect(directResult.success).toBe(false);
      expect(geminiResult.response.ok).toBe(false);
      expect(geminiResult.response.error?.code).toBe(directResult.error?.code);
    });

    it("handles unknown capabilities gracefully without crashing", async () => {
      const geminiResult = await geminiAdapter.executeTool("unknown_capability_123", {});
      expect(geminiResult.response.ok).toBe(false);
      expect(geminiResult.response.error?.code).toBe("CAPABILITY_NOT_FOUND");
    });
  });
});

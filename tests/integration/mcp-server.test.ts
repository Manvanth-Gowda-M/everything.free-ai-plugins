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

    await Promise.all([mcpServer.connect(serverTransport), client.connect(clientTransport)]);
  });

  afterAll(async () => {
    await client.close();
  });

  it("should discover all 15 capabilities via tools/list", async () => {
    const toolsResult = await client.listTools();

    expect(toolsResult).toBeDefined();
    expect(toolsResult.tools).toBeInstanceOf(Array);
    expect(toolsResult.tools.length).toBe(15);

    const toolNames = toolsResult.tools.map((t) => t.name).sort();
    expect(toolNames).toEqual([
      "color_converter",
      "cron_analyzer",
      "csv_processor",
      "hash_and_encoding",
      "html_processor",
      "json_formatter_validator",
      "jwt_inspector",
      "markdown_processor",
      "mime_analyzer",
      "regex_tester",
      "sql_processor",
      "text_diff_analyzer",
      "unit_time_converter",
      "url_analyzer",
      "xml_processor",
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

  it("should execute sql_processor via tools/call", async () => {
    const callResult = await client.callTool({
      name: "sql_processor",
      arguments: {
        sql: "select id, email from users where active = true limit 5;",
        operation: "format",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.operation).toBe("format");
    expect(parsedData.result).toContain("SELECT");
    expect(parsedData.result).toContain("WHERE");
  });

  it("should execute xml_processor via tools/call", async () => {
    const callResult = await client.callTool({
      name: "xml_processor",
      arguments: {
        xmlString: "<notes><note id='1'><text>Hello</text></note></notes>",
        operation: "to_json",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.valid).toBe(true);
    expect(parsedData.jsonData.notes).toBeDefined();
  });

  it("should execute html_processor via tools/call", async () => {
    const callResult = await client.callTool({
      name: "html_processor",
      arguments: {
        htmlText: "<html><head><title>Test Page</title></head><body><h1>Heading</h1></body></html>",
        operation: "inspect",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.stats.title).toBe("Test Page");
    expect(parsedData.stats.headingsCount.h1).toBe(1);
  });

  it("should execute cron_analyzer via tools/call", async () => {
    const callResult = await client.callTool({
      name: "cron_analyzer",
      arguments: {
        expression: "0 9 * * 1-5",
        operation: "explain",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.valid).toBe(true);
    expect(parsedData.explanation).toContain("09:00");
  });

  it("should execute mime_analyzer via tools/call", async () => {
    const callResult = await client.callTool({
      name: "mime_analyzer",
      arguments: {
        byteSample: "89504E470D0A1A0A",
      },
    });

    expect(callResult).toBeDefined();
    const textContent = (callResult.content[0] as { type: string; text: string }).text;
    const parsedData = JSON.parse(textContent);

    expect(parsedData.detectedMimeType).toBe("image/png");
    expect(parsedData.category).toBe("image");
  });

  describe("MCP Resources Discovery & Retrieval", () => {
    it("discovers static MCP resources via resources/list", async () => {
      const res = await client.listResources();
      expect(res).toBeDefined();
      expect(res.resources).toBeInstanceOf(Array);
      expect(res.resources.length).toBeGreaterThanOrEqual(4);

      const uris = res.resources.map((r) => r.uri);
      expect(uris).toContain("everything-free://capabilities");
      expect(uris).toContain("everything-free://architecture");
      expect(uris).toContain("everything-free://security");
      expect(uris).toContain("everything-free://privacy");
    });

    it("reads capability catalog resource via resources/read", async () => {
      const res = await client.readResource({
        uri: "everything-free://capabilities",
      });

      expect(res).toBeDefined();
      expect(res.contents).toHaveLength(1);
      const content = res.contents[0] as { uri: string; mimeType?: string; text: string };
      expect(content.uri).toBe("everything-free://capabilities");
      expect(content.mimeType).toBe("application/json");

      const catalog = JSON.parse(content.text);
      expect(catalog.service).toBe("everything-free-ai-plugins");
      expect(catalog.totalCapabilities).toBe(15);
      expect(catalog.capabilities).toHaveLength(15);
    });

    it("reads individual capability doc via resource template", async () => {
      const res = await client.readResource({
        uri: "everything-free://capabilities/json_formatter_validator",
      });

      expect(res).toBeDefined();
      expect(res.contents).toHaveLength(1);
      const content = res.contents[0] as { uri: string; mimeType?: string; text: string };
      expect(content.uri).toBe("everything-free://capabilities/json_formatter_validator");
      expect(content.mimeType).toBe("text/markdown");
      expect(content.text).toContain("# JSON Formatter & Validator");
      expect(content.text).toContain("Data Pack");
    });

    it("reads architecture and security resources", async () => {
      const archRes = await client.readResource({
        uri: "everything-free://architecture",
      });
      const archContent = archRes.contents[0] as { text: string };
      expect(archContent.text).toContain("# Everything.Free AI Plugins Architecture");

      const secRes = await client.readResource({
        uri: "everything-free://security",
      });
      const secContent = secRes.contents[0] as { text: string };
      expect(secContent.text).toContain("# Everything.Free Security Model");
    });
  });

  describe("MCP Prompts Discovery & Retrieval", () => {
    it("discovers all curated prompts via prompts/list", async () => {
      const res = await client.listPrompts();
      expect(res).toBeDefined();
      expect(res.prompts).toHaveLength(7);

      const names = res.prompts.map((p) => p.name).sort();
      expect(names).toEqual([
        "analyze_csv",
        "analyze_json",
        "analyze_text",
        "analyze_web_document",
        "data_transform",
        "developer_debug",
        "schedule_analysis",
      ]);
    });

    it("retrieves analyze_json prompt with arguments via prompts/get", async () => {
      const res = await client.getPrompt({
        name: "analyze_json",
        arguments: {
          json: '{"test": true}',
          operation: "validate",
        },
      });

      expect(res).toBeDefined();
      expect(res.messages).toHaveLength(1);
      const msg = res.messages[0];
      expect(msg.role).toBe("user");
      const text = (msg.content as { type: string; text: string }).text;
      expect(text).toContain("json_formatter_validator");
      expect(text).toContain('{"test": true}');
    });

    it("retrieves schedule_analysis prompt with arguments via prompts/get", async () => {
      const res = await client.getPrompt({
        name: "schedule_analysis",
        arguments: {
          expression: "0 0 1 1 *",
        },
      });

      expect(res).toBeDefined();
      expect(res.messages).toHaveLength(1);
      const text = (res.messages[0].content as { type: string; text: string }).text;
      expect(text).toContain("cron_analyzer");
      expect(text).toContain("0 0 1 1 *");
    });
  });
});

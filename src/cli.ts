import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createDefaultRegistry } from "./capabilities/index.js";
import { createMcpServer } from "./adapters/mcp/server.js";
import { startHttpServer } from "./adapters/mcp/http.js";
import { VERSION, DISPLAY_NAME } from "./version.js";

export interface CliConfig {
  transport: "http" | "stdio";
  port: number;
  host: string;
  help: boolean;
  version: boolean;
  unknownArgs: string[];
}

export const HELP_TEXT = `${DISPLAY_NAME} (v${VERSION})
100% Free, Local-First AI Capability Platform & Model Context Protocol (MCP) Server.

Usage: everything-free [options] [command]

Commands:
  http                   Start Streamable HTTP MCP server (default)
  stdio                  Start stdio transport MCP server (for CLI/Inspector)

Options:
  -t, --transport <type> Server transport: 'http' or 'stdio' (default: 'http')
  -p, --port <number>    Port for HTTP server (default: 3000 or $PORT)
  -h, --host <string>    Host interface for HTTP server (default: '127.0.0.1' or $HOST)
  -s, --stdio            Shorthand for --transport stdio
  -v, --version          Show version information
  --help                 Show this help menu

Examples:
  $ everything-free
  $ everything-free stdio
  $ everything-free --transport stdio
  $ everything-free --port 8080 --host 127.0.0.1
`;

export function printHelp(): void {
  console.log(HELP_TEXT);
}

export function printVersion(): void {
  console.log(`${DISPLAY_NAME} v${VERSION}`);
}

/**
 * Parses raw command line arguments into a structured CliConfig.
 */
export function parseCliArgs(args: string[] = process.argv.slice(2)): CliConfig {
  let transport: "http" | "stdio" = "http";
  let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  let host = process.env.HOST || "127.0.0.1";
  let help = false;
  let version = false;
  const unknownArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "stdio" || arg === "--stdio" || arg === "-s") {
      transport = "stdio";
    } else if (arg === "http" || arg === "--http") {
      transport = "http";
    } else if (arg === "--transport" || arg === "-t") {
      const next = args[++i];
      if (next === "stdio" || next === "http") {
        transport = next;
      } else {
        throw new Error(`Unknown transport: ${next}`);
      }
    } else if (arg === "--port" || arg === "-p") {
      const rawPort = args[++i];
      const parsedPort = parseInt(rawPort, 10);
      if (isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
        throw new Error(`Invalid port number: ${rawPort}`);
      }
      port = parsedPort;
    } else if (arg === "--host") {
      host = args[++i] || host;
    } else if (arg === "--help" || arg === "-h" || arg === "help") {
      help = true;
    } else if (arg === "--version" || arg === "-v" || arg === "version") {
      version = true;
    } else {
      unknownArgs.push(arg);
    }
  }

  return {
    transport,
    port,
    host,
    help,
    version,
    unknownArgs,
  };
}

/**
 * Main CLI execution entry point.
 */
export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  const config = parseCliArgs(args);

  if (config.version) {
    printVersion();
    return;
  }

  if (config.help) {
    printHelp();
    return;
  }

  if (config.unknownArgs.length > 0) {
    throw new Error(
      `Unknown argument(s): ${config.unknownArgs.join(", ")}. Run 'everything-free --help' for usage.`
    );
  }

  const registry = createDefaultRegistry();

  if (config.transport === "stdio") {
    const server = createMcpServer(registry);
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } else {
    startHttpServer(registry, { port: config.port, host: config.host });
  }
}

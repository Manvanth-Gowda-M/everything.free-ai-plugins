import { createDefaultRegistry } from "./capabilities/index.js";
import { startHttpServer } from "./adapters/mcp/http.js";
import { startStdioServer } from "./adapters/mcp/stdio.js";

async function main() {
  const isStdio =
    process.argv.includes("--stdio") ||
    process.env.MCP_TRANSPORT === "stdio";

  const registry = createDefaultRegistry();

  if (isStdio) {
    await startStdioServer(registry);
  } else {
    startHttpServer(registry);
  }
}

main().catch((err) => {
  process.stderr.write(`[Everything.Free] Fatal startup error: ${err}\n`);
  process.exit(1);
});

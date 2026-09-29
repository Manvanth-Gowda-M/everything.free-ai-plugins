#!/usr/bin/env node
import { runCli } from "./cli.js";

runCli().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[Everything.Free] Error: ${message}\n`);
  process.exit(1);
});

import { describe, it, expect, vi } from "vitest";
import { parseCliArgs, printHelp, printVersion } from "../../src/cli.js";
import { VERSION } from "../../src/version.js";

describe("CLI Argument Parser Unit Tests", () => {
  it("defaults to HTTP transport on 127.0.0.1:3000 when no arguments are provided", () => {
    const config = parseCliArgs([]);
    expect(config.transport).toBe("http");
    expect(config.port).toBe(3000);
    expect(config.host).toBe("127.0.0.1");
    expect(config.help).toBe(false);
    expect(config.version).toBe(false);
  });

  it("parses stdio positional argument", () => {
    const config = parseCliArgs(["stdio"]);
    expect(config.transport).toBe("stdio");
  });

  it("parses --stdio and -s flags", () => {
    const config1 = parseCliArgs(["--stdio"]);
    expect(config1.transport).toBe("stdio");

    const config2 = parseCliArgs(["-s"]);
    expect(config2.transport).toBe("stdio");
  });

  it("parses --transport stdio option", () => {
    const config = parseCliArgs(["--transport", "stdio"]);
    expect(config.transport).toBe("stdio");
  });

  it("parses http positional argument and custom port/host", () => {
    const config = parseCliArgs(["http", "--port", "4000", "--host", "0.0.0.0"]);
    expect(config.transport).toBe("http");
    expect(config.port).toBe(4000);
    expect(config.host).toBe("0.0.0.0");
  });

  it("parses -p short flag for port", () => {
    const config = parseCliArgs(["-p", "8080"]);
    expect(config.port).toBe(8080);
    expect(config.transport).toBe("http");
  });

  it("parses --help and -h flags", () => {
    const config1 = parseCliArgs(["--help"]);
    expect(config1.help).toBe(true);

    const config2 = parseCliArgs(["-h"]);
    expect(config2.help).toBe(true);
  });

  it("parses --version and -v flags", () => {
    const config1 = parseCliArgs(["--version"]);
    expect(config1.version).toBe(true);

    const config2 = parseCliArgs(["-v"]);
    expect(config2.version).toBe(true);
  });

  it("throws descriptive error on invalid port", () => {
    expect(() => parseCliArgs(["--port", "invalid"])).toThrow("Invalid port number");
    expect(() => parseCliArgs(["--port", "70000"])).toThrow("Invalid port number");
    expect(() => parseCliArgs(["--port", "-1"])).toThrow("Invalid port number");
  });

  it("throws descriptive error on invalid transport", () => {
    expect(() => parseCliArgs(["--transport", "ftp"])).toThrow("Unknown transport: ftp");
  });

  it("outputs correct help and version strings", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    printHelp();
    expect(consoleSpy).toHaveBeenCalled();
    const helpOutput = consoleSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(helpOutput).toContain("Usage: everything-free [options]");
    expect(helpOutput).toContain("--transport");
    expect(helpOutput).toContain("--port");
    expect(helpOutput).toContain("--stdio");

    consoleSpy.mockClear();
    printVersion();
    expect(consoleSpy).toHaveBeenCalledWith(`Everything.Free AI Plugins v${VERSION}`);

    consoleSpy.mockRestore();
  });

  it("handles unknown arguments cleanly in runCli", async () => {
    const { runCli } = await import("../../src/cli.js");
    await expect(runCli(["--bogus-flag"])).rejects.toThrow("Unknown argument(s): --bogus-flag");
  });

  it("executes version and help cleanly in runCli without throwing", async () => {
    const { runCli } = await import("../../src/cli.js");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await expect(runCli(["--version"])).resolves.toBeUndefined();
    await expect(runCli(["--help"])).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });
});

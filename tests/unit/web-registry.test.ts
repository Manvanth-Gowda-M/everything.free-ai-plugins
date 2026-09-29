import { describe, it, expect } from "vitest";
import {
  getAllPlugins,
  getPluginBySlug,
  getFeaturedPlugins,
  getPluginsByCategory,
} from "../../web/src/registry/plugins.js";
import { CATEGORIES, getCategoryById } from "../../web/src/registry/categories.js";
import { PLATFORMS, getPlatformById } from "../../web/src/registry/platforms.js";

describe("Everything.Free Web Registry & Architecture Invariants", () => {
  it("should contain the flagship Everything.Free AI Plugins entry (#001)", () => {
    const plugin = getPluginBySlug("everything-free-ai-plugins");
    expect(plugin).toBeDefined();
    if (!plugin) return;

    expect(plugin.name).toBe("Everything.Free AI Plugins");
    expect(plugin.version).toBe("0.1.0");
    expect(plugin.isOpenSource).toBe(true);
    expect(plugin.pricing).toBe("open_source");
    expect(plugin.status).toBe("available");
    expect(plugin.isFeatured).toBe(true);
  });

  it("should accurately reflect all 15 local capabilities across 5 packs", () => {
    const plugin = getPluginBySlug("everything-free-ai-plugins");
    expect(plugin).toBeDefined();
    if (!plugin) return;

    expect(plugin.packs.length).toBe(5);
    const totalCapabilities = plugin.packs.reduce((acc, p) => acc + p.capabilities.length, 0);
    expect(totalCapabilities).toBe(15);

    // Verify all 5 packs correspond to engine packs
    const packIds = plugin.packs.map((p) => p.id);
    expect(packIds).toContain("data");
    expect(packIds).toContain("text");
    expect(packIds).toContain("encoding");
    expect(packIds).toContain("utility");
    expect(packIds).toContain("developer");

    // All capabilities must be local offline tools
    plugin.packs.forEach((pack) => {
      pack.capabilities.forEach((cap) => {
        expect(cap.isOffline).toBe(true);
        expect(cap.operations.length).toBeGreaterThan(0);
      });
    });
  });

  it("should match technical MCP specifications (15 caps, 19 resources, 7 prompts)", () => {
    const plugin = getPluginBySlug("everything-free-ai-plugins");
    expect(plugin).toBeDefined();
    if (!plugin) return;

    expect(plugin.mcpInfo.capabilitiesCount).toBe(15);
    expect(plugin.mcpInfo.resourcesCount).toBe(19);
    expect(plugin.mcpInfo.promptsCount).toBe(7);
    expect(plugin.mcpInfo.transport).toEqual(["streamable-http", "stdio"]);
    expect(plugin.mcpInfo.httpEndpoint).toBe("http://localhost:3456/mcp");
  });

  it("should provide valid platform connections with configuration snippets", () => {
    const plugin = getPluginBySlug("everything-free-ai-plugins");
    expect(plugin).toBeDefined();
    if (!plugin) return;

    const platformIds = plugin.platforms.map((p) => p.platformId);
    expect(platformIds).toContain("chatgpt");
    expect(platformIds).toContain("claude");
    expect(platformIds).toContain("gemini");
    expect(platformIds).toContain("cursor");
    expect(platformIds).toContain("mcp-cli");

    const claudePlatform = plugin.platforms.find((p) => p.platformId === "claude");
    expect(claudePlatform?.setupSnippet).toContain("everything.free-ai-plugins");
    expect(claudePlatform?.setupSnippet).toContain("--stdio");
  });

  it("should enforce privacy guarantees (zero network egress & local execution)", () => {
    const plugins = getAllPlugins();
    plugins.forEach((plugin) => {
      expect(plugin.privacy.localExecutionOnly).toBe(true);
      expect(plugin.privacy.networkEgress).toBe(false);
      expect(plugin.privacy.telemetryPresent).toBe(false);
      expect(plugin.privacy.openSourceVerified).toBe(true);
    });
  });

  it("should define valid categories and platform metadata", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(8);
    const devCat = getCategoryById("developer");
    expect(devCat).toBeDefined();
    expect(devCat?.name).toBe("Developer");

    expect(PLATFORMS.length).toBeGreaterThanOrEqual(5);
    const chatgpt = getPlatformById("chatgpt");
    expect(chatgpt).toBeDefined();
    expect(chatgpt?.name).toBe("ChatGPT");
    expect(chatgpt?.requiresRemoteServer).toBe(true);
    expect(chatgpt?.transport).toBe("streamable_http");
    expect(chatgpt?.supported).toBe(true);

    const claude = getPlatformById("claude");
    expect(claude).toBeDefined();
    expect(claude?.requiresRemoteServer).toBe(false);
    expect(claude?.transport).toBe("stdio");
  });

  it("should enforce honest connection requirements for ChatGPT and Claude", () => {
    const plugin = getPluginBySlug("everything-free-ai-plugins");
    expect(plugin).toBeDefined();
    if (!plugin) return;

    const chatgptConn = plugin.platforms.find((p) => p.platformId === "chatgpt");
    expect(chatgptConn).toBeDefined();
    expect(chatgptConn?.requiresRemoteServer).toBe(true);
    expect(chatgptConn?.requiresManualSetup).toBe(true);
    expect(chatgptConn?.requiresAuthentication).toBe(false);

    const claudeConn = plugin.platforms.find((p) => p.platformId === "claude");
    expect(claudeConn).toBeDefined();
    expect(claudeConn?.requiresRemoteServer).toBe(false);
    expect(claudeConn?.requiresManualSetup).toBe(true);
  });

  it("should support extensible category and featured filtering", () => {
    const featured = getFeaturedPlugins();
    expect(featured.length).toBeGreaterThan(0);
    expect(featured[0].slug).toBe("everything-free-ai-plugins");

    const devPlugins = getPluginsByCategory("developer");
    expect(devPlugins.length).toBeGreaterThan(0);
  });

  it("should provide environment-aware connection profiles and hosting status", () => {
    const plugin = getPluginBySlug("everything-free-ai-plugins");
    expect(plugin).toBeDefined();
    if (!plugin) return;

    expect(plugin.hostingStatus).toBeDefined();
    expect(["LOCAL_ONLY", "HOSTED", "COMING_SOON"]).toContain(plugin.hostingStatus);

    expect(plugin.connectionProfiles).toBeDefined();
    if (!plugin.connectionProfiles) return;

    // Local profile
    expect(plugin.connectionProfiles.local.endpoint).toBe("http://localhost:3456/mcp");
    expect(plugin.connectionProfiles.local.command).toBe("npx");
    expect(plugin.connectionProfiles.local.args).toContain("--stdio");

    // Hosted profile
    expect(plugin.connectionProfiles.hosted.endpoint).toBeDefined();
    expect(plugin.connectionProfiles.hosted.transport).toBe("streamable_http");
    expect(plugin.connectionProfiles.hosted.privacyNotice).toContain(
      "Everything.Free does not intentionally store MCP tool payloads"
    );

    // Manual profile
    expect(plugin.connectionProfiles.manual.stdioConfig).toContain("mcpServers");
  });
});

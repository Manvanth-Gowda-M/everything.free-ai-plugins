import { describe, it, expect } from "vitest";
import { UrlAnalyzerCapability } from "../../src/capabilities/developer/url-analyzer.js";

describe("UrlAnalyzerCapability", () => {
  const capability = new UrlAnalyzerCapability();

  it("should decompose full URL into structured components", async () => {
    const res = await capability.execute({
      url: "https://user:pass@api.everything.free:8443/v1/search?q=mcp&filter=free&filter=local#results",
    });

    expect(res.success).toBe(true);
    expect(res.data?.components.isValid).toBe(true);
    expect(res.data?.components.protocol).toBe("https");
    expect(res.data?.components.hostname).toBe("api.everything.free");
    expect(res.data?.components.port).toBe("8443");
    expect(res.data?.components.pathname).toBe("/v1/search");
    expect(res.data?.components.username).toBe("user");
    expect(res.data?.components.hasPassword).toBe(true);
    expect(res.data?.components.hash).toBe("results");
    expect(res.data?.components.queryParams.q).toBe("mcp");
    expect(res.data?.components.queryParams.filter).toEqual(["free", "local"]);
    expect(res.data?.components.pathSegments).toEqual(["v1", "search"]);
  });

  it("should identify IPv4 addresses without network connection", async () => {
    const res = await capability.execute({
      url: "http://127.0.0.1:3000/health",
    });

    expect(res.success).toBe(true);
    expect(res.data?.components.isIpAddress).toBe(true);
    expect(res.data?.components.hostname).toBe("127.0.0.1");
  });

  it("should handle URLs without scheme by prepending https://", async () => {
    const res = await capability.execute({
      url: "github.com/Quilonix/everything.free-ai-plugins",
    });

    expect(res.success).toBe(true);
    expect(res.data?.components.hostname).toBe("github.com");
    expect(res.data?.components.pathname).toBe("/Quilonix/everything.free-ai-plugins");
  });
});

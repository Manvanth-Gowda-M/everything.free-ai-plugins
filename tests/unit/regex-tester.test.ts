import { describe, it, expect } from "vitest";
import { RegexTesterCapability } from "../../src/capabilities/developer/regex-tester.js";

describe("RegexTesterCapability", () => {
  const capability = new RegexTesterCapability();

  it("should test regex patterns (boolean match)", async () => {
    const resPass = await capability.execute({
      pattern: "^[a-z0-9_-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
      text: "hello@everything.free",
      flags: "i",
      operation: "test",
    });

    expect(resPass.success).toBe(true);
    expect(resPass.data?.matched).toBe(true);

    const resFail = await capability.execute({
      pattern: "^\\d+$",
      text: "not a number",
      operation: "test",
    });

    expect(resFail.success).toBe(true);
    expect(resFail.data?.matched).toBe(false);
  });

  it("should find multiple matches", async () => {
    const res = await capability.execute({
      pattern: "\\b\\w{4}\\b",
      text: "The free fast test team",
      flags: "g",
      operation: "match",
    });

    expect(res.success).toBe(true);
    expect(res.data?.matched).toBe(true);
    expect(res.data?.matches).toEqual(["free", "fast", "test", "team"]);
    expect(res.data?.matchCount).toBe(4);
  });

  it("should extract capture groups", async () => {
    const res = await capability.execute({
      pattern: "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
      text: "Release date: 2026-09-28",
      operation: "extract",
    });

    expect(res.success).toBe(true);
    expect(res.data?.matched).toBe(true);
    expect(res.data?.details).toBeDefined();
    expect(res.data?.details?.[0].groups).toEqual({
      year: "2026",
      month: "09",
      day: "28",
    });
  });

  it("should handle invalid regex pattern safely", async () => {
    const res = await capability.execute({
      pattern: "[unclosed group",
      text: "test",
      operation: "test",
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INVALID_REGEX_PATTERN");
  });

  it("should handle invalid regex flags safely", async () => {
    const res = await capability.execute({
      pattern: "test",
      text: "test",
      flags: "invalid_flags",
      operation: "test",
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INVALID_REGEX_FLAGS");
  });
});

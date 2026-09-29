import { describe, it, expect } from "vitest";
import {
  CronAnalyzerCapability,
  CronAnalyzerOutput,
} from "../../src/capabilities/utility/cron-analyzer.js";
import { ExecutionRunner } from "../../src/core/execution.js";

describe("CronAnalyzerCapability", () => {
  const capability = new CronAnalyzerCapability();

  describe("explain operation", () => {
    it("should explain standard weekday schedule (0 9 * * 1-5)", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "0 9 * * 1-5",
        operation: "explain",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(true);
      expect(res.data?.explanation).toContain("09:00");
      expect(res.data?.explanation).toContain("Monday through Friday");
    });

    it("should explain step expressions (*/15 * * * *)", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "*/15 * * * *",
        operation: "explain",
      });

      expect(res.success).toBe(true);
      expect(res.data?.explanation).toBe("Every 15 minutes");
    });

    it("should explain named month and day aliases (0 12 1 JAN,JUN MON)", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "0 12 1 JAN,JUN MON",
        operation: "explain",
      });

      expect(res.success).toBe(true);
      expect(res.data?.explanation).toContain("12:00");
      expect(res.data?.explanation).toContain("day 1");
      expect(res.data?.explanation).toContain("MON");
      expect(res.data?.explanation).toContain("JAN, JUN");
    });

    it("should explain macro expression (@daily)", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "@daily",
        operation: "explain",
      });

      expect(res.success).toBe(true);
      expect(res.data?.normalizedExpression).toBe("0 0 * * *");
      expect(res.data?.explanation).toContain("00:00");
    });
  });

  describe("parse operation", () => {
    it("should deconstruct fields into numerical sets", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "15,30,45 2-4 1,15 * *",
        operation: "parse",
      });

      expect(res.success).toBe(true);
      const fields = res.data?.fields;
      expect(fields).toBeDefined();
      expect(fields?.minute.values).toEqual([15, 30, 45]);
      expect(fields?.hour.values).toEqual([2, 3, 4]);
      expect(fields?.dayOfMonth.values).toEqual([1, 15]);
      expect(fields?.month.values).toHaveLength(12);
      expect(fields?.dayOfWeek.values).toHaveLength(7);
    });
  });

  describe("validate operation", () => {
    it("should validate correct expressions", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "59 23 31 12 5",
        operation: "validate",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(true);
    });

    it("should reject out of bound minutes (> 59)", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "65 * * * *",
        operation: "validate",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(false);
      expect(res.data?.errors?.[0]).toContain("Minutes: Value '65' out of allowed bounds (0-59)");
    });

    it("should reject invalid field count", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "* * *",
        operation: "validate",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(false);
      expect(res.data?.errors?.[0]).toContain("must have 5 fields");
    });
  });

  describe("next_matches operation", () => {
    it("should deterministically calculate next occurrences from base timestamp", async () => {
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "0 12 * * *",
        operation: "next_matches",
        baseTime: "2025-01-01T00:00:00.000Z",
        count: 3,
      });

      expect(res.success).toBe(true);
      const matches = res.data?.matches;
      expect(matches).toBeDefined();
      expect(matches).toHaveLength(3);
      expect(matches?.[0].iso).toBe("2025-01-01T12:00:00.000Z");
      expect(matches?.[1].iso).toBe("2025-01-02T12:00:00.000Z");
      expect(matches?.[2].iso).toBe("2025-01-03T12:00:00.000Z");
    });

    it("should calculate next weekday occurrences", async () => {
      // 2025-01-03 is Friday. Next weekdays are Mon Jan 6, Tue Jan 7
      const res = await ExecutionRunner.run<CronAnalyzerOutput>(capability, {
        expression: "0 9 * * 1-5",
        operation: "next_matches",
        baseTime: "2025-01-03T10:00:00.000Z",
        count: 2,
      });

      expect(res.success).toBe(true);
      expect(res.data?.matches?.[0].iso).toBe("2025-01-06T09:00:00.000Z");
      expect(res.data?.matches?.[1].iso).toBe("2025-01-07T09:00:00.000Z");
    });
  });
});

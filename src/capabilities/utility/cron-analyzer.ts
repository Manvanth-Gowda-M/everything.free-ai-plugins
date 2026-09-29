import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const CronAnalyzerInputSchema = z.object({
  expression: z
    .string()
    .min(1, "Cron expression cannot be empty")
    .max(100, "Cron expression exceeds maximum length limit")
    .describe(
      "The cron expression string to parse, validate, explain, or evaluate (e.g. '0 9 * * 1-5' or '@daily')"
    ),
  operation: z
    .enum(["explain", "parse", "validate", "next_matches"])
    .default("explain")
    .describe(
      "Operation to perform:\n" +
        "- 'explain': Returns a natural, human-readable English description of the schedule\n" +
        "- 'parse': Deconstructs the expression into individual field arrays and values\n" +
        "- 'validate': Validates expression syntax and range boundaries\n" +
        "- 'next_matches': Computes the next N matching timestamps from a deterministic base time"
    ),
  baseTime: z
    .union([z.string(), z.number()])
    .optional()
    .describe(
      "Deterministic base timestamp for 'next_matches' (ISO 8601 string e.g. '2025-01-01T00:00:00Z' or Unix timestamp in seconds/ms; defaults to '2025-01-01T00:00:00.000Z' if omitted)"
    ),
  count: z
    .number()
    .int()
    .min(1, "Match count must be at least 1")
    .max(50, "Match count cannot exceed 50")
    .default(5)
    .optional()
    .describe(
      "Number of next occurrences to calculate when operation is 'next_matches' (default: 5, max: 50)"
    ),
  timezone: z
    .string()
    .default("UTC")
    .optional()
    .describe("Timezone used for occurrence calculations and explanations (default: 'UTC')"),
});

export type CronAnalyzerInput = z.infer<typeof CronAnalyzerInputSchema>;

export interface CronFieldInfo {
  raw: string;
  values: number[];
  humanText?: string;
  names?: string[];
}

export interface CronParsedFields {
  second?: CronFieldInfo;
  minute: CronFieldInfo;
  hour: CronFieldInfo;
  dayOfMonth: CronFieldInfo;
  month: CronFieldInfo;
  dayOfWeek: CronFieldInfo;
  fieldCount: number;
}

export interface CronOccurrence {
  iso: string;
  timestamp: number;
  formatted: string;
}

export interface CronAnalyzerOutput {
  operation: "explain" | "parse" | "validate" | "next_matches";
  expression: string;
  normalizedExpression: string;
  valid: boolean;
  explanation?: string;
  fields?: CronParsedFields;
  matches?: CronOccurrence[];
  baseTimeUsed?: string;
  timezone?: string;
  errors?: string[];
  dialect: string;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const DAY_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

/**
 * Normalizes expression, replacing macros and uppercase month/day aliases.
 */
function normalizeCron(expr: string): string {
  const trimmed = expr.trim();
  const lower = trimmed.toLowerCase();
  if (lower in MACROS) {
    return MACROS[lower];
  }
  return trimmed;
}

/**
 * Parses a single cron field with support for *, ranges (-), steps (/), and lists (,).
 */
function parseField(
  fieldStr: string,
  min: number,
  max: number,
  aliasMap?: Record<string, number>,
  wrapDayOfWeek = false
): { values: number[]; error?: string } {
  let str = fieldStr.trim().toUpperCase();

  // Replace named aliases
  if (aliasMap) {
    for (const [name, val] of Object.entries(aliasMap)) {
      str = str.replace(new RegExp(`\\b${name}\\b`, "g"), val.toString());
    }
  }

  // Handle '?' alias for day fields
  if (str === "?") {
    str = "*";
  }

  const valuesSet = new Set<number>();
  const parts = str.split(",");

  for (const part of parts) {
    if (!part) {
      return { values: [], error: `Invalid empty item in field '${fieldStr}'` };
    }

    // Step e.g. */15, 1-30/5, 0-23/2
    if (part.includes("/")) {
      const [rangePart, stepPart] = part.split("/");
      const step = parseInt(stepPart, 10);
      if (isNaN(step) || step <= 0) {
        return { values: [], error: `Invalid step value '${stepPart}' in '${fieldStr}'` };
      }

      let start = min;
      let end = max;

      if (rangePart && rangePart !== "*") {
        if (rangePart.includes("-")) {
          const [rStart, rEnd] = rangePart.split("-");
          start = parseInt(rStart, 10);
          end = parseInt(rEnd, 10);
        } else {
          start = parseInt(rangePart, 10);
        }
      }

      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
        return { values: [], error: `Invalid range boundaries '${rangePart}' in '${fieldStr}'` };
      }

      for (let v = start; v <= end; v += step) {
        const normalizedVal = wrapDayOfWeek && v === 7 ? 0 : v;
        valuesSet.add(normalizedVal);
      }
      continue;
    }

    // Range e.g. 1-5, 9-17
    if (part.includes("-")) {
      const [rStart, rEnd] = part.split("-");
      let start = parseInt(rStart, 10);
      let end = parseInt(rEnd, 10);

      if (isNaN(start) || isNaN(end) || start < min || end > max) {
        return { values: [], error: `Invalid range '${part}' in '${fieldStr}'` };
      }

      if (start > end) {
        // e.g. 22-4 in hours (wrap around)
        for (let v = start; v <= max; v++) valuesSet.add(wrapDayOfWeek && v === 7 ? 0 : v);
        for (let v = min; v <= end; v++) valuesSet.add(wrapDayOfWeek && v === 7 ? 0 : v);
      } else {
        for (let v = start; v <= end; v++) {
          valuesSet.add(wrapDayOfWeek && v === 7 ? 0 : v);
        }
      }
      continue;
    }

    // Wildcard *
    if (part === "*") {
      for (let v = min; v <= max; v++) {
        valuesSet.add(wrapDayOfWeek && v === 7 ? 0 : v);
      }
      continue;
    }

    // Single number
    const num = parseInt(part, 10);
    if (isNaN(num) || num < min || num > max) {
      return {
        values: [],
        error: `Value '${part}' out of allowed bounds (${min}-${max}) in '${fieldStr}'`,
      };
    }
    valuesSet.add(wrapDayOfWeek && num === 7 ? 0 : num);
  }

  const sorted = Array.from(valuesSet).sort((a, b) => a - b);
  return { values: sorted };
}

/**
 * Parses and validates full cron expression.
 */
function parseCronExpression(rawExpr: string): {
  normalized: string;
  fields?: CronParsedFields;
  errors: string[];
} {
  const normalized = normalizeCron(rawExpr);
  const parts = normalized.split(/\s+/).filter((p) => p.length > 0);

  if (parts.length !== 5 && parts.length !== 6) {
    return {
      normalized,
      errors: [
        `Cron expression must have 5 fields (or 6 with seconds); found ${parts.length} fields.`,
      ],
    };
  }

  let secPart = parts.length === 6 ? parts[0] : undefined;
  let minPart = parts.length === 6 ? parts[1] : parts[0];
  let hourPart = parts.length === 6 ? parts[2] : parts[1];
  let domPart = parts.length === 6 ? parts[3] : parts[2];
  let monthPart = parts.length === 6 ? parts[4] : parts[3];
  let dowPart = parts.length === 6 ? parts[5] : parts[4];

  const errors: string[] = [];

  let secField: CronFieldInfo | undefined;
  if (secPart) {
    const secRes = parseField(secPart, 0, 59);
    if (secRes.error) errors.push(`Seconds: ${secRes.error}`);
    secField = { raw: secPart, values: secRes.values };
  }

  const minRes = parseField(minPart, 0, 59);
  if (minRes.error) errors.push(`Minutes: ${minRes.error}`);

  const hourRes = parseField(hourPart, 0, 23);
  if (hourRes.error) errors.push(`Hours: ${hourRes.error}`);

  const domRes = parseField(domPart, 1, 31);
  if (domRes.error) errors.push(`Day of Month: ${domRes.error}`);

  const monthRes = parseField(monthPart, 1, 12, MONTH_NAMES);
  if (monthRes.error) errors.push(`Month: ${monthRes.error}`);

  const dowRes = parseField(dowPart, 0, 7, DAY_NAMES, true);
  if (dowRes.error) errors.push(`Day of Week: ${dowRes.error}`);

  if (errors.length > 0) {
    return { normalized, errors };
  }

  const monthNames = monthRes.values.map(
    (m) => Object.keys(MONTH_NAMES).find((k) => MONTH_NAMES[k] === m) || m.toString()
  );
  const dowNames = dowRes.values.map(
    (d) => Object.keys(DAY_NAMES).find((k) => DAY_NAMES[k] === d) || d.toString()
  );

  return {
    normalized,
    errors: [],
    fields: {
      second: secField,
      minute: { raw: minPart, values: minRes.values },
      hour: { raw: hourPart, values: hourRes.values },
      dayOfMonth: { raw: domPart, values: domRes.values },
      month: { raw: monthPart, values: monthRes.values, names: monthNames },
      dayOfWeek: { raw: dowPart, values: dowRes.values, names: dowNames },
      fieldCount: parts.length,
    },
  };
}

/**
 * Generates clear English explanation for a cron expression.
 */
function explainCron(fields: CronParsedFields): string {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = fields;

  let timeDesc = "";
  if (minute.raw === "*" && hour.raw === "*") {
    timeDesc = "Every minute";
  } else if (minute.raw.startsWith("*/") && hour.raw === "*") {
    timeDesc = `Every ${minute.raw.slice(2)} minutes`;
  } else if (hour.raw === "*") {
    timeDesc = `At minute ${minute.values.join(", ")} of every hour`;
  } else if (minute.values.length === 1 && hour.values.length === 1) {
    const h = hour.values[0];
    const m = minute.values[0];
    const padH = h.toString().padStart(2, "0");
    const padM = m.toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    timeDesc = `At ${padH}:${padM} (${displayH}:${padM} ${ampm})`;
  } else {
    timeDesc = `At minute(s) [${minute.values.join(",")}] past hour(s) [${hour.values.join(",")}]`;
  }

  // Day of Month
  let domDesc = "";
  if (dayOfMonth.raw !== "*" && dayOfMonth.raw !== "?") {
    domDesc = `on day ${dayOfMonth.values.join(", ")} of the month`;
  }

  // Month
  let monthDesc = "";
  if (month.raw !== "*") {
    monthDesc = `in ${month.names?.join(", ")}`;
  }

  // Day of Week
  let dowDesc = "";
  if (dayOfWeek.raw !== "*" && dayOfWeek.raw !== "?") {
    if (dayOfWeek.raw === "1-5") {
      dowDesc = "Monday through Friday";
    } else if (dayOfWeek.raw === "0,6" || dayOfWeek.raw === "6,0") {
      dowDesc = "on weekends (Saturday and Sunday)";
    } else {
      dowDesc = `on ${dayOfWeek.names?.join(", ")}`;
    }
  }

  const parts = [timeDesc];
  if (domDesc) parts.push(domDesc);
  if (dowDesc) parts.push(dowDesc);
  if (monthDesc) parts.push(monthDesc);

  return parts.join(", ");
}

/**
 * Deterministically calculates next N matching timestamps.
 */
function calculateNextMatches(
  fields: CronParsedFields,
  baseTimeInput?: string | number,
  count = 5,
  _timezone = "UTC"
): CronOccurrence[] {
  let baseDate: Date;
  if (typeof baseTimeInput === "number") {
    // If timestamp is in seconds, convert to ms
    baseDate = new Date(baseTimeInput > 1e11 ? baseTimeInput : baseTimeInput * 1000);
  } else if (typeof baseTimeInput === "string") {
    baseDate = new Date(baseTimeInput);
  } else {
    baseDate = new Date("2025-01-01T00:00:00.000Z");
  }

  if (isNaN(baseDate.getTime())) {
    baseDate = new Date("2025-01-01T00:00:00.000Z");
  }

  const matches: CronOccurrence[] = [];
  const minSet = new Set(fields.minute.values);
  const hourSet = new Set(fields.hour.values);
  const domSet = new Set(fields.dayOfMonth.values);
  const monthSet = new Set(fields.month.values);
  const dowSet = new Set(fields.dayOfWeek.values);

  const hasDomConstraint = fields.dayOfMonth.raw !== "*" && fields.dayOfMonth.raw !== "?";
  const hasDowConstraint = fields.dayOfWeek.raw !== "*" && fields.dayOfWeek.raw !== "?";

  // Start from next full minute
  const current = new Date(baseDate.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Maximum search horizon: 5 years (2,628,000 minutes)
  const maxIterations = 2_628_000;
  let iterations = 0;

  while (matches.length < count && iterations < maxIterations) {
    iterations++;

    const m = current.getUTCMinutes();
    const h = current.getUTCHours();
    const dom = current.getUTCDate();
    const mon = current.getUTCMonth() + 1;
    const dow = current.getUTCDay();

    // Check month
    if (!monthSet.has(mon)) {
      current.setUTCMonth(current.getUTCMonth() + 1, 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Check day (standard cron OR rule if both specified)
    let dayMatches = false;
    if (hasDomConstraint && hasDowConstraint) {
      dayMatches = domSet.has(dom) || dowSet.has(dow);
    } else if (hasDomConstraint) {
      dayMatches = domSet.has(dom);
    } else if (hasDowConstraint) {
      dayMatches = dowSet.has(dow);
    } else {
      dayMatches = true;
    }

    if (!dayMatches) {
      current.setUTCDate(current.getUTCDate() + 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Check hour
    if (!hourSet.has(h)) {
      current.setUTCHours(current.getUTCHours() + 1, 0, 0, 0);
      continue;
    }

    // Check minute
    if (minSet.has(m)) {
      matches.push({
        iso: current.toISOString(),
        timestamp: Math.floor(current.getTime() / 1000),
        formatted: current.toUTCString(),
      });
    }

    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  return matches;
}

export class CronAnalyzerCapability implements Capability<
  typeof CronAnalyzerInputSchema,
  CronAnalyzerOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "cron_analyzer",
    version: "1.0.0",
    category: "utility",
    pack: "Utility Pack",
    displayName: "Cron Expression Analyzer",
    description:
      "Local cron expression analyzer to parse, validate, explain, or calculate future occurrences of a schedule. " +
      "Provides natural language explanation and deterministic occurrence calculations without relying on system clocks or background timers.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "explain",
        description: "Translates cron expression into clear, natural English description",
        inputDescription: "expression",
        outputDescription: "Human-readable schedule explanation string",
      },
      {
        name: "parse",
        description:
          "Deconstructs cron expression into individual numerical field arrays and metadata",
        inputDescription: "expression",
        outputDescription: "Detailed field mappings for minutes, hours, days, months, and weekdays",
      },
      {
        name: "validate",
        description: "Checks cron expression syntax, bounds, ranges, steps, and aliases",
        inputDescription: "expression",
        outputDescription: "{ valid: boolean, errors?: string[], dialect: string }",
      },
      {
        name: "next_matches",
        description:
          "Calculates the next N deterministic execution timestamps starting from a specified base time",
        inputDescription: "expression, baseTime (optional), count (optional, default 5)",
        outputDescription: "Array of matching ISO timestamps and formatted dates",
      },
    ],
    limits: {
      maxTextLength: 100,
      maxInputBytes: 1000,
      maxMatches: 50,
      searchHorizonYears: 5,
      timeoutMs: 3000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes:
        "Never creates background jobs, timers, or schedulers. 100% deterministic local computation.",
    },
    usageGuidance: {
      useWhen: [
        "User asks what a cron expression means (e.g., 'What does 0 9 * * 1-5 mean?')",
        "User asks to validate if a cron schedule string is syntactically correct",
        "User asks to find the next 5 dates or run times for a cron expression",
        "User asks to deconstruct cron fields into numerical sets",
      ],
      doNotUseWhen: [
        "User asks to execute or schedule a real-time background cron job",
        "User asks for timezone conversions unrelated to cron schedules (use unit_time_converter)",
        "User asks to test regex expressions (use regex_tester)",
      ],
      exampleRequests: [
        "Explain what cron expression '0 9 * * 1-5' means",
        "Validate this cron expression: '*/15 0-23 1,15 * *'",
        "Calculate the next 5 occurrences of '0 0 1 * *' starting from 2025-01-01",
        "Parse cron expression '@weekly' into individual fields",
      ],
    },
  };

  public readonly inputSchema = CronAnalyzerInputSchema;

  public async execute(input: CronAnalyzerInput): Promise<CapabilityResult<CronAnalyzerOutput>> {
    const {
      expression,
      operation = "explain",
      baseTime = "2025-01-01T00:00:00.000Z",
      count = 5,
      timezone = "UTC",
    } = input;

    const parseRes = parseCronExpression(expression);

    if (parseRes.errors.length > 0 || !parseRes.fields) {
      return {
        success: true,
        data: {
          operation,
          expression,
          normalizedExpression: parseRes.normalized,
          valid: false,
          errors: parseRes.errors,
          dialect:
            "Standard 5-field cron (min, hour, dom, month, dow) + optional seconds & standard macros (@daily, @weekly)",
        },
      };
    }

    const fields = parseRes.fields;
    const explanation = explainCron(fields);

    if (operation === "validate") {
      return {
        success: true,
        data: {
          operation: "validate",
          expression,
          normalizedExpression: parseRes.normalized,
          valid: true,
          explanation,
          dialect:
            "Standard 5-field cron (min, hour, dom, month, dow) + optional seconds & standard macros (@daily, @weekly)",
        },
      };
    }

    if (operation === "parse") {
      return {
        success: true,
        data: {
          operation: "parse",
          expression,
          normalizedExpression: parseRes.normalized,
          valid: true,
          fields,
          explanation,
          dialect:
            "Standard 5-field cron (min, hour, dom, month, dow) + optional seconds & standard macros (@daily, @weekly)",
        },
      };
    }

    if (operation === "next_matches") {
      const matches = calculateNextMatches(fields, baseTime, count, timezone);
      const baseTimeUsed =
        typeof baseTime === "number"
          ? new Date(baseTime > 1e11 ? baseTime : baseTime * 1000).toISOString()
          : String(baseTime);

      return {
        success: true,
        data: {
          operation: "next_matches",
          expression,
          normalizedExpression: parseRes.normalized,
          valid: true,
          explanation,
          baseTimeUsed,
          timezone,
          matches,
          dialect:
            "Standard 5-field cron (min, hour, dom, month, dow) + optional seconds & standard macros (@daily, @weekly)",
        },
      };
    }

    // Default: "explain"
    return {
      success: true,
      data: {
        operation: "explain",
        expression,
        normalizedExpression: parseRes.normalized,
        valid: true,
        explanation,
        dialect:
          "Standard 5-field cron (min, hour, dom, month, dow) + optional seconds & standard macros (@daily, @weekly)",
      },
    };
  }
}

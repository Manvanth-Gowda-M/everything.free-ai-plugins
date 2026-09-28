import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

// Unit definitions & conversion factors to base unit
const LENGTH_FACTORS: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

const MASS_FACTORS: Record<string, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

const VOLUME_FACTORS: Record<string, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  gal: 3785.41,
};

const SPEED_FACTORS: Record<string, number> = {
  "m/s": 1,
  "km/h": 1 / 3.6,
  mph: 0.44704,
};

const ALL_UNITS = [
  ...Object.keys(LENGTH_FACTORS),
  ...Object.keys(MASS_FACTORS),
  ...Object.keys(VOLUME_FACTORS),
  ...Object.keys(SPEED_FACTORS),
  "C",
  "F",
  "K",
];

export const UnitTimeConverterInputSchema = z.object({
  mode: z
    .enum(["unit", "time"])
    .default("unit")
    .describe("Conversion mode: 'unit' (physical units) or 'time' (date, timestamp, timezone)"),

  // Unit conversion parameters
  value: z
    .number()
    .optional()
    .describe("Numeric value to convert for unit conversion"),
  fromUnit: z
    .string()
    .optional()
    .describe("Source unit (e.g. 'km', 'mi', 'C', 'F', 'kg', 'lb', 'gal', 'mph')"),
  toUnit: z
    .string()
    .optional()
    .describe("Target unit (e.g. 'm', 'ft', 'K', 'g', 'oz', 'l', 'km/h')"),

  // Time conversion parameters
  timeInput: z
    .union([z.string(), z.number()])
    .optional()
    .describe("ISO 8601 string, date string, or numeric Unix timestamp in seconds/milliseconds"),
  targetTimezone: z
    .string()
    .optional()
    .default("UTC")
    .describe("Target IANA timezone (e.g., 'UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata')"),
});

export type UnitTimeConverterInput = z.infer<typeof UnitTimeConverterInputSchema>;

export interface UnitConversionResult {
  fromValue: number;
  fromUnit: string;
  toValue: number;
  toUnit: string;
  family: "length" | "mass" | "temperature" | "volume" | "speed";
  formula?: string;
}

export interface TimeConversionResult {
  input: string | number;
  iso: string;
  timestampSeconds: number;
  timestampMilliseconds: number;
  targetTimezone: string;
  formattedInTimezone: string;
  utcDate: string;
}

export interface UnitTimeConverterOutput {
  mode: "unit" | "time";
  unitResult?: UnitConversionResult;
  timeResult?: TimeConversionResult;
}

/**
 * Converts temperature between C, F, and K.
 */
function convertTemperature(val: number, from: string, to: string): number {
  if (from === to) return val;

  // Convert to Celsius first
  let celsius = val;
  if (from === "F") {
    celsius = ((val - 32) * 5) / 9;
  } else if (from === "K") {
    celsius = val - 273.15;
  }

  // Convert Celsius to target
  if (to === "C") return celsius;
  if (to === "F") return (celsius * 9) / 5 + 32;
  if (to === "K") return celsius + 273.15;

  throw new Error(`Unknown temperature unit: ${to}`);
}

export class UnitTimeConverterCapability
  implements Capability<typeof UnitTimeConverterInputSchema, UnitTimeConverterOutput>
{
  public readonly metadata: CapabilityMetadata = {
    name: "unit_time_converter",
    version: "1.0.0",
    category: "utility",
    displayName: "Unit & Time Converter",
    description:
      "Converts physical measurement units (length, mass, temperature, volume, speed) and parses/transforms Unix timestamps, ISO dates, and timezones. 100% local, free, and privacy-safe.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
  };

  public readonly inputSchema = UnitTimeConverterInputSchema;

  public async execute(
    input: UnitTimeConverterInput
  ): Promise<CapabilityResult<UnitTimeConverterOutput>> {
    const { mode = "unit" } = input;

    if (mode === "unit") {
      const { value, fromUnit, toUnit } = input;

      if (value === undefined || !fromUnit || !toUnit) {
        return {
          success: false,
          error: {
            code: "MISSING_ARGUMENTS",
            message: "Unit conversion requires 'value', 'fromUnit', and 'toUnit'.",
          },
        };
      }

      const from = fromUnit.trim();
      const to = toUnit.trim();

      // Temperature
      if (["C", "F", "K"].includes(from) || ["C", "F", "K"].includes(to)) {
        if (!["C", "F", "K"].includes(from) || !["C", "F", "K"].includes(to)) {
          return {
            success: false,
            error: {
              code: "INCOMPATIBLE_UNITS",
              message: `Cannot convert between temperature unit '${from}' and non-temperature unit '${to}'.`,
            },
          };
        }
        const result = convertTemperature(value, from, to);
        return {
          success: true,
          data: {
            mode: "unit",
            unitResult: {
              fromValue: value,
              fromUnit: from,
              toValue: Number(result.toFixed(6)),
              toUnit: to,
              family: "temperature",
            },
          },
        };
      }

      // Length
      if (from in LENGTH_FACTORS && to in LENGTH_FACTORS) {
        const meters = value * LENGTH_FACTORS[from];
        const converted = meters / LENGTH_FACTORS[to];
        return {
          success: true,
          data: {
            mode: "unit",
            unitResult: {
              fromValue: value,
              fromUnit: from,
              toValue: Number(converted.toFixed(8)),
              toUnit: to,
              family: "length",
            },
          },
        };
      }

      // Mass
      if (from in MASS_FACTORS && to in MASS_FACTORS) {
        const grams = value * MASS_FACTORS[from];
        const converted = grams / MASS_FACTORS[to];
        return {
          success: true,
          data: {
            mode: "unit",
            unitResult: {
              fromValue: value,
              fromUnit: from,
              toValue: Number(converted.toFixed(8)),
              toUnit: to,
              family: "mass",
            },
          },
        };
      }

      // Volume
      if (from in VOLUME_FACTORS && to in VOLUME_FACTORS) {
        const ml = value * VOLUME_FACTORS[from];
        const converted = ml / VOLUME_FACTORS[to];
        return {
          success: true,
          data: {
            mode: "unit",
            unitResult: {
              fromValue: value,
              fromUnit: from,
              toValue: Number(converted.toFixed(8)),
              toUnit: to,
              family: "volume",
            },
          },
        };
      }

      // Speed
      if (from in SPEED_FACTORS && to in SPEED_FACTORS) {
        const ms = value * SPEED_FACTORS[from];
        const converted = ms / SPEED_FACTORS[to];
        return {
          success: true,
          data: {
            mode: "unit",
            unitResult: {
              fromValue: value,
              fromUnit: from,
              toValue: Number(converted.toFixed(8)),
              toUnit: to,
              family: "speed",
            },
          },
        };
      }

      return {
        success: false,
        error: {
          code: "UNSUPPORTED_OR_INCOMPATIBLE_UNIT",
          message: `Incompatible or unsupported unit pair: '${from}' and '${to}'. Supported units: ${ALL_UNITS.join(", ")}`,
        },
      };
    }

    // Time conversion
    const { timeInput, targetTimezone = "UTC" } = input;

    if (timeInput === undefined || timeInput === null || timeInput === "") {
      return {
        success: false,
        error: {
          code: "MISSING_ARGUMENTS",
          message: "Time conversion requires 'timeInput'.",
        },
      };
    }

    let date: Date;

    if (typeof timeInput === "number") {
      // If timestamp is in seconds (e.g. < 100_000_000_000), convert to ms
      const ms = timeInput < 100_000_000_000 ? timeInput * 1000 : timeInput;
      date = new Date(ms);
    } else {
      const num = Number(timeInput);
      if (!isNaN(num) && timeInput.trim() !== "") {
        const ms = num < 100_000_000_000 ? num * 1000 : num;
        date = new Date(ms);
      } else {
        date = new Date(timeInput);
      }
    }

    if (isNaN(date.getTime())) {
      return {
        success: false,
        error: {
          code: "INVALID_DATE_FORMAT",
          message: `Could not parse date/timestamp from input: '${timeInput}'`,
        },
      };
    }

    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: targetTimezone,
        dateStyle: "full",
        timeStyle: "long",
      });

      const formattedInTimezone = formatter.format(date);

      return {
        success: true,
        data: {
          mode: "time",
          timeResult: {
            input: timeInput,
            iso: date.toISOString(),
            timestampSeconds: Math.floor(date.getTime() / 1000),
            timestampMilliseconds: date.getTime(),
            targetTimezone,
            formattedInTimezone,
            utcDate: date.toUTCString(),
          },
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: {
          code: "INVALID_TIMEZONE",
          message: `Invalid or unsupported IANA timezone '${targetTimezone}'. Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
      };
    }
  }
}

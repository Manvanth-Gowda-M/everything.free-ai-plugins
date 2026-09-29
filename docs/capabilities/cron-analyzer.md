# Cron Expression Analyzer (`cron_analyzer`)

## 1. Overview

The `cron_analyzer` capability parses, validates, explains, and calculates deterministic future occurrences of cron schedule expressions without background jobs or system timers.

- **Pack**: `Utility Pack`
- **Category**: `utility`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (deterministic math)
- **Privacy**: `local-only` (Zero retention)
- **External Dependencies**: None

---

## 2. Supported Operations

| Operation      | Description                                                                                   | Output                                                   |
| :------------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| `explain`      | Generates natural English explanation of schedule (e.g. "At 09:00 AM, Monday through Friday") | Human-readable schedule explanation                      |
| `parse`        | Deconstructs expression into numerical sets for minutes, hours, days, months, and weekdays    | Numerical field structures                               |
| `validate`     | Checks syntax, boundaries, ranges, steps, and month/day aliases                               | `{ valid: boolean, errors?: string[], dialect: string }` |
| `next_matches` | Calculates next N matching ISO timestamps starting from a deterministic base time             | Array of next execution dates                            |

---

## 3. Supported Dialect

- **Standard 5-field cron**: `minute (0-59) hour (0-23) day-of-month (1-31) month (1-12) day-of-week (0-7)`
- **Optional 6-field format**: `second minute hour day-of-month month day-of-week`
- **Month Names**: `JAN`, `FEB`, `MAR`, `APR`, `MAY`, `JUN`, `JUL`, `AUG`, `SEP`, `OCT`, `NOV`, `DEC`
- **Weekday Names**: `SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`
- **Standard Macros**: `@yearly`, `@annually`, `@monthly`, `@weekly`, `@daily`, `@midnight`, `@hourly`
- **Operators**: `*` (wildcard), `,` (list), `-` (range), `/` (step), `?` (day wildcard)

---

## 4. Input Schema

```typescript
{
  expression: string; // Required, 1 to 100 characters
  operation?: "explain" | "parse" | "validate" | "next_matches"; // Default: "explain"
  baseTime?: string | number; // Optional, ISO string or Unix timestamp, default: "2025-01-01T00:00:00.000Z"
  count?: number; // Optional, 1 to 50, default: 5
  timezone?: string; // Optional, default: "UTC"
}
```

---

## 5. Security & Determinism

- **No Background Jobs**: Never creates timers, intervals, or background schedulers.
- **Deterministic Occurrence Engine**: Occurrence matching uses explicit base timestamps without relying on machine clock state.

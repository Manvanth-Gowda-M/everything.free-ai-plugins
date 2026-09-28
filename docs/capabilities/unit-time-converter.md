# Unit & Time Converter (`unit_time_converter`)

## 1. Overview
The `unit_time_converter` capability handles physical unit conversions (length, mass, temperature, volume, speed) and date/time/timezone transformations locally using precise conversion factors and standard ECMAScript `Intl.DateTimeFormat`.

* **Category**: `utility`
* **Version**: `1.0.0`
* **Cost**: 100% Free (₹0 / $0)
* **Execution**: 100% Local (built-in JS/Intl)
* **Privacy**: `local-only` (Zero retention, no content logging)
* **External Dependencies**: None
* **Constraint**: Live currency conversions are deliberately omitted to preserve 100% free, local offline functionality.

---

## 2. Supported Unit Families

| Family | Supported Units |
| :--- | :--- |
| **Length** | `mm`, `cm`, `m`, `km`, `in`, `ft`, `yd`, `mi` |
| **Mass** | `mg`, `g`, `kg`, `oz`, `lb` |
| **Temperature** | `C`, `F`, `K` |
| **Volume** | `ml`, `l`, `tsp`, `tbsp`, `cup`, `gal` |
| **Speed** | `m/s`, `km/h`, `mph` |

---

## 3. Time & Timezone Operations

* Converts between Unix timestamps (seconds or milliseconds) and ISO 8601 strings.
* Formats timestamps into any target IANA timezone (e.g., `UTC`, `America/New_York`, `Asia/Kolkata`, `Europe/London`).

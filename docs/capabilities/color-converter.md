# Color Converter (`color_converter`)

## 1. Overview

The `color_converter` capability parses and transforms CSS colors across HEX, RGB, RGBA, HSL, HSLA, HSV, HWB, and OKLCH color spaces. It calculates WCAG 2.1 relative luminance and dark/light contrast metrics.

- **Pack**: `Utility Pack`
- **Category**: `utility`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (in-memory)
- **Privacy**: `local-only` (Zero retention)
- **External Dependencies**: None

---

## 2. Supported Formats & Conversions

- **HEX**: `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`
- **RGB / RGBA**: `rgb(r, g, b)`, `rgba(r, g, b, a)`
- **HSL / HSLA**: `hsl(h, s%, l%)`, `hsla(h, s%, l%, a)`
- **HSV**: `hsv(h, s%, v%)`
- **HWB**: `hwb(h w% b%)`
- **OKLCH**: `oklch(L% C H)`

---

## 3. Input Schema

```typescript
{
  color: string; // Required, 1 to 100 characters (e.g. '#D4AF37', 'rgb(212, 175, 55)')
}
```

---

## 4. Output Example

```json
{
  "input": "#D4AF37",
  "valid": true,
  "formats": {
    "hex": "#D4AF37",
    "hex8": "#D4AF37FF",
    "rgb": "rgb(212, 175, 55)",
    "rgba": "rgba(212, 175, 55, 1)",
    "hsl": "hsl(46, 65%, 52%)",
    "hsla": "hsla(46, 65%, 52%, 1)",
    "hsv": "hsv(46, 74%, 83%)",
    "hwb": "hwb(46 22% 17%)",
    "oklch": "oklch(76.3% 0.222 46)"
  },
  "metrics": {
    "relativeLuminance": 0.4439,
    "isDark": true,
    "alpha": 1
  }
}
```

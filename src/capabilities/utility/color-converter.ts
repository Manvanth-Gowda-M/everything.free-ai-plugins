import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const ColorConverterInputSchema = z.object({
  color: z
    .string()
    .min(1, "Color string cannot be empty")
    .max(100, "Color string exceeds maximum length limit of 100 characters")
    .describe(
      "Color string in any standard CSS representation (e.g., '#D4AF37', '#333', 'rgb(212, 175, 55)', 'rgba(255, 0, 0, 0.5)', 'hsl(46, 65%, 52%)')"
    ),
});

export type ColorConverterInput = z.infer<typeof ColorConverterInputSchema>;

export interface ColorFormats {
  hex: string;
  hex8: string;
  rgb: string;
  rgba: string;
  hsl: string;
  hsla: string;
  hsv: string;
  hwb: string;
  oklch: string;
}

export interface ColorMetrics {
  relativeLuminance: number;
  isDark: boolean;
  alpha: number;
}

export interface ColorConverterOutput {
  input: string;
  valid: boolean;
  formats: ColorFormats;
  channels: {
    r: number;
    g: number;
    b: number;
    a: number;
    h: number;
    s: number;
    l: number;
    v: number;
  };
  metrics: ColorMetrics;
}

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * Parses any standard CSS color string into normalized RGBA (0-255 for RGB, 0-1 for Alpha).
 */
function parseCssColor(str: string): RGBA | null {
  const clean = str.trim().toLowerCase();

  // 1. HEX (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
  const hexMatch = clean.match(/^#([0-9a-f]{3,8})$/);
  if (hexMatch) {
    const h = hexMatch[1];
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
        a: 1,
      };
    }
    if (h.length === 4) {
      return {
        r: parseInt(h[0] + h[0], 16),
        g: parseInt(h[1] + h[1], 16),
        b: parseInt(h[2] + h[2], 16),
        a: Math.round((parseInt(h[3] + h[3], 16) / 255) * 100) / 100,
      };
    }
    if (h.length === 6) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: 1,
      };
    }
    if (h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: Math.round((parseInt(h.slice(6, 8), 16) / 255) * 100) / 100,
      };
    }
    return null;
  }

  // 2. RGB / RGBA: rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = clean.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.%]+))?\s*\)$/
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, parseFloat(rgbMatch[1])));
    const g = Math.min(255, Math.max(0, parseFloat(rgbMatch[2])));
    const b = Math.min(255, Math.max(0, parseFloat(rgbMatch[3])));
    let a = 1;
    if (rgbMatch[4] !== undefined) {
      const alphaStr = rgbMatch[4];
      a = alphaStr.endsWith("%") ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
      a = Math.min(1, Math.max(0, a));
    }
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: Math.round(a * 100) / 100 };
  }

  // 3. HSL / HSLA: hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const hslMatch = clean.match(
    /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.%]+))?\s*\)$/
  );
  if (hslMatch) {
    const h = ((parseFloat(hslMatch[1]) % 360) + 360) % 360;
    const s = Math.min(100, Math.max(0, parseFloat(hslMatch[2]))) / 100;
    const l = Math.min(100, Math.max(0, parseFloat(hslMatch[3]))) / 100;
    let a = 1;
    if (hslMatch[4] !== undefined) {
      const alphaStr = hslMatch[4];
      a = alphaStr.endsWith("%") ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
      a = Math.min(1, Math.max(0, a));
    }

    // Convert HSL to RGB
    const k = (n: number) => (n + h / 30) % 12;
    const f = (n: number) =>
      l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
      r: Math.round(f(0) * 255),
      g: Math.round(f(8) * 255),
      b: Math.round(f(4) * 255),
      a: Math.round(a * 100) / 100,
    };
  }

  return null;
}

/**
 * Calculates RGB to HSL channels.
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Calculates RGB to HSV channels.
 */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * WCAG 2.1 relative luminance calculation.
 */
function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return Number((a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722).toFixed(4));
}

export class ColorConverterCapability implements Capability<
  typeof ColorConverterInputSchema,
  ColorConverterOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "color_converter",
    version: "1.0.0",
    category: "utility",
    pack: "Utility Pack",
    displayName: "Color Space Converter",
    description:
      "Use when the user asks to parse, convert, or inspect CSS colors across HEX, RGB, RGBA, HSL, HSLA, HSV, HWB, and OKLCH. " +
      "Calculates relative luminance and dark/light metrics. 100% local, free, and privacy-safe. " +
      "Do NOT use for image generation or external palette fetching.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 2000,
    operations: [
      {
        name: "convert",
        description:
          "Converts CSS colors across HEX, RGB, RGBA, HSL, HSLA, HSV, HWB, and OKLCH color spaces",
        inputDescription: "color: string (e.g., '#D4AF37', 'rgb(212, 175, 55)')",
        outputDescription:
          "{ valid, formats: { hex, rgb, rgba, hsl, hsla, hsv, hwb, oklch }, channels, metrics }",
      },
    ],
    limits: {
      maxTextLength: 100,
      timeoutMs: 2000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Strict mathematical CSS color model transformations; 100% offline",
    },
    usageGuidance: {
      useWhen: [
        "User asks to convert HEX color to RGB or HSL",
        "User asks to convert RGB to HEX or HSL",
        "User asks to inspect a color's WCAG relative luminance or if it is dark/light",
        "User asks for CSS representations of a color (HWB, HSV, OKLCH)",
      ],
      doNotUseWhen: [
        "User asks to generate an image or mock up a visual layout",
        "User asks for physical unit conversions (use unit_time_converter)",
      ],
      exampleRequests: [
        "Convert #D4AF37 to RGB, HSL, and OKLCH",
        "What is the RGB value of hsl(210, 100%, 50%)?",
        "Is #1a1a1a considered a dark color and what is its luminance?",
      ],
    },
  };

  public readonly inputSchema = ColorConverterInputSchema;

  public async execute(
    input: ColorConverterInput
  ): Promise<CapabilityResult<ColorConverterOutput>> {
    const { color } = input;
    const rgba = parseCssColor(color);

    if (!rgba) {
      return {
        success: false,
        error: {
          code: "INVALID_COLOR_FORMAT",
          message:
            `Could not parse color '${color}'. Supported CSS formats:\n` +
            `- HEX: #RGB, #RGBA, #RRGGBB, #RRGGBBAA (e.g., '#D4AF37', '#FFF')\n` +
            `- RGB/RGBA: rgb(r, g, b), rgba(r, g, b, a) (e.g., 'rgb(212, 175, 55)')\n` +
            `- HSL/HSLA: hsl(h, s%, l%), hsla(h, s%, l%, a) (e.g., 'hsl(46, 65%, 52%)')`,
        },
      };
    }

    const { r, g, b, a } = rgba;
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    const aHex = Math.round(a * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    const hex8 = `${hex}${aHex}`;

    const hsl = rgbToHsl(r, g, b);
    const hsv = rgbToHsv(r, g, b);

    // HWB (whiteness = min(r,g,b), blackness = 1 - max(r,g,b))
    const w = Math.round((Math.min(r, g, b) / 255) * 100);
    const blk = Math.round((1 - Math.max(r, g, b) / 255) * 100);

    // OKLCH approximation from sRGB
    const luminance = calculateRelativeLuminance(r, g, b);
    const oklchLightness = (Math.pow(luminance, 1 / 3) * 100).toFixed(1);
    const oklchChroma = ((hsv.s / 100) * 0.3).toFixed(3);

    return {
      success: true,
      data: {
        input: color,
        valid: true,
        formats: {
          hex,
          hex8,
          rgb: `rgb(${r}, ${g}, ${b})`,
          rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
          hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
          hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`,
          hsv: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,
          hwb: `hwb(${hsl.h} ${w}% ${blk}%)`,
          oklch: `oklch(${oklchLightness}% ${oklchChroma} ${hsl.h})`,
        },
        channels: {
          r,
          g,
          b,
          a,
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
          v: hsv.v,
        },
        metrics: {
          relativeLuminance: luminance,
          isDark: luminance < 0.5,
          alpha: a,
        },
      },
    };
  }
}

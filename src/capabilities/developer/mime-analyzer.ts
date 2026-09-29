import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const MimeAnalyzerInputSchema = z.object({
  filename: z
    .string()
    .max(500, "Filename exceeds maximum length of 500 characters")
    .optional()
    .describe("Filename or filepath to analyze extension from (e.g. 'photo.png', 'archive.tar.gz', 'document.pdf')"),
  declaredMimeType: z
    .string()
    .max(200, "Declared MIME type exceeds maximum length of 200 characters")
    .optional()
    .describe("Declared or claimed MIME type to compare against (e.g. 'image/png', 'application/pdf')"),
  byteSample: z
    .string()
    .max(100_000, "Byte sample exceeds maximum size limit of 100KB")
    .optional()
    .describe("Hex string (e.g. '89504E470D0A1A0A') or Base64 string representing leading header bytes of the file"),
  sampleEncoding: z
    .enum(["auto", "hex", "base64"])
    .default("auto")
    .optional()
    .describe("Encoding format of byteSample: 'auto', 'hex', or 'base64' (default: 'auto')"),
});

export type MimeAnalyzerInput = z.infer<typeof MimeAnalyzerInputSchema>;

export type MimeCategory =
  | "image"
  | "document"
  | "audio"
  | "video"
  | "archive"
  | "code"
  | "data"
  | "font"
  | "text"
  | "executable"
  | "unknown";

export interface MagicSignatureResult {
  matched: boolean;
  signatureName?: string;
  offset?: number;
  hexPattern?: string;
  description?: string;
}

export interface MimeAnalyzerOutput {
  filename?: string;
  extension: string | null;
  detectedMimeType: string | null;
  declaredMimeType: string | null;
  category: MimeCategory;
  confidence: "high" | "medium" | "low" | "none";
  magicSignature: MagicSignatureResult;
  mismatchDetected: boolean;
  mismatchDetails?: string;
  potentialRisks?: string[];
  suggestedExtension?: string;
  isBinary: boolean;
}

interface MagicDefinition {
  name: string;
  mime: string;
  category: MimeCategory;
  extension: string;
  description: string;
  offset?: number;
  match: (buf: Buffer) => boolean;
  isExecutable?: boolean;
}

// Comprehensive Magic byte definitions
const MAGIC_DEFINITIONS: MagicDefinition[] = [
  // Images
  {
    name: "PNG",
    mime: "image/png",
    category: "image",
    extension: ".png",
    description: "Portable Network Graphics (PNG) image",
    match: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    name: "JPEG",
    mime: "image/jpeg",
    category: "image",
    extension: ".jpg",
    description: "JPEG / JFIF image",
    match: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    name: "GIF87a",
    mime: "image/gif",
    category: "image",
    extension: ".gif",
    description: "Graphics Interchange Format (GIF87a)",
    match: (b) => b.length >= 6 && b.subarray(0, 6).toString("ascii") === "GIF87a",
  },
  {
    name: "GIF89a",
    mime: "image/gif",
    category: "image",
    extension: ".gif",
    description: "Graphics Interchange Format (GIF89a)",
    match: (b) => b.length >= 6 && b.subarray(0, 6).toString("ascii") === "GIF89a",
  },
  {
    name: "WebP",
    mime: "image/webp",
    category: "image",
    extension: ".webp",
    description: "WebP image",
    match: (b) => b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    name: "BMP",
    mime: "image/bmp",
    category: "image",
    extension: ".bmp",
    description: "Bitmap Image",
    match: (b) => b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d,
  },
  {
    name: "TIFF (LE)",
    mime: "image/tiff",
    category: "image",
    extension: ".tiff",
    description: "Tagged Image File Format (Little Endian)",
    match: (b) => b.length >= 4 && b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00,
  },
  {
    name: "TIFF (BE)",
    mime: "image/tiff",
    category: "image",
    extension: ".tiff",
    description: "Tagged Image File Format (Big Endian)",
    match: (b) => b.length >= 4 && b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a,
  },
  {
    name: "ICO",
    mime: "image/x-icon",
    category: "image",
    extension: ".ico",
    description: "Windows Icon",
    match: (b) => b.length >= 4 && b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00,
  },
  // Documents
  {
    name: "PDF",
    mime: "application/pdf",
    category: "document",
    extension: ".pdf",
    description: "Portable Document Format (PDF)",
    match: (b) => b.length >= 4 && b.subarray(0, 4).toString("ascii") === "%PDF",
  },
  {
    name: "PostScript",
    mime: "application/postscript",
    category: "document",
    extension: ".ps",
    description: "Adobe PostScript document",
    match: (b) => b.length >= 4 && b.subarray(0, 4).toString("ascii") === "%!PS",
  },
  {
    name: "RTF",
    mime: "application/rtf",
    category: "document",
    extension: ".rtf",
    description: "Rich Text Format (RTF)",
    match: (b) => b.length >= 5 && b.subarray(0, 5).toString("ascii") === "{\\rtf",
  },
  // Archives
  {
    name: "ZIP",
    mime: "application/zip",
    category: "archive",
    extension: ".zip",
    description: "ZIP archive / OpenDocument / Office Open XML container",
    match: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07) && (b[3] === 0x04 || b[3] === 0x06 || b[3] === 0x08),
  },
  {
    name: "GZIP",
    mime: "application/gzip",
    category: "archive",
    extension: ".gz",
    description: "GZIP compressed archive",
    match: (b) => b.length >= 2 && b[0] === 0x1f && b[1] === 0x8b,
  },
  {
    name: "BZIP2",
    mime: "application/x-bzip2",
    category: "archive",
    extension: ".bz2",
    description: "BZIP2 compressed archive",
    match: (b) => b.length >= 3 && b[0] === 0x42 && b[1] === 0x5a && b[2] === 0x68,
  },
  {
    name: "7Z",
    mime: "application/x-7z-compressed",
    category: "archive",
    extension: ".7z",
    description: "7-Zip compressed archive",
    match: (b) => b.length >= 6 && b[0] === 0x37 && b[1] === 0x7a && b[2] === 0xbc && b[3] === 0xaf && b[4] === 0x27 && b[5] === 0x1c,
  },
  {
    name: "RAR",
    mime: "application/vnd.rar",
    category: "archive",
    extension: ".rar",
    description: "RAR compressed archive",
    match: (b) => b.length >= 7 && b[0] === 0x52 && b[1] === 0x61 && b[2] === 0x72 && b[3] === 0x21 && b[4] === 0x1a && b[5] === 0x07,
  },
  {
    name: "XZ",
    mime: "application/x-xz",
    category: "archive",
    extension: ".xz",
    description: "XZ compressed archive",
    match: (b) => b.length >= 6 && b[0] === 0xfd && b[1] === 0x37 && b[2] === 0x7a && b[3] === 0x58 && b[4] === 0x5a && b[5] === 0x00,
  },
  // Audio
  {
    name: "MP3 (ID3)",
    mime: "audio/mpeg",
    category: "audio",
    extension: ".mp3",
    description: "MPEG Audio Layer III (with ID3 tag)",
    match: (b) => b.length >= 3 && b.subarray(0, 3).toString("ascii") === "ID3",
  },
  {
    name: "MP3 (Sync)",
    mime: "audio/mpeg",
    category: "audio",
    extension: ".mp3",
    description: "MPEG Audio Layer III (sync frame)",
    match: (b) => b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0,
  },
  {
    name: "WAV",
    mime: "audio/wav",
    category: "audio",
    extension: ".wav",
    description: "Waveform Audio File Format",
    match: (b) => b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WAVE",
  },
  {
    name: "FLAC",
    mime: "audio/flac",
    category: "audio",
    extension: ".flac",
    description: "Free Lossless Audio Codec",
    match: (b) => b.length >= 4 && b.subarray(0, 4).toString("ascii") === "fLaC",
  },
  {
    name: "OGG",
    mime: "audio/ogg",
    category: "audio",
    extension: ".ogg",
    description: "Ogg container (Vorbis/Opus)",
    match: (b) => b.length >= 4 && b.subarray(0, 4).toString("ascii") === "OggS",
  },
  // Video
  {
    name: "MP4 / ISO Media",
    mime: "video/mp4",
    category: "video",
    extension: ".mp4",
    description: "MPEG-4 Part 14 video container",
    match: (b) => b.length >= 8 && b.subarray(4, 8).toString("ascii") === "ftyp",
  },
  {
    name: "WebM / Matroska",
    mime: "video/webm",
    category: "video",
    extension: ".webm",
    description: "WebM / Matroska video container",
    match: (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
  {
    name: "AVI",
    mime: "video/x-msvideo",
    category: "video",
    extension: ".avi",
    description: "Audio Video Interleave (AVI)",
    match: (b) => b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "AVI ",
  },
  // Executables & Binaries (Identified for safety classification)
  {
    name: "Windows PE (EXE/DLL)",
    mime: "application/vnd.microsoft.portable-executable",
    category: "executable",
    extension: ".exe",
    description: "Windows PE executable or dynamic library",
    match: (b) => b.length >= 2 && b[0] === 0x4d && b[1] === 0x5a,
    isExecutable: true,
  },
  {
    name: "ELF Executable",
    mime: "application/x-executable",
    category: "executable",
    extension: ".elf",
    description: "Linux Executable and Linkable Format (ELF)",
    match: (b) => b.length >= 4 && b[0] === 0x7f && b[1] === 0x45 && b[2] === 0x4c && b[3] === 0x46,
    isExecutable: true,
  },
  {
    name: "WebAssembly",
    mime: "application/wasm",
    category: "executable",
    extension: ".wasm",
    description: "WebAssembly binary module",
    match: (b) => b.length >= 4 && b[0] === 0x00 && b[1] === 0x61 && b[2] === 0x73 && b[3] === 0x6d,
  },
];

// Extension to MIME database
const EXTENSION_MAP: Record<string, { mime: string; category: MimeCategory; isBinary: boolean }> = {
  // Text / Code
  ".txt": { mime: "text/plain", category: "text", isBinary: false },
  ".md": { mime: "text/markdown", category: "text", isBinary: false },
  ".html": { mime: "text/html", category: "code", isBinary: false },
  ".htm": { mime: "text/html", category: "code", isBinary: false },
  ".css": { mime: "text/css", category: "code", isBinary: false },
  ".js": { mime: "text/javascript", category: "code", isBinary: false },
  ".mjs": { mime: "text/javascript", category: "code", isBinary: false },
  ".ts": { mime: "text/typescript", category: "code", isBinary: false },
  ".tsx": { mime: "text/tsx", category: "code", isBinary: false },
  ".jsx": { mime: "text/jsx", category: "code", isBinary: false },
  ".json": { mime: "application/json", category: "data", isBinary: false },
  ".xml": { mime: "application/xml", category: "data", isBinary: false },
  ".csv": { mime: "text/csv", category: "data", isBinary: false },
  ".sql": { mime: "application/sql", category: "code", isBinary: false },
  ".yaml": { mime: "application/yaml", category: "data", isBinary: false },
  ".yml": { mime: "application/yaml", category: "data", isBinary: false },
  // Images
  ".png": { mime: "image/png", category: "image", isBinary: true },
  ".jpg": { mime: "image/jpeg", category: "image", isBinary: true },
  ".jpeg": { mime: "image/jpeg", category: "image", isBinary: true },
  ".gif": { mime: "image/gif", category: "image", isBinary: true },
  ".webp": { mime: "image/webp", category: "image", isBinary: true },
  ".svg": { mime: "image/svg+xml", category: "image", isBinary: false },
  ".bmp": { mime: "image/bmp", category: "image", isBinary: true },
  ".ico": { mime: "image/x-icon", category: "image", isBinary: true },
  // Documents
  ".pdf": { mime: "application/pdf", category: "document", isBinary: true },
  ".docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", category: "document", isBinary: true },
  ".xlsx": { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", category: "data", isBinary: true },
  ".pptx": { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", category: "document", isBinary: true },
  // Archives
  ".zip": { mime: "application/zip", category: "archive", isBinary: true },
  ".tar": { mime: "application/x-tar", category: "archive", isBinary: true },
  ".tar.gz": { mime: "application/gzip", category: "archive", isBinary: true },
  ".gz": { mime: "application/gzip", category: "archive", isBinary: true },
  ".7z": { mime: "application/x-7z-compressed", category: "archive", isBinary: true },
  ".rar": { mime: "application/vnd.rar", category: "archive", isBinary: true },
  // Audio & Video
  ".mp3": { mime: "audio/mpeg", category: "audio", isBinary: true },
  ".wav": { mime: "audio/wav", category: "audio", isBinary: true },
  ".flac": { mime: "audio/flac", category: "audio", isBinary: true },
  ".mp4": { mime: "video/mp4", category: "video", isBinary: true },
  ".webm": { mime: "video/webm", category: "video", isBinary: true },
  ".avi": { mime: "video/x-msvideo", category: "video", isBinary: true },
};

/**
 * Extracts extension (handles compound like .tar.gz).
 */
function extractExtension(filename?: string): string | null {
  if (!filename) return null;
  const clean = filename.trim().toLowerCase();
  if (clean.endsWith(".tar.gz")) return ".tar.gz";
  if (clean.endsWith(".tar.bz2")) return ".tar.bz2";
  if (clean.endsWith(".tar.xz")) return ".tar.xz";
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1 || lastDot === clean.length - 1) return null;
  return clean.slice(lastDot);
}

/**
 * Decodes byteSample into a Buffer.
 */
function decodeSampleBuffer(sample: string, encoding: "auto" | "hex" | "base64"): Buffer {
  const clean = sample.trim();
  if (encoding === "hex" || (encoding === "auto" && /^[0-9a-fA-F\s]+$/.test(clean) && clean.length % 2 === 0)) {
    return Buffer.from(clean.replace(/\s+/g, ""), "hex");
  }
  return Buffer.from(clean, "base64");
}

export class MimeAnalyzerCapability
  implements Capability<typeof MimeAnalyzerInputSchema, MimeAnalyzerOutput>
{
  public readonly metadata: CapabilityMetadata = {
    name: "mime_analyzer",
    version: "1.0.0",
    category: "developer",
    pack: "Developer Pack",
    displayName: "MIME & File Type Analyzer",
    description:
      "Local MIME and file type analyzer to inspect extensions, media categories, and binary magic byte signatures offline. " +
      "Identifies media formats (images, documents, archives, audio, video, code), detects extension/MIME mismatches, and flags disguised executables. " +
      "Does NOT open or read from filesystem paths (operates exclusively on supplied strings or byte samples).",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "analyze",
        description: "Analyzes filename extension, declared MIME type, and binary magic byte samples to determine true media type",
        inputDescription: "filename (optional), declaredMimeType (optional), byteSample (optional), sampleEncoding (optional)",
        outputDescription: "Detailed MIME analysis, confidence level, magic signature match, and mismatch diagnostics",
      },
    ],
    limits: {
      maxFilenameLength: 500,
      maxMimeLength: 200,
      maxByteSampleLength: 100_000,
      timeoutMs: 3000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes: "Never accesses the filesystem or opens files. Analyzes only caller-provided byte samples in-memory.",
    },
    usageGuidance: {
      useWhen: [
        "User asks what MIME type or format corresponds to a filename or extension",
        "User asks to inspect leading magic bytes of a file to identify its true format",
        "User asks to check if a file extension matches its declared content or magic header",
        "User asks if a file might be a disguised executable or malicious payload",
      ],
      doNotUseWhen: [
        "User asks to read or open files from local disk (Everything.Free has no filesystem access)",
        "User asks to hash or encode data (use hash_and_encoding)",
        "User asks to parse JWT tokens (use jwt_inspector)",
      ],
      exampleRequests: [
        "What MIME type corresponds to this magic byte header '89504E470D0A1A0A'?",
        "Check if this file named 'report.pdf' with MIME 'image/png' has a mismatch",
        "Analyze this file extension '.tar.gz' and report its media category",
        "Inspect this Base64 sample header to detect the image format",
      ],
    },
  };

  public readonly inputSchema = MimeAnalyzerInputSchema;

  public async execute(
    input: MimeAnalyzerInput
  ): Promise<CapabilityResult<MimeAnalyzerOutput>> {
    const { filename, declaredMimeType, byteSample, sampleEncoding = "auto" } = input;

    const extension = extractExtension(filename);
    let sampleBuf: Buffer | null = null;

    if (byteSample && byteSample.trim().length > 0) {
      try {
        sampleBuf = decodeSampleBuffer(byteSample, sampleEncoding);
      } catch {
        sampleBuf = null;
      }
    }

    // 1. Magic Signature Detection
    let magicMatch: MagicDefinition | null = null;
    if (sampleBuf && sampleBuf.length > 0) {
      for (const def of MAGIC_DEFINITIONS) {
        if (def.match(sampleBuf)) {
          magicMatch = def;
          break;
        }
      }
    }

    // 2. Extension Lookup
    const extInfo = extension ? EXTENSION_MAP[extension] : undefined;

    // 3. Resolve Detected MIME Type & Category
    let detectedMimeType: string | null = null;
    let category: MimeCategory = "unknown";
    let confidence: MimeAnalyzerOutput["confidence"] = "none";
    let suggestedExtension: string | undefined;
    let isBinary = false;

    if (magicMatch) {
      detectedMimeType = magicMatch.mime;
      category = magicMatch.category;
      confidence = "high";
      suggestedExtension = magicMatch.extension;
      isBinary = true;
    } else if (extInfo) {
      detectedMimeType = extInfo.mime;
      category = extInfo.category;
      confidence = declaredMimeType && declaredMimeType.toLowerCase() === extInfo.mime.toLowerCase() ? "medium" : "low";
      suggestedExtension = extension!;
      isBinary = extInfo.isBinary;
    } else if (declaredMimeType) {
      detectedMimeType = declaredMimeType.toLowerCase();
      const slashIdx = detectedMimeType.indexOf("/");
      if (slashIdx !== -1) {
        const primary = detectedMimeType.slice(0, slashIdx);
        if (["image", "audio", "video", "text"].includes(primary)) {
          category = primary as MimeCategory;
        } else if (detectedMimeType.includes("json") || detectedMimeType.includes("xml") || detectedMimeType.includes("csv")) {
          category = "data";
        } else if (detectedMimeType.includes("zip") || detectedMimeType.includes("tar") || detectedMimeType.includes("gzip")) {
          category = "archive";
        } else if (detectedMimeType.includes("pdf") || detectedMimeType.includes("word") || detectedMimeType.includes("document")) {
          category = "document";
        }
      }
      confidence = "low";
    }

    // 4. Mismatch & Risk Detection
    let mismatchDetected = false;
    let mismatchDetails: string | undefined;
    const potentialRisks: string[] = [];

    if (magicMatch) {
      if (extInfo && extInfo.mime !== magicMatch.mime) {
        mismatchDetected = true;
        mismatchDetails = `File extension '${extension}' implies '${extInfo.mime}', but magic byte header indicates '${magicMatch.mime}' (${magicMatch.name}).`;
      } else if (declaredMimeType && declaredMimeType.toLowerCase() !== magicMatch.mime.toLowerCase()) {
        mismatchDetected = true;
        mismatchDetails = `Declared MIME '${declaredMimeType}' does not match detected magic signature '${magicMatch.mime}' (${magicMatch.name}).`;
      }

      if (magicMatch.isExecutable && extension && [".jpg", ".png", ".pdf", ".gif", ".txt"].includes(extension)) {
        potentialRisks.push(`High risk: Executable binary magic header (${magicMatch.name}) detected inside a file named with extension '${extension}'.`);
      }
    } else if (extInfo && declaredMimeType && declaredMimeType.toLowerCase() !== extInfo.mime.toLowerCase()) {
      mismatchDetected = true;
      mismatchDetails = `Extension '${extension}' (${extInfo.mime}) conflicts with declared MIME '${declaredMimeType}'.`;
    }

    const magicSignature: MagicSignatureResult = {
      matched: magicMatch !== null,
      signatureName: magicMatch?.name,
      hexPattern: sampleBuf && sampleBuf.length > 0 ? sampleBuf.subarray(0, Math.min(16, sampleBuf.length)).toString("hex").toUpperCase() : undefined,
      description: magicMatch?.description,
    };

    return {
      success: true,
      data: {
        filename,
        extension,
        detectedMimeType,
        declaredMimeType: declaredMimeType || null,
        category,
        confidence,
        magicSignature,
        mismatchDetected,
        mismatchDetails,
        potentialRisks: potentialRisks.length > 0 ? potentialRisks : undefined,
        suggestedExtension,
        isBinary,
      },
    };
  }
}

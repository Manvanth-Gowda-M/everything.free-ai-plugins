# MIME & File Type Analyzer (`mime_analyzer`)

## 1. Overview

The `mime_analyzer` capability inspects filename extensions, declared MIME types, and leading binary magic byte signatures offline. It identifies media categories, detects file type mismatches, and flags potential security risks such as disguised executables.

- **Pack**: `Developer Pack`
- **Category**: `developer`
- **Version**: `1.0.0`
- **Cost**: 100% Free (₹0 / $0)
- **Execution**: 100% Local (in-memory byte analysis)
- **Privacy**: `local-only` (Zero filesystem access)
- **External Dependencies**: None

---

## 2. Supported Operations

| Operation | Description                                                                       | Output                                                                                                     |
| :-------- | :-------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `analyze` | Analyzes extension, declared MIME, and binary magic bytes to determine media type | `{ extension, detectedMimeType, category, confidence, magicSignature, mismatchDetected, potentialRisks? }` |

---

## 3. Supported Media Formats & Signatures

- **Images**: PNG, JPEG, GIF, WebP, BMP, TIFF, ICO, SVG
- **Documents**: PDF, PostScript, RTF, DOCX, XLSX, PPTX
- **Archives**: ZIP, GZIP, BZIP2, 7Z, RAR, TAR, XZ
- **Audio**: MP3, WAV, FLAC, OGG, AAC
- **Video**: MP4, WebM, AVI
- **Code & Data**: JSON, XML, HTML, CSS, JS, TS, SQL, CSV, YAML
- **Binaries (Classification Only)**: Windows PE (EXE/DLL), Linux ELF, WebAssembly

---

## 4. Input Schema

```typescript
{
  filename?: string; // Optional, up to 500 characters
  declaredMimeType?: string; // Optional, up to 200 characters
  byteSample?: string; // Optional, Hex or Base64 string of header bytes (max 100KB)
  sampleEncoding?: "auto" | "hex" | "base64"; // Default: "auto"
}
```

---

## 5. Security & Invariants

- **No Filesystem Access**: Never opens files from disk or executes path lookups.
- **Pure Signature Analysis**: Magic bytes are inspected strictly for classification and mismatch detection; executables are never executed.

import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const HtmlProcessorInputSchema = z.object({
  htmlText: z
    .string()
    .min(1, "Input HTML text cannot be empty")
    .max(1_000_000, "Input HTML text exceeds maximum size limit of 1MB")
    .describe("The raw HTML text string to inspect, extract from, clean, format, or minify"),
  operation: z
    .enum(["inspect", "extract", "clean", "format", "minify"])
    .default("inspect")
    .describe(
      "Operation to perform:\n" +
        "- 'inspect': Analyzes HTML document structure, counts elements, headings, links, forms, scripts, and max depth\n" +
        "- 'extract': Extracts structured text, headings hierarchy, hyperlinks, images, and document metadata\n" +
        "- 'clean': Strips unsafe tags (<script>, <iframe>, <object>, etc.), inline event handlers, and javascript: URIs\n" +
        "- 'format': Normalizes and pretty-prints HTML with structured indentation\n" +
        "- 'minify': Compresses HTML, collapses inter-tag whitespace, and removes HTML comments"
    ),
  extractTarget: z
    .enum(["all", "text", "links", "headings", "images", "metadata"])
    .default("all")
    .optional()
    .describe("Specific target to extract when operation is 'extract' (default: 'all')"),
  indent: z
    .number()
    .int()
    .min(1, "Indentation must be at least 1 space")
    .max(8, "Indentation cannot exceed 8 spaces")
    .default(2)
    .optional()
    .describe(
      "Number of spaces for pretty-print indentation when operation is 'format' (default: 2, range: 1-8)"
    ),
});

export type HtmlProcessorInput = z.infer<typeof HtmlProcessorInputSchema>;

export interface HtmlMetaTag {
  name?: string;
  property?: string;
  content?: string;
  charset?: string;
  httpEquiv?: string;
}

export interface HtmlInspectionStats {
  title: string | null;
  headingsCount: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    total: number;
  };
  linksCount: number;
  imagesCount: number;
  formsCount: number;
  scriptsCount: number;
  stylesCount: number;
  totalElements: number;
  maxDepth: number;
  doctype: string | null;
  metaTags: HtmlMetaTag[];
}

export interface HtmlHeadingItem {
  level: number;
  text: string;
  id?: string;
}

export interface HtmlLinkItem {
  href: string;
  text: string;
  title?: string;
  rel?: string;
  target?: string;
}

export interface HtmlImageItem {
  src: string;
  alt?: string;
  title?: string;
  width?: string;
  height?: string;
}

export interface HtmlMetadataExtraction {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  canonical?: string;
  og?: Record<string, string>;
  twitter?: Record<string, string>;
}

export interface HtmlExtractionData {
  text?: string;
  headings?: HtmlHeadingItem[];
  links?: HtmlLinkItem[];
  images?: HtmlImageItem[];
  metadata?: HtmlMetadataExtraction;
}

export interface HtmlCleanResult {
  cleanedHtml: string;
  removedTagsCount: number;
  removedAttributesCount: number;
  disclaimer: string;
}

export interface HtmlProcessorOutput {
  operation: "inspect" | "extract" | "clean" | "format" | "minify";
  result?: string;
  stats?: HtmlInspectionStats;
  extracted?: HtmlExtractionData;
  cleanResult?: HtmlCleanResult;
}

// Void elements in HTML
const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// Raw text elements
const RAW_TEXT_ELEMENTS = new Set(["script", "style", "textarea", "title"]);

interface HtmlElementNode {
  type: "element" | "text" | "comment" | "doctype";
  tag?: string;
  attributes?: Record<string, string>;
  children?: HtmlElementNode[];
  text?: string;
}

/**
 * Standard HTML Entity Decoders.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Parses raw HTML into an in-memory document tree.
 */
function parseHtmlDocument(html: string): { root: HtmlElementNode; stats: HtmlInspectionStats } {
  let i = 0;
  let maxDepth = 0;
  let totalElements = 0;
  let linksCount = 0;
  let imagesCount = 0;
  let formsCount = 0;
  let scriptsCount = 0;
  let stylesCount = 0;
  let doctype: string | null = null;
  let title: string | null = null;
  const metaTags: HtmlMetaTag[] = [];

  const headingsCount = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
    total: 0,
  };

  const root: HtmlElementNode = {
    type: "element",
    tag: "root",
    children: [],
  };

  const stack: HtmlElementNode[] = [root];

  while (i < html.length) {
    if (html[i] === "<") {
      // 1. Comment <!-- ... -->
      if (html.startsWith("<!--", i)) {
        const end = html.indexOf("-->", i + 4);
        const commentText = end === -1 ? html.slice(i + 4) : html.slice(i + 4, end);
        const parent = stack[stack.length - 1];
        parent.children!.push({ type: "comment", text: commentText });
        i = end === -1 ? html.length : end + 3;
        continue;
      }

      // 2. DOCTYPE <!DOCTYPE ...>
      if (html.slice(i, i + 9).toLowerCase() === "<!doctype") {
        const end = html.indexOf(">", i + 9);
        doctype = end === -1 ? html.slice(i) : html.slice(i, end + 1);
        root.children!.push({ type: "doctype", text: doctype });
        i = end === -1 ? html.length : end + 1;
        continue;
      }

      // 3. Closing tag </tag>
      if (html.startsWith("</", i)) {
        const end = html.indexOf(">", i + 2);
        const closingTag =
          end === -1
            ? html
                .slice(i + 2)
                .trim()
                .toLowerCase()
            : html
                .slice(i + 2, end)
                .trim()
                .toLowerCase();

        // Find matching tag in stack
        for (let s = stack.length - 1; s > 0; s--) {
          if (stack[s].tag === closingTag) {
            stack.splice(s);
            break;
          }
        }
        i = end === -1 ? html.length : end + 1;
        continue;
      }

      // 4. Open tag <tag ...>
      const end = html.indexOf(">", i + 1);
      if (end === -1) {
        i = html.length;
        continue;
      }

      let tagContent = html.slice(i + 1, end).trim();
      const isSelfClosing =
        tagContent.endsWith("/") || VOID_ELEMENTS.has(tagContent.split(/\s+/)[0].toLowerCase());
      if (tagContent.endsWith("/")) {
        tagContent = tagContent.slice(0, -1).trim();
      }

      const match = tagContent.match(/^([a-zA-Z0-9:-]+)([\s\S]*)$/);
      if (!match) {
        i = end + 1;
        continue;
      }

      const tagName = match[1].toLowerCase();
      const attrString = match[2];

      // Extract attributes
      const attributes: Record<string, string> = {};
      const attrRegex = /([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrVal =
          attrMatch[2] !== undefined
            ? attrMatch[2]
            : attrMatch[3] !== undefined
              ? attrMatch[3]
              : attrMatch[4] !== undefined
                ? attrMatch[4]
                : "";
        attributes[attrName] = decodeHtmlEntities(attrVal);
      }

      totalElements++;

      // Track tag stats
      if (tagName === "a") linksCount++;
      if (tagName === "img") imagesCount++;
      if (tagName === "form") formsCount++;
      if (tagName === "script") scriptsCount++;
      if (tagName === "style") stylesCount++;
      if (tagName in headingsCount) {
        headingsCount[tagName as keyof typeof headingsCount]++;
        headingsCount.total++;
      }

      if (tagName === "meta") {
        metaTags.push({
          name: attributes.name,
          property: attributes.property,
          content: attributes.content,
          charset: attributes.charset,
          httpEquiv: attributes["http-equiv"],
        });
      }

      const elemNode: HtmlElementNode = {
        type: "element",
        tag: tagName,
        attributes,
        children: [],
      };

      const parent = stack[stack.length - 1];
      parent.children!.push(elemNode);

      // Handle raw text elements like <script>, <style>, <title>
      if (RAW_TEXT_ELEMENTS.has(tagName) && !isSelfClosing) {
        const closingTag = `</${tagName}>`;
        const closeIdx = html.toLowerCase().indexOf(closingTag, end + 1);
        const rawContent = closeIdx === -1 ? html.slice(end + 1) : html.slice(end + 1, closeIdx);

        elemNode.children!.push({
          type: "text",
          text: rawContent,
        });

        if (tagName === "title" && !title) {
          title = decodeHtmlEntities(rawContent.trim());
        }

        i = closeIdx === -1 ? html.length : closeIdx + closingTag.length;
        continue;
      }

      if (!isSelfClosing && !VOID_ELEMENTS.has(tagName)) {
        stack.push(elemNode);
        if (stack.length - 1 > maxDepth) {
          maxDepth = stack.length - 1;
        }
      }

      i = end + 1;
      continue;
    }

    // 5. Text segment
    const nextTag = html.indexOf("<", i);
    const textSegment = nextTag === -1 ? html.slice(i) : html.slice(i, nextTag);
    if (textSegment.length > 0) {
      const parent = stack[stack.length - 1];
      parent.children!.push({
        type: "text",
        text: textSegment,
      });
    }
    i = nextTag === -1 ? html.length : nextTag;
  }

  return {
    root,
    stats: {
      title,
      headingsCount,
      linksCount,
      imagesCount,
      formsCount,
      scriptsCount,
      stylesCount,
      totalElements,
      maxDepth: Math.max(1, maxDepth),
      doctype,
      metaTags,
    },
  };
}

/**
 * Extracts plain text content from HTML tree.
 */
function extractPlainText(node: HtmlElementNode): string {
  if (node.type === "text") {
    return node.text || "";
  }
  if (node.type === "element") {
    if (node.tag === "script" || node.tag === "style" || node.tag === "noscript") {
      return "";
    }
    const childrenText = (node.children || []).map(extractPlainText).join("");
    if (
      node.tag === "p" ||
      node.tag === "div" ||
      node.tag === "br" ||
      node.tag === "li" ||
      node.tag === "tr" ||
      node.tag?.startsWith("h")
    ) {
      return `\n${childrenText}\n`;
    }
    return childrenText;
  }
  return "";
}

/**
 * Traverses HTML tree to extract structured components.
 */
function extractStructuredData(
  root: HtmlElementNode,
  stats: HtmlInspectionStats
): HtmlExtractionData {
  const headings: HtmlHeadingItem[] = [];
  const links: HtmlLinkItem[] = [];
  const images: HtmlImageItem[] = [];
  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};
  let description: string | undefined;
  let keywords: string[] | undefined;
  let author: string | undefined;
  let canonical: string | undefined;

  function traverse(node: HtmlElementNode) {
    if (node.type === "element" && node.tag) {
      const tag = node.tag;
      const attrs = node.attributes || {};

      // Headings
      if (/^h[1-6]$/.test(tag)) {
        const level = parseInt(tag[1], 10);
        const text = decodeHtmlEntities(extractPlainText(node)).trim().replace(/\s+/g, " ");
        headings.push({ level, text, id: attrs.id });
      }

      // Links
      if (tag === "a" && attrs.href) {
        const text = decodeHtmlEntities(extractPlainText(node)).trim().replace(/\s+/g, " ");
        links.push({
          href: attrs.href,
          text,
          title: attrs.title,
          rel: attrs.rel,
          target: attrs.target,
        });
      }

      // Images
      if (tag === "img" && (attrs.src || attrs["data-src"])) {
        images.push({
          src: attrs.src || attrs["data-src"],
          alt: attrs.alt,
          title: attrs.title,
          width: attrs.width,
          height: attrs.height,
        });
      }

      // Link canonical
      if (tag === "link" && attrs.rel === "canonical" && attrs.href) {
        canonical = attrs.href;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(root);

  // Parse Meta tags
  for (const meta of stats.metaTags) {
    const name = meta.name?.toLowerCase();
    const prop = meta.property?.toLowerCase();
    const content = meta.content;

    if (!content) continue;

    if (name === "description") description = content;
    if (name === "author") author = content;
    if (name === "keywords") {
      keywords = content
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    if (prop && prop.startsWith("og:")) {
      og[prop.slice(3)] = content;
    }
    if (name && name.startsWith("twitter:")) {
      twitter[name.slice(8)] = content;
    }
  }

  const rawText = decodeHtmlEntities(extractPlainText(root));
  const normalizedText = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    text: normalizedText,
    headings,
    links,
    images,
    metadata: {
      title: stats.title || undefined,
      description,
      keywords,
      author,
      canonical,
      og: Object.keys(og).length > 0 ? og : undefined,
      twitter: Object.keys(twitter).length > 0 ? twitter : undefined,
    },
  };
}

/**
 * Cleans dangerous and non-content elements and attributes from HTML.
 */
function cleanHtml(node: HtmlElementNode): {
  node: HtmlElementNode | null;
  removedTags: number;
  removedAttrs: number;
} {
  const UNSAFE_TAGS = new Set([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "applet",
    "frame",
    "frameset",
    "base",
    "link",
  ]);

  let removedTags = 0;
  let removedAttrs = 0;

  if (node.type === "comment") {
    return { node: null, removedTags: 1, removedAttrs: 0 };
  }

  if (node.type === "element") {
    if (node.tag && UNSAFE_TAGS.has(node.tag.toLowerCase())) {
      return { node: null, removedTags: 1, removedAttrs: 0 };
    }

    const cleanedAttrs: Record<string, string> = {};
    if (node.attributes) {
      for (const [k, v] of Object.entries(node.attributes)) {
        // Strip event handlers (onclick, onload, etc.)
        if (k.toLowerCase().startsWith("on")) {
          removedAttrs++;
          continue;
        }
        // Strip javascript: pseudo protocol
        if (
          (k === "href" || k === "src" || k === "action" || k === "formaction") &&
          /^\s*(javascript:|data:text\/html)/i.test(v)
        ) {
          removedAttrs++;
          continue;
        }
        cleanedAttrs[k] = v;
      }
    }

    const cleanedChildren: HtmlElementNode[] = [];
    if (node.children) {
      for (const child of node.children) {
        const res = cleanHtml(child);
        removedTags += res.removedTags;
        removedAttrs += res.removedAttrs;
        if (res.node) {
          cleanedChildren.push(res.node);
        }
      }
    }

    return {
      node: {
        ...node,
        attributes: cleanedAttrs,
        children: cleanedChildren,
      },
      removedTags,
      removedAttrs,
    };
  }

  return { node, removedTags: 0, removedAttrs: 0 };
}

/**
 * Formats HTML tree into pretty-printed string.
 */
function formatHtmlTree(node: HtmlElementNode, depth = 0, indentSpaces = 2): string {
  const indent = " ".repeat(depth * indentSpaces);

  if (node.type === "doctype") {
    return node.text || "<!DOCTYPE html>";
  }

  if (node.type === "comment") {
    return `${indent}<!--${node.text}-->`;
  }

  if (node.type === "text") {
    const trimmed = (node.text || "").trim();
    return trimmed.length > 0 ? `${indent}${trimmed}` : "";
  }

  if (node.type === "element") {
    if (node.tag === "root") {
      return (node.children || [])
        .map((c) => formatHtmlTree(c, depth, indentSpaces))
        .filter((s) => s.length > 0)
        .join("\n");
    }

    let attrStr = "";
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      attrStr = Object.entries(node.attributes)
        .map(([k, v]) => ` ${k}="${v.replace(/"/g, "&quot;")}"`)
        .join("");
    }

    if (VOID_ELEMENTS.has(node.tag || "")) {
      return `${indent}<${node.tag}${attrStr}>`;
    }

    const children = node.children || [];
    if (children.length === 0) {
      return `${indent}<${node.tag}${attrStr}></${node.tag}>`;
    }

    if (children.length === 1 && children[0].type === "text") {
      return `${indent}<${node.tag}${attrStr}>${children[0].text?.trim()}</${node.tag}>`;
    }

    const childStrings = children
      .map((c) => formatHtmlTree(c, depth + 1, indentSpaces))
      .filter((s) => s.length > 0);

    return `${indent}<${node.tag}${attrStr}>\n${childStrings.join("\n")}\n${indent}</${node.tag}>`;
  }

  return "";
}

/**
 * Minifies HTML tree into single compact line.
 */
function minifyHtmlTree(node: HtmlElementNode): string {
  if (node.type === "doctype") {
    return node.text || "<!DOCTYPE html>";
  }
  if (node.type === "comment") {
    return "";
  }
  if (node.type === "text") {
    return (node.text || "").replace(/\s+/g, " ");
  }
  if (node.type === "element") {
    if (node.tag === "root") {
      return (node.children || []).map(minifyHtmlTree).join("");
    }

    let attrStr = "";
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      attrStr = Object.entries(node.attributes)
        .map(([k, v]) => ` ${k}="${v.replace(/"/g, "&quot;")}"`)
        .join("");
    }

    if (VOID_ELEMENTS.has(node.tag || "")) {
      return `<${node.tag}${attrStr}>`;
    }

    const hasElementChildren = (node.children || []).some((c) => c.type === "element");
    let childrenToMinify = node.children || [];
    if (hasElementChildren) {
      childrenToMinify = childrenToMinify.filter(
        (c) => c.type !== "text" || (c.text && c.text.trim().length > 0)
      );
    }

    const childrenStr = childrenToMinify.map(minifyHtmlTree).join("");
    return `<${node.tag}${attrStr}>${childrenStr}</${node.tag}>`;
  }
  return "";
}

export class HtmlProcessorCapability implements Capability<
  typeof HtmlProcessorInputSchema,
  HtmlProcessorOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "html_processor",
    version: "1.0.0",
    category: "text",
    pack: "Text Pack",
    displayName: "HTML Document Processor",
    description:
      "Local HTML document processor to inspect document structure, extract clean text, headings, links, images, or metadata, " +
      "clean dangerous scripts/iframes/event handlers, or format and minify HTML strings offline. " +
      "Processing is 100% offline and in-memory with ZERO JavaScript execution and ZERO network requests.",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "inspect",
        description:
          "Analyzes document structure, element counts, headings, links, images, scripts, and nesting depth",
        inputDescription: "htmlText",
        outputDescription:
          "Structural stats including headings, links, totalElements, and maxDepth",
      },
      {
        name: "extract",
        description:
          "Extracts plain text, headings hierarchy, hyperlinks, images, and OpenGraph/Twitter metadata",
        inputDescription:
          "htmlText, extractTarget (optional: 'all', 'text', 'links', 'headings', 'images', 'metadata')",
        outputDescription: "Structured extracted data matching requested extractTarget",
      },
      {
        name: "clean",
        description:
          "Strips unsafe tags (<script>, <iframe>, <object>), event handlers (onclick), and javascript: URLs",
        inputDescription: "htmlText",
        outputDescription: "Cleaned HTML markup and statistics on removed items",
      },
      {
        name: "format",
        description: "Pretty-prints and indents HTML markup with clean structure",
        inputDescription: "htmlText, indent (optional, default 2)",
        outputDescription: "Formatted multiline HTML string",
      },
      {
        name: "minify",
        description:
          "Compresses HTML into a compact single line, removing comments and inter-tag whitespace",
        inputDescription: "htmlText",
        outputDescription: "Minified compact HTML string",
      },
    ],
    limits: {
      maxTextLength: 1_000_000,
      maxInputBytes: 1_000_000,
      maxElements: 50_000,
      maxDepth: 100,
      timeoutMs: 3000,
    },
    security: {
      offlineOnly: true,
      zeroRetention: true,
      noExternalCalls: true,
      notes:
        "Never executes JavaScript, fetches resources, or runs browser engines. Pure offline text processing.",
    },
    usageGuidance: {
      useWhen: [
        "User asks to inspect HTML document structure or count links/headings/elements",
        "User asks to extract clean plain text, links, or images from raw HTML",
        "User asks to sanitize HTML by removing scripts, iframes, and inline event handlers",
        "User asks to pretty-print or minify HTML markup",
        "User asks to parse meta tags (OpenGraph, Twitter, SEO descriptions)",
      ],
      doNotUseWhen: [
        "User asks to scrape or fetch a live web page URL (Everything.Free does not perform external HTTP requests)",
        "User asks to render HTML or execute JavaScript (use browser runtimes)",
        "User asks to parse XML documents with strict DTD/namespaces (use xml_processor)",
      ],
      exampleRequests: [
        "Inspect this HTML string and report the number of links, headings, and images",
        "Extract all hyperlinks and their anchor texts from this HTML snippet",
        "Clean this HTML by removing scripts, styles, and inline onclick handlers",
        "Pretty-print this compact HTML snippet with 2-space indentation",
      ],
    },
  };

  public readonly inputSchema = HtmlProcessorInputSchema;

  public async execute(input: HtmlProcessorInput): Promise<CapabilityResult<HtmlProcessorOutput>> {
    const { htmlText, operation = "inspect", extractTarget = "all", indent = 2 } = input;

    const { root, stats } = parseHtmlDocument(htmlText);

    if (operation === "extract") {
      const allExtracted = extractStructuredData(root, stats);
      let extracted: HtmlExtractionData;

      if (extractTarget === "text") {
        extracted = { text: allExtracted.text };
      } else if (extractTarget === "links") {
        extracted = { links: allExtracted.links };
      } else if (extractTarget === "headings") {
        extracted = { headings: allExtracted.headings };
      } else if (extractTarget === "images") {
        extracted = { images: allExtracted.images };
      } else if (extractTarget === "metadata") {
        extracted = { metadata: allExtracted.metadata };
      } else {
        extracted = allExtracted;
      }

      return {
        success: true,
        data: {
          operation: "extract",
          extracted,
        },
      };
    }

    if (operation === "clean") {
      const cleanRes = cleanHtml(root);
      const cleanedMarkup = cleanRes.node ? formatHtmlTree(cleanRes.node, 0, indent) : "";

      return {
        success: true,
        data: {
          operation: "clean",
          cleanResult: {
            cleanedHtml: cleanedMarkup,
            removedTagsCount: cleanRes.removedTags,
            removedAttributesCount: cleanRes.removedAttrs,
            disclaimer:
              "Sanitization for offline text processing and document preparation; this is NOT a browser security boundary.",
          },
        },
      };
    }

    if (operation === "format") {
      const formatted = formatHtmlTree(root, 0, indent);
      return {
        success: true,
        data: {
          operation: "format",
          result: formatted,
        },
      };
    }

    if (operation === "minify") {
      const minified = minifyHtmlTree(root);
      return {
        success: true,
        data: {
          operation: "minify",
          result: minified,
        },
      };
    }

    // Default: "inspect"
    return {
      success: true,
      data: {
        operation: "inspect",
        stats,
      },
    };
  }
}

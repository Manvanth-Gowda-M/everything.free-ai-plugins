import { z } from "zod";
import { Capability, CapabilityMetadata, CapabilityResult } from "../../core/types.js";

export const XmlProcessorInputSchema = z.object({
  xmlString: z
    .string()
    .min(1, "Input XML string cannot be empty")
    .max(1_000_000, "Input XML string exceeds maximum size limit of 1MB")
    .describe("The raw XML text string to parse, inspect, format, minify, or convert to JSON"),
  operation: z
    .enum(["parse", "inspect", "format", "minify", "to_json"])
    .default("inspect")
    .describe(
      "Operation to perform:\n" +
        "- 'parse': Parses XML into a structured AST node representation\n" +
        "- 'inspect': Extracts structural metrics, root element, element counts, attributes, namespaces, and depth\n" +
        "- 'format': Pretty-prints XML with clean indentation\n" +
        "- 'minify': Compresses XML by removing inter-element whitespace\n" +
        "- 'to_json': Converts XML into standard JSON format with documented attribute/child mapping"
    ),
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
  preserveAttributes: z
    .boolean()
    .default(true)
    .optional()
    .describe(
      "Whether to preserve XML attributes as '@attributeName' in 'to_json' conversion (default: true)"
    ),
});

export type XmlProcessorInput = z.infer<typeof XmlProcessorInputSchema>;

export interface XmlNode {
  type: "element" | "text" | "cdata" | "comment" | "pi";
  name?: string;
  prefix?: string;
  localName?: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  text?: string;
  target?: string; // For processing instructions
}

export interface XmlInspectionStats {
  rootElement: string;
  elementCount: number;
  attributeCount: number;
  maxDepth: number;
  namespaces: Record<string, string>;
  textNodeStats: {
    count: number;
    totalCharacters: number;
  };
  commentsCount: number;
  processingInstructionsCount: number;
  cdataCount: number;
}

export interface XmlProcessorOutput {
  operation: "parse" | "inspect" | "format" | "minify" | "to_json";
  result?: string;
  ast?: XmlNode;
  stats?: XmlInspectionStats;
  jsonData?: Record<string, unknown>;
  valid: boolean;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
}

/**
 * Standard XML Entity Replacements.
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function encodeXmlEntities(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Checks for XXE injection attempts or external entity definitions.
 */
function checkForXxe(xml: string): void {
  const doctypeMatch = xml.match(/<!DOCTYPE\s+[^>]*(\[[\s\S]*?\])?\s*>/i);
  if (doctypeMatch) {
    const dtdContent = doctypeMatch[0];
    if (/SYSTEM\s+["']|PUBLIC\s+["']/i.test(dtdContent)) {
      throw new Error(
        "External entity declarations (SYSTEM / PUBLIC) are rejected for security (XXE prevention)."
      );
    }
    if (
      /<!ENTITY\s+/i.test(dtdContent) &&
      /SYSTEM|PUBLIC|http:\/\/|https:\/\/|file:\/\/|ftp:\/\//i.test(dtdContent)
    ) {
      throw new Error("External DTD or external entity expansion is disabled for security.");
    }
  }
}

/**
 * Parses XML into an in-memory AST safely without external entity expansion.
 */
function parseXml(
  xml: string,
  maxDepthLimit = 100,
  maxElementLimit = 50_000
): { root: XmlNode; stats: XmlInspectionStats } {
  checkForXxe(xml);

  let i = 0;
  let elementCount = 0;
  let attributeCount = 0;
  let maxDepth = 0;
  let commentsCount = 0;
  let processingInstructionsCount = 0;
  let cdataCount = 0;
  let textNodeCount = 0;
  let totalTextChars = 0;
  const namespaces: Record<string, string> = {};

  const stack: XmlNode[] = [];
  let rootNode: XmlNode | null = null;

  while (i < xml.length) {
    // 1. Tag start '<'
    if (xml[i] === "<") {
      // 1a. Comment <!-- ... -->
      if (xml.startsWith("<!--", i)) {
        const end = xml.indexOf("-->", i + 4);
        if (end === -1) throw new Error("Unclosed XML comment.");
        const commentText = xml.slice(i + 4, end);
        commentsCount++;
        const commentNode: XmlNode = { type: "comment", text: commentText };
        if (stack.length > 0) {
          stack[stack.length - 1].children!.push(commentNode);
        }
        i = end + 3;
        continue;
      }

      // 1b. CDATA <![CDATA[ ... ]]>
      if (xml.startsWith("<![CDATA[", i)) {
        const end = xml.indexOf("]]>", i + 9);
        if (end === -1) throw new Error("Unclosed CDATA section.");
        const cdataText = xml.slice(i + 9, end);
        cdataCount++;
        const cdataNode: XmlNode = { type: "cdata", text: cdataText };
        if (stack.length > 0) {
          stack[stack.length - 1].children!.push(cdataNode);
        }
        i = end + 3;
        continue;
      }

      // 1c. DOCTYPE <!DOCTYPE ... >
      if (xml.startsWith("<!DOCTYPE", i) || xml.startsWith("<!doctype", i)) {
        const end = xml.indexOf(">", i + 9);
        if (end === -1) throw new Error("Unclosed DOCTYPE declaration.");
        i = end + 1;
        continue;
      }

      // 1d. Processing instruction <?...?>
      if (xml.startsWith("<?", i)) {
        const end = xml.indexOf("?>", i + 2);
        if (end === -1) throw new Error("Unclosed processing instruction.");
        const piContent = xml.slice(i + 2, end).trim();
        const spaceIdx = piContent.indexOf(" ");
        const target = spaceIdx === -1 ? piContent : piContent.slice(0, spaceIdx);
        const text = spaceIdx === -1 ? "" : piContent.slice(spaceIdx + 1);
        processingInstructionsCount++;
        const piNode: XmlNode = { type: "pi", target, text };
        if (stack.length > 0) {
          stack[stack.length - 1].children!.push(piNode);
        }
        i = end + 2;
        continue;
      }

      // 1e. Closing tag </name>
      if (xml.startsWith("</", i)) {
        const end = xml.indexOf(">", i + 2);
        if (end === -1) throw new Error("Unclosed closing tag.");
        const closingTagName = xml.slice(i + 2, end).trim();
        if (stack.length === 0) {
          throw new Error(`Unexpected closing tag </${closingTagName}> without matching open tag.`);
        }
        const top = stack[stack.length - 1];
        if (top.name !== closingTagName) {
          throw new Error(
            `Mismatched closing tag: expected </${top.name}>, found </${closingTagName}>.`
          );
        }
        stack.pop();
        i = end + 1;
        continue;
      }

      // 1f. Open or Self-closing tag <tag ...>
      const end = xml.indexOf(">", i + 1);
      if (end === -1) throw new Error("Unclosed opening tag.");
      let tagContent = xml.slice(i + 1, end).trim();
      const isSelfClosing = tagContent.endsWith("/");
      if (isSelfClosing) {
        tagContent = tagContent.slice(0, -1).trim();
      }

      // Parse tag name and attributes
      const match = tagContent.match(/^([^\s/>]+)([\s\S]*)$/);
      if (!match) throw new Error(`Malformed XML tag at position ${i}.`);
      const fullTagName = match[1];
      const attrString = match[2];

      const prefix = fullTagName.includes(":") ? fullTagName.split(":")[0] : undefined;
      const localName = fullTagName.includes(":") ? fullTagName.split(":")[1] : fullTagName;

      // Extract attributes
      const attributes: Record<string, string> = {};
      const attrRegex = /([a-zA-Z0-9_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        const attrName = attrMatch[1];
        const attrVal =
          attrMatch[2] !== undefined
            ? attrMatch[2]
            : attrMatch[3] !== undefined
              ? attrMatch[3]
              : attrMatch[4];
        attributes[attrName] = decodeXmlEntities(attrVal || "");
        attributeCount++;

        if (attrName === "xmlns" || attrName.startsWith("xmlns:")) {
          namespaces[attrName] = attrVal;
        }
      }

      elementCount++;
      if (elementCount > maxElementLimit) {
        throw new Error(`XML element limit of ${maxElementLimit} exceeded.`);
      }

      const elementNode: XmlNode = {
        type: "element",
        name: fullTagName,
        prefix,
        localName,
        attributes,
        children: [],
      };

      if (!rootNode) {
        rootNode = elementNode;
      } else if (stack.length === 0) {
        throw new Error("Multiple root elements detected in XML document.");
      }

      if (stack.length > 0) {
        stack[stack.length - 1].children!.push(elementNode);
      }

      if (!isSelfClosing) {
        stack.push(elementNode);
        if (stack.length > maxDepth) {
          maxDepth = stack.length;
        }
        if (maxDepth > maxDepthLimit) {
          throw new Error(`XML depth limit of ${maxDepthLimit} exceeded.`);
        }
      }

      i = end + 1;
      continue;
    }

    // 2. Text node
    const nextTag = xml.indexOf("<", i);
    const textSegment = nextTag === -1 ? xml.slice(i) : xml.slice(i, nextTag);
    const decoded = decodeXmlEntities(textSegment);
    if (decoded.trim().length > 0 && stack.length > 0) {
      textNodeCount++;
      totalTextChars += decoded.trim().length;
      stack[stack.length - 1].children!.push({
        type: "text",
        text: decoded,
      });
    }
    i = nextTag === -1 ? xml.length : nextTag;
  }

  if (stack.length > 0) {
    throw new Error(`Unclosed XML tag <${stack[stack.length - 1].name}>.`);
  }

  if (!rootNode) {
    throw new Error("No root element found in XML document.");
  }

  return {
    root: rootNode,
    stats: {
      rootElement: rootNode.name || "root",
      elementCount,
      attributeCount,
      maxDepth: maxDepth || 1,
      namespaces,
      textNodeStats: {
        count: textNodeCount,
        totalCharacters: totalTextChars,
      },
      commentsCount,
      processingInstructionsCount,
      cdataCount,
    },
  };
}

/**
 * Formats XML AST into pretty-printed XML string.
 */
function formatXmlNode(node: XmlNode, indentLevel = 0, indentSpaces = 2): string {
  const indent = " ".repeat(indentLevel * indentSpaces);

  if (node.type === "text") {
    return encodeXmlEntities(node.text || "").trim();
  }

  if (node.type === "cdata") {
    return `<![CDATA[${node.text || ""}]]>`;
  }

  if (node.type === "comment") {
    return `${indent}<!--${node.text}-->`;
  }

  if (node.type === "pi") {
    return `${indent}<?${node.target} ${node.text}?>`;
  }

  if (node.type === "element") {
    let attrStr = "";
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      attrStr = Object.entries(node.attributes)
        .map(([k, v]) => ` ${k}="${encodeXmlEntities(v)}"`)
        .join("");
    }

    const children = node.children || [];
    if (children.length === 0) {
      return `${indent}<${node.name}${attrStr} />`;
    }

    // Single text child
    if (children.length === 1 && children[0].type === "text") {
      return `${indent}<${node.name}${attrStr}>${encodeXmlEntities(children[0].text || "").trim()}</${node.name}>`;
    }

    // Multiple or complex children
    const childStrings = children
      .map((c) => {
        if (c.type === "text" && c.text?.trim()) {
          return `${indent}${" ".repeat(indentSpaces)}${encodeXmlEntities(c.text.trim())}`;
        }
        return formatXmlNode(c, indentLevel + 1, indentSpaces);
      })
      .filter((s) => s.length > 0);

    return `${indent}<${node.name}${attrStr}>\n${childStrings.join("\n")}\n${indent}</${node.name}>`;
  }

  return "";
}

/**
 * Minifies XML AST into compact string.
 */
function minifyXmlNode(node: XmlNode): string {
  if (node.type === "text") {
    return encodeXmlEntities(node.text || "").trim();
  }
  if (node.type === "cdata") {
    return `<![CDATA[${node.text || ""}]]>`;
  }
  if (node.type === "comment" || node.type === "pi") {
    return ""; // Strip comments in minify
  }
  if (node.type === "element") {
    let attrStr = "";
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      attrStr = Object.entries(node.attributes)
        .map(([k, v]) => ` ${k}="${encodeXmlEntities(v)}"`)
        .join("");
    }
    const children = (node.children || []).map((c) => minifyXmlNode(c)).join("");
    if (children.length === 0) {
      return `<${node.name}${attrStr}/>`;
    }
    return `<${node.name}${attrStr}>${children}</${node.name}>`;
  }
  return "";
}

/**
 * Converts XML AST node to a clean JSON representation.
 */
function xmlNodeToJson(node: XmlNode, preserveAttributes = true): unknown {
  if (node.type === "text" || node.type === "cdata") {
    return node.text?.trim() || "";
  }

  if (node.type === "element") {
    const result: Record<string, unknown> = {};

    if (preserveAttributes && node.attributes && Object.keys(node.attributes).length > 0) {
      for (const [key, val] of Object.entries(node.attributes)) {
        result[`@${key}`] = val;
      }
    }

    const elementChildren = (node.children || []).filter((c) => c.type === "element");
    const textChildren = (node.children || []).filter(
      (c) => c.type === "text" || c.type === "cdata"
    );

    if (elementChildren.length === 0 && textChildren.length > 0) {
      const combinedText = textChildren.map((t) => t.text?.trim()).join(" ");
      if (Object.keys(result).length === 0) {
        return combinedText;
      }
      result["#text"] = combinedText;
      return result;
    }

    // Group child elements by tag name
    const groupedChildren: Record<string, unknown[]> = {};
    for (const child of elementChildren) {
      const childName = child.name!;
      if (!groupedChildren[childName]) {
        groupedChildren[childName] = [];
      }
      groupedChildren[childName].push(xmlNodeToJson(child, preserveAttributes));
    }

    for (const [tag, items] of Object.entries(groupedChildren)) {
      if (items.length === 1) {
        result[tag] = items[0];
      } else {
        result[tag] = items;
      }
    }

    if (Object.keys(result).length === 0) {
      return null;
    }

    return result;
  }

  return null;
}

export class XmlProcessorCapability implements Capability<
  typeof XmlProcessorInputSchema,
  XmlProcessorOutput
> {
  public readonly metadata: CapabilityMetadata = {
    name: "xml_processor",
    version: "1.0.0",
    category: "data",
    pack: "Data Pack",
    displayName: "XML Document Processor",
    description:
      "Local XML document processor to parse, inspect, format, minify, or convert XML documents into JSON. " +
      "Provides safe in-memory parsing, namespace extraction, and depth metrics with strict offline XXE and entity expansion protections. " +
      "Do NOT use for HTML web scraping (use html_processor instead).",
    isFree: true,
    requiresExternalNetwork: false,
    privacy: "local-only",
    externalDependencies: [],
    timeoutMs: 3000,
    operations: [
      {
        name: "inspect",
        description:
          "Extracts structural metadata, element counts, attribute metrics, namespaces, and nesting depth",
        inputDescription: "xmlString",
        outputDescription:
          "Detailed XML statistics including element count, namespaces, and max depth",
      },
      {
        name: "parse",
        description: "Parses XML string into a safe structured AST representation",
        inputDescription: "xmlString",
        outputDescription: "Safe AST node tree with tag names, attributes, and children",
      },
      {
        name: "format",
        description: "Pretty-prints XML with customizable indentation and aligned tags",
        inputDescription: "xmlString, indent (optional, default 2)",
        outputDescription: "Formatted multiline XML string",
      },
      {
        name: "minify",
        description:
          "Compresses XML into compact single-line string, stripping comments and extra whitespace",
        inputDescription: "xmlString",
        outputDescription: "Minified compact XML string",
      },
      {
        name: "to_json",
        description:
          "Converts XML into structured JSON with documented attribute (@attr) and repeated tag array handling",
        inputDescription: "xmlString, preserveAttributes (optional, default true)",
        outputDescription: "Structured JSON object representing XML hierarchy",
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
        "Strict XXE prevention: external DTDs and external entities (SYSTEM/PUBLIC) are rejected. 100% in-memory parser.",
    },
    usageGuidance: {
      useWhen: [
        "User asks to pretty-print or indent unformatted XML data",
        "User asks to inspect XML structure (element count, root tag, namespaces, depth)",
        "User asks to convert XML payloads to JSON objects",
        "User asks to minify XML documents for storage or transmission",
        "User asks to parse XML safely without XXE vulnerabilities",
      ],
      doNotUseWhen: [
        "User asks to parse HTML strings or web pages (use html_processor)",
        "User asks to format JSON or CSV data (use json_formatter_validator or csv_processor)",
        "User asks to fetch remote XML endpoints or RSS feeds (Everything.Free is 100% offline)",
      ],
      exampleRequests: [
        "Inspect this XML configuration and count the elements and namespaces",
        "Convert this XML response into a clean JSON structure",
        "Pretty-print this compact XML document with 2-space indentation",
        "Minify this XML payload into a single line",
      ],
    },
  };

  public readonly inputSchema = XmlProcessorInputSchema;

  public async execute(input: XmlProcessorInput): Promise<CapabilityResult<XmlProcessorOutput>> {
    const { xmlString, operation = "inspect", indent = 2, preserveAttributes = true } = input;

    let parsedResult: { root: XmlNode; stats: XmlInspectionStats };
    try {
      parsedResult = parseXml(xmlString);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Invalid XML syntax";
      return {
        success: true,
        data: {
          operation,
          valid: false,
          error: {
            message: errorMsg,
          },
        },
      };
    }

    const { root, stats } = parsedResult;

    if (operation === "format") {
      const formatted = formatXmlNode(root, 0, indent);
      return {
        success: true,
        data: {
          operation: "format",
          valid: true,
          result: formatted,
        },
      };
    }

    if (operation === "minify") {
      const minified = minifyXmlNode(root);
      return {
        success: true,
        data: {
          operation: "minify",
          valid: true,
          result: minified,
        },
      };
    }

    if (operation === "to_json") {
      const jsonObj = {
        [root.name || "root"]: xmlNodeToJson(root, preserveAttributes),
      };
      return {
        success: true,
        data: {
          operation: "to_json",
          valid: true,
          jsonData: jsonObj,
        },
      };
    }

    if (operation === "parse") {
      return {
        success: true,
        data: {
          operation: "parse",
          valid: true,
          ast: root,
        },
      };
    }

    // Default: "inspect"
    return {
      success: true,
      data: {
        operation: "inspect",
        valid: true,
        stats,
      },
    };
  }
}

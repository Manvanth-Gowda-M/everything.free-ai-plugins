import { describe, it, expect } from "vitest";
import { XmlProcessorCapability, XmlProcessorOutput } from "../../src/capabilities/data/xml-processor.js";
import { ExecutionRunner } from "../../src/core/execution.js";

describe("XmlProcessorCapability", () => {
  const capability = new XmlProcessorCapability();

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore xmlns="http://books.example.com" xmlns:d="http://discounts.example.com">
  <!-- Top 2025 Best Sellers -->
  <book category="fiction" id="b101">
    <title lang="en">The Midnight Library</title>
    <author>Matt Haig</author>
    <year>2020</year>
    <price currency="USD">14.99</price>
    <d:discount>10%</d:discount>
    <description><![CDATA[Between life and death there is a library...]]></description>
  </book>
  <book category="science" id="b102">
    <title lang="en">Astrophysics for People in a Hurry</title>
    <author>Neil deGrasse Tyson</author>
    <year>2017</year>
    <price currency="USD">11.99</price>
  </book>
</bookstore>`;

  describe("inspect operation", () => {
    it("should extract structural statistics, element counts, namespaces, and depth", async () => {
      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: sampleXml,
        operation: "inspect",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(true);
      const stats = res.data?.stats;
      expect(stats).toBeDefined();
      expect(stats?.rootElement).toBe("bookstore");
      expect(stats?.elementCount).toBe(13); // bookstore (1) + 2 books (2) + book 1 children (6) + book 2 children (4) = 13
      expect(stats?.attributeCount).toBe(10);
      expect(stats?.maxDepth).toBe(3);
      expect(stats?.namespaces["xmlns"]).toBe("http://books.example.com");
      expect(stats?.namespaces["xmlns:d"]).toBe("http://discounts.example.com");
      expect(stats?.commentsCount).toBe(1);
      expect(stats?.cdataCount).toBe(1);
    });
  });

  describe("format operation", () => {
    it("should pretty-print and indent XML", async () => {
      const messyXml = `<root><item id="1"><name>Widget</name></item><item id="2"><name>Gadget</name></item></root>`;
      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: messyXml,
        operation: "format",
        indent: 2,
      });

      expect(res.success).toBe(true);
      expect(res.data?.result).toBeDefined();
      expect(res.data?.result).toContain("<root>\n  <item id=\"1\">");
      expect(res.data?.result).toContain("</item>\n</root>");
    });
  });

  describe("minify operation", () => {
    it("should compact XML removing unnecessary whitespace", async () => {
      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: sampleXml,
        operation: "minify",
      });

      expect(res.success).toBe(true);
      expect(res.data?.result).toBeDefined();
      expect(res.data?.result).not.toContain("  ");
      expect(res.data?.result).toContain("<book category=\"fiction\" id=\"b101\">");
      expect(res.data?.result).toContain("<![CDATA[Between life and death there is a library...]]>");
    });
  });

  describe("to_json operation", () => {
    it("should convert XML into clean JSON with attributes and child arrays", async () => {
      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: sampleXml,
        operation: "to_json",
        preserveAttributes: true,
      });

      expect(res.success).toBe(true);
      const json = res.data?.jsonData;
      expect(json).toBeDefined();
      expect(json?.bookstore).toBeDefined();

      const bookstore = json?.bookstore as Record<string, unknown>;
      expect(bookstore["@xmlns"]).toBe("http://books.example.com");
      expect(bookstore["@xmlns:d"]).toBe("http://discounts.example.com");

      const books = bookstore["book"] as unknown[];
      expect(Array.isArray(books)).toBe(true);
      expect(books).toHaveLength(2);

      const firstBook = books[0] as Record<string, unknown>;
      expect(firstBook["@id"]).toBe("b101");
      expect(firstBook["@category"]).toBe("fiction");
      expect(firstBook["author"]).toBe("Matt Haig");
      expect(firstBook["description"]).toBe("Between life and death there is a library...");
    });
  });

  describe("parse operation", () => {
    it("should parse XML into structured AST", async () => {
      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: "<app version=\"2.0\"><title>Everything.Free</title></app>",
        operation: "parse",
      });

      expect(res.success).toBe(true);
      expect(res.data?.ast?.name).toBe("app");
      expect(res.data?.ast?.attributes?.version).toBe("2.0");
      expect(res.data?.ast?.children?.[0].name).toBe("title");
    });
  });

  describe("XXE & Security Protection", () => {
    it("should reject external entity declarations with SYSTEM identifier", async () => {
      const xxePayload = `<?xml version="1.0"?>
<!DOCTYPE test [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<test>&xxe;</test>`;

      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: xxePayload,
        operation: "inspect",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(false);
      expect(res.data?.error?.message).toContain("External entity declarations (SYSTEM / PUBLIC) are rejected for security");
    });

    it("should reject external DTD with HTTP URL", async () => {
      const xxeDtd = `<!DOCTYPE root SYSTEM "http://malicious.com/evil.dtd"><root></root>`;
      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: xxeDtd,
        operation: "parse",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(false);
      expect(res.data?.error?.message).toContain("External entity declarations (SYSTEM / PUBLIC) are rejected for security");
    });
  });

  describe("Syntax Error Handling", () => {
    it("should gracefully catch mismatched closing tags", async () => {
      const invalidXml = "<root><item>text</wrong></root>";
      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: invalidXml,
        operation: "inspect",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(false);
      expect(res.data?.error?.message).toContain("Mismatched closing tag");
    });

    it("should gracefully catch unclosed tags", async () => {
      const unclosedXml = "<root><unclosed>";
      const res = await ExecutionRunner.run<XmlProcessorOutput>(capability, {
        xmlString: unclosedXml,
        operation: "inspect",
      });

      expect(res.success).toBe(true);
      expect(res.data?.valid).toBe(false);
      expect(res.data?.error?.message).toContain("Unclosed XML tag");
    });
  });
});

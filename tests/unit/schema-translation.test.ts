import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  zodToJsonSchema,
  jsonSchemaToGeminiSchema,
  zodToJsonSchemaProperty,
} from "../../src/adapters/schema.js";

describe("Schema Translation Unit Tests", () => {
  it("converts basic primitive Zod types to JSON Schema properties", () => {
    const stringProp = zodToJsonSchemaProperty(z.string().describe("A text field"));
    expect(stringProp.type).toBe("string");
    expect(stringProp.description).toBe("A text field");

    const intProp = zodToJsonSchemaProperty(z.number().int().describe("An integer count"));
    expect(intProp.type).toBe("integer");
    expect(intProp.description).toBe("An integer count");

    const floatProp = zodToJsonSchemaProperty(z.number().describe("A float"));
    expect(floatProp.type).toBe("number");

    const boolProp = zodToJsonSchemaProperty(z.boolean().describe("Flag"));
    expect(boolProp.type).toBe("boolean");
  });

  it("converts enum and array Zod types to JSON Schema properties", () => {
    const enumProp = zodToJsonSchemaProperty(
      z.enum(["validate", "format", "minify"]).describe("Operation action")
    );
    expect(enumProp.type).toBe("string");
    expect(enumProp.enum).toEqual(["validate", "format", "minify"]);
    expect(enumProp.description).toBe("Operation action");

    const arrayProp = zodToJsonSchemaProperty(
      z.array(z.string().describe("Tag name")).describe("List of tags")
    );
    expect(arrayProp.type).toBe("array");
    expect(arrayProp.items?.type).toBe("string");
    expect(arrayProp.description).toBe("List of tags");
  });

  it("converts complex ZodObjects to standard JSON Schema and marks required fields", () => {
    const complexSchema = z.object({
      requiredText: z.string().describe("Mandatory text"),
      optionalNumber: z.number().optional().describe("Optional number"),
      defaultAction: z.enum(["a", "b"]).default("a").describe("Action with default"),
    });

    const jsonSchema = zodToJsonSchema(complexSchema);
    expect(jsonSchema.type).toBe("object");
    expect(jsonSchema.required).toEqual(["requiredText"]);
    expect(jsonSchema.properties.requiredText.type).toBe("string");
    expect(jsonSchema.properties.optionalNumber.type).toBe("number");
    expect(jsonSchema.properties.defaultAction.type).toBe("string");
  });

  it("translates JSON Schema to Gemini OpenAPI Function Calling Schema format", () => {
    const complexSchema = z.object({
      sql: z.string().describe("SQL query string"),
      operation: z.enum(["format", "inspect", "minify"]).describe("Operation mode"),
      maxRows: z.number().int().optional().describe("Limit rows"),
    });

    const jsonSchema = zodToJsonSchema(complexSchema);
    const geminiSchema = jsonSchemaToGeminiSchema(jsonSchema) as {
      type: string;
      required: string[];
      properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    };

    expect(geminiSchema.type).toBe("OBJECT");
    expect(geminiSchema.required).toEqual(["sql", "operation"]);
    expect(geminiSchema.properties.sql.type).toBe("STRING");
    expect(geminiSchema.properties.sql.description).toBe("SQL query string");
    expect(geminiSchema.properties.operation.type).toBe("STRING");
    expect(geminiSchema.properties.operation.enum).toEqual(["format", "inspect", "minify"]);
    expect(geminiSchema.properties.maxRows.type).toBe("INTEGER");
  });
});

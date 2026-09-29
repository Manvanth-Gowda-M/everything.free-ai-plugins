import { z } from "zod";

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  default?: unknown;
}

export interface JsonSchemaObject {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
  additionalProperties?: boolean;
}

export interface OpenApiSchemaObject {
  type: "OBJECT";
  properties: Record<string, Record<string, unknown>>;
  required: string[];
}

/**
 * Converts a ZodType into a JSON Schema property definition.
 */
export function zodToJsonSchemaProperty(schema: z.ZodTypeAny): JsonSchemaProperty {
  let unwrapped: z.ZodTypeAny = schema;
  let defaultValue: unknown;
  const description = schema.description;

  // Unwrap optional, default, nullable, effects
  while (true) {
    if (unwrapped instanceof z.ZodOptional || unwrapped instanceof z.ZodNullable) {
      unwrapped = unwrapped.unwrap();
    } else if (unwrapped instanceof z.ZodDefault) {
      defaultValue = unwrapped._def.defaultValue();
      unwrapped = unwrapped._def.innerType;
    } else if (unwrapped instanceof z.ZodEffects) {
      unwrapped = unwrapped._def.schema;
    } else {
      break;
    }
  }

  const propDesc = description || unwrapped.description;

  if (unwrapped instanceof z.ZodString) {
    const prop: JsonSchemaProperty = { type: "string" };
    if (propDesc) prop.description = propDesc;
    if (defaultValue !== undefined) prop.default = defaultValue;
    return prop;
  }

  if (unwrapped instanceof z.ZodNumber) {
    const prop: JsonSchemaProperty = {
      type: unwrapped._def.checks.some((c: { kind: string }) => c.kind === "int")
        ? "integer"
        : "number",
    };
    if (propDesc) prop.description = propDesc;
    if (defaultValue !== undefined) prop.default = defaultValue;
    return prop;
  }

  if (unwrapped instanceof z.ZodBoolean) {
    const prop: JsonSchemaProperty = { type: "boolean" };
    if (propDesc) prop.description = propDesc;
    if (defaultValue !== undefined) prop.default = defaultValue;
    return prop;
  }

  if (unwrapped instanceof z.ZodEnum) {
    const prop: JsonSchemaProperty = {
      type: "string",
      enum: unwrapped._def.values,
    };
    if (propDesc) prop.description = propDesc;
    if (defaultValue !== undefined) prop.default = defaultValue;
    return prop;
  }

  if (unwrapped instanceof z.ZodArray) {
    const itemProp = zodToJsonSchemaProperty(unwrapped.element);
    const prop: JsonSchemaProperty = {
      type: "array",
      items: itemProp,
    };
    if (propDesc) prop.description = propDesc;
    return prop;
  }

  if (unwrapped instanceof z.ZodObject) {
    const shape = unwrapped.shape;
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const field = fieldSchema as z.ZodTypeAny;
      properties[key] = zodToJsonSchemaProperty(field);
      if (!(field instanceof z.ZodOptional) && !(field instanceof z.ZodDefault)) {
        required.push(key);
      }
    }

    const prop: JsonSchemaProperty = {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
    if (propDesc) prop.description = propDesc;
    return prop;
  }

  // Fallback for any other type
  const fallback: JsonSchemaProperty = { type: "string" };
  if (propDesc) fallback.description = propDesc;
  return fallback;
}

/**
 * Converts a ZodObject into standard JSON Schema parameters.
 */
export function zodToJsonSchema(
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>
): JsonSchemaObject {
  const shape = schema.shape;
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const [key, fieldSchema] of Object.entries(shape)) {
    properties[key] = zodToJsonSchemaProperty(fieldSchema);
    if (!(fieldSchema instanceof z.ZodOptional) && !(fieldSchema instanceof z.ZodDefault)) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

/**
 * Converts standard JSON schema properties to Gemini OpenAPI Function Calling Schema format.
 */
export function jsonSchemaToGeminiSchema(jsonSchema: JsonSchemaObject): Record<string, unknown> {
  function convertType(typeStr: string): string {
    switch (typeStr.toLowerCase()) {
      case "string":
        return "STRING";
      case "number":
        return "NUMBER";
      case "integer":
        return "INTEGER";
      case "boolean":
        return "BOOLEAN";
      case "array":
        return "ARRAY";
      case "object":
        return "OBJECT";
      default:
        return "STRING";
    }
  }

  function convertProp(prop: JsonSchemaProperty): Record<string, unknown> {
    const result: Record<string, unknown> = {
      type: convertType(prop.type),
    };
    if (prop.description) result.description = prop.description;
    if (prop.enum) result.enum = prop.enum;
    if (prop.items) result.items = convertProp(prop.items);
    if (prop.properties) {
      const nestedProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(prop.properties)) {
        nestedProps[k] = convertProp(v);
      }
      result.properties = nestedProps;
      if (prop.required) result.required = prop.required;
    }
    return result;
  }

  const geminiProps: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(jsonSchema.properties)) {
    geminiProps[key] = convertProp(prop);
  }

  return {
    type: "OBJECT",
    properties: geminiProps,
    required: jsonSchema.required,
  };
}

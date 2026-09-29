import { z } from "zod";
import { CapabilityRegistry } from "../../core/registry.js";
import { ExecutionRunner } from "../../core/execution.js";
import { PlatformAdapter, NormalizedExecutionResult } from "../types.js";
import { zodToJsonSchema, jsonSchemaToGeminiSchema } from "../schema.js";
import {
  GeminiTool,
  GeminiFunctionDeclaration,
  GeminiFunctionCall,
  GeminiFunctionResponse,
  GeminiPart,
} from "./types.js";

/**
 * Gemini AI Platform Adapter.
 * Translates the Everything.Free core capability registry into official Gemini Function Calling declarations
 * and bridges Gemini function calls to in-memory local execution without external network calls or SDK dependencies.
 */
export class GeminiAdapter implements PlatformAdapter<GeminiTool, GeminiFunctionResponse> {
  public readonly platformName = "gemini";
  public readonly registry: CapabilityRegistry;

  constructor(registry: CapabilityRegistry) {
    this.registry = registry;
  }

  /**
   * Generates official Gemini Tool Declarations for all registered capabilities.
   */
  public getToolDeclarations(): GeminiTool[] {
    const functionDeclarations: GeminiFunctionDeclaration[] = this.registry
      .getAll()
      .map((capability) => {
        const { name, description } = capability.metadata;
        const jsonSchema = zodToJsonSchema(
          capability.inputSchema as z.ZodObject<Record<string, z.ZodTypeAny>>
        );
        const parameters = jsonSchemaToGeminiSchema(jsonSchema);

        return {
          name,
          description,
          parameters,
        };
      });

    return [
      {
        functionDeclarations,
      },
    ];
  }

  /**
   * Executes a tool by name with raw arguments and returns a standardized Gemini FunctionResponse.
   */
  public async executeTool(toolName: string, rawArgs: unknown): Promise<GeminiFunctionResponse> {
    const capability = this.registry.get(toolName);

    if (!capability) {
      return {
        name: toolName,
        response: {
          ok: false,
          error: {
            code: "CAPABILITY_NOT_FOUND",
            message: `Capability '${toolName}' is not registered in the Everything.Free engine.`,
          },
        },
      };
    }

    const execResult = await ExecutionRunner.run(capability, rawArgs || {});

    if (execResult.success) {
      return {
        name: toolName,
        response: {
          ok: true,
          result: execResult.data,
          durationMs: execResult.metrics?.durationMs,
        },
      };
    }

    return {
      name: toolName,
      response: {
        ok: false,
        error: execResult.error,
        durationMs: execResult.metrics?.durationMs,
      },
    };
  }

  /**
   * Handles a raw Gemini part or function call directly from a Gemini API response.
   */
  public async handleFunctionCall(
    callOrPart: GeminiPart | GeminiFunctionCall
  ): Promise<GeminiPart> {
    const functionCall =
      "functionCall" in callOrPart ? callOrPart.functionCall : (callOrPart as GeminiFunctionCall);

    if (!functionCall || typeof functionCall.name !== "string") {
      throw new Error("Invalid Gemini functionCall payload: missing function name.");
    }

    const response = await this.executeTool(functionCall.name, functionCall.args);

    return {
      functionResponse: response,
    };
  }

  /**
   * Normalizes execution into standard internal NormalizedExecutionResult.
   */
  public async executeNormalized(toolName: string, rawArgs: unknown): Promise<NormalizedExecutionResult> {
    const res = await this.executeTool(toolName, rawArgs);
    return {
      ok: res.response.ok,
      data: res.response.result,
      error: res.response.error,
      durationMs: res.response.durationMs,
    };
  }
}

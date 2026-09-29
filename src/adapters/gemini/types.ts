/**
 * Gemini Function Calling API Types & Schema Definitions.
 * Aligns with the official Google Gemini Generative AI Tool Declaration specifications.
 */

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface GeminiTool {
  functionDeclarations: GeminiFunctionDeclaration[];
}

export interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiFunctionResponsePayload {
  ok: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  durationMs?: number;
}

export interface GeminiFunctionResponse {
  name: string;
  response: GeminiFunctionResponsePayload;
}

export interface GeminiPart {
  text?: string;
  functionCall?: GeminiFunctionCall;
  functionResponse?: GeminiFunctionResponse;
}

import { CapabilityResult } from "../../core/types.js";

/**
 * Format capability execution results into standard MCP content blocks.
 */
export function formatMcpResult(result: CapabilityResult): {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
} {
  if (!result.success) {
    const errorText = JSON.stringify(
      {
        status: "error",
        error: result.error,
        metrics: result.metrics,
      },
      null,
      2
    );
    return {
      content: [{ type: "text", text: errorText }],
      isError: true,
    };
  }

  // Format data payload
  const formattedText =
    typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2);

  return {
    content: [{ type: "text", text: formattedText }],
  };
}

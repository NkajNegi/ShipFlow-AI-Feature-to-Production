import { NextResponse } from "next/server";
import { createAgentTools } from "@repo/api";
import { zodToJsonSchema } from "zod-to-json-schema";

const MCP_SERVER_VERSION = "1.0.0";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
      return NextResponse.json({ jsonrpc: "2.0", id: body?.id ?? null, error: { code: -32600, message: "Invalid JSON-RPC request" } }, { status: 400 });
    }

    const id = body.id ?? null;
    const method = body.method;

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: "shipflow-mcp", version: MCP_SERVER_VERSION },
        }
      });
    }

    if (method === "notifications/initialized") {
      return new Response(null, { status: 204 });
    }

    // In production MCP you authenticate the user, for local/internal we extract from headers
    const workspaceId = req.headers.get("x-shipflow-workspace-id") || "default";
    const userId = req.headers.get("x-shipflow-user-id") || "system";
    const toolsRegistry = createAgentTools(workspaceId, userId);

    if (method === "tools/list") {
      const tools = Object.entries(toolsRegistry).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: zodToJsonSchema((tool as any).parameters),
      }));
      return NextResponse.json({ jsonrpc: "2.0", id, result: { tools } });
    }

    if (method === "tools/call") {
      const params = body.params as { name?: string; arguments?: any };
      const toolName = params?.name ?? "";
      
      const tool = (toolsRegistry as any)[toolName];
      if (!tool) {
        return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${toolName}` } });
      }

      const result = await tool.execute(params?.arguments ?? {});

      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        }
      });
    }

    return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: err.message } }, { status: 500 });
  }
}

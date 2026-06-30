import { NextResponse } from "next/server";
import { createAgentTools } from "@repo/api";
import { zodToJsonSchema } from "zod-to-json-schema";

export async function POST(req: Request) {
  // 1. Verify Authentication
  const authHeader = req.headers.get("authorization");
  if (!process.env.MCP_API_KEY || authHeader !== `Bearer ${process.env.MCP_API_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Extract context headers
  const workspaceId = req.headers.get("x-workspace-id");
  const userId = req.headers.get("x-user-id");

  if (!workspaceId || !userId) {
    return new Response("Missing x-workspace-id or x-user-id headers", { status: 400 });
  }

  // 3. Parse JSON-RPC Payload
  let payload;
  try {
    payload = await req.json();
  } catch (err) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { jsonrpc, id, method, params } = payload;
  if (jsonrpc !== "2.0" || !method) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32600, message: "Invalid Request" },
    });
  }

  const tools = createAgentTools(workspaceId, userId) as Record<string, any>;

  try {
    // 4. Route MCP Methods
    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "metroflow-mcp", version: "1.0.0" },
        },
      });
    }

    if (method === "notifications/initialized") {
      return new Response(null, { status: 200 }); // standard ack, no body
    }

    if (method === "tools/list") {
      const toolList = Object.entries(tools).map(([name, toolObj]) => ({
        name,
        description: toolObj.description,
        inputSchema: zodToJsonSchema(toolObj.parameters),
      }));

      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: { tools: toolList },
      });
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params || {};
      const toolObj = tools[name];

      if (!toolObj) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Tool not found: ${name}` },
        });
      }

      // Execute tool
      const result = await toolObj.execute(args);

      // Return MCP compliant tool result
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
            },
          ],
        },
      });
    }

    // Method Not Found
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: "Method not found" },
    });
  } catch (err: any) {
    console.error("MCP Tool Error:", err);
    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: { code: -32000, message: err.message || "Internal Server Error" },
    });
  }
}

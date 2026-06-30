#!/usr/bin/env node

import * as readline from "readline";

const API_KEY = process.env.MCP_API_KEY;
const WORKSPACE_ID = process.env.WORKSPACE_ID;
const USER_ID = process.env.USER_ID;
const API_URL = process.env.API_URL || "http://localhost:3000/api/mcp";

if (!API_KEY || !WORKSPACE_ID || !USER_ID) {
  console.error("Missing required environment variables: MCP_API_KEY, WORKSPACE_ID, USER_ID");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;

  try {
    const payload = JSON.parse(line);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "x-workspace-id": WORKSPACE_ID,
        "x-user-id": USER_ID,
      },
      body: JSON.stringify(payload),
    });

    if (payload.method === "notifications/initialized") {
      // standard ACK has no response
      return;
    }

    if (!response.ok) {
      const text = await response.text();
      console.log(JSON.stringify({
        jsonrpc: "2.0",
        id: payload.id,
        error: { code: -32000, message: `HTTP ${response.status}: ${text}` }
      }));
      return;
    }

    const data = await response.json();
    console.log(JSON.stringify(data));
  } catch (err) {
    // If it's not a JSON parsing error, just output an MCP error
    console.log(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error or Network error" }
    }));
  }
});

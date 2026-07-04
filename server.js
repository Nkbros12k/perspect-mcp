import { randomUUID } from "node:crypto";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// The hosted Perspect API this connector proxies to. The engine, Gemini key,
// and (later) billing all live there; this repo is just the connector.
const PERSPECT_API_URL = process.env.PERSPECT_API_URL || "https://perspect-ai-backend.onrender.com";
const PORT = process.env.PORT || 4000;

async function runDebate(topic, personas) {
  const res = await fetch(`${PERSPECT_API_URL}/api/v1/debate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(personas ? { topic, personas } : { topic }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Perspect API error (${res.status})`);
  }
  return res.json();
}

async function listPersonas() {
  const res = await fetch(`${PERSPECT_API_URL}/api/personas`);
  if (!res.ok) throw new Error(`Perspect API error (${res.status})`);
  const body = await res.json();
  return body.personas || [];
}

function createServer() {
  const server = new McpServer({ name: "perspect-ai", version: "1.0.0" });

  server.registerTool(
    "list_personas",
    {
      description: "List the expert personas available for a Perspect AI panel (id, name, discipline).",
      inputSchema: {},
    },
    async () => {
      const personas = await listPersonas();
      return {
        content: [
          { type: "text", text: personas.map((p) => `${p.id}: ${p.name} (${p.discipline})`).join("\n") },
        ],
      };
    }
  );

  server.registerTool(
    "run_debate",
    {
      description:
        "Convene a panel of expert personas to debate a topic, idea, or decision from multiple perspectives, then return the debate and a synthesized study guide. Optionally pass specific persona ids (see list_personas); omit to auto-select. Takes ~30-60s.",
      inputSchema: {
        topic: z.string().describe("The topic, question, idea, or decision to explore."),
        personas: z.array(z.string()).optional().describe("Optional persona ids (2 to 5). Omit to auto-select."),
      },
    },
    async ({ topic, personas }) => {
      const result = await runDebate(topic, personas);
      return { content: [{ type: "text", text: result.markdown }] };
    }
  );

  return server;
}

// --- Stateful Streamable HTTP transport (sessions keyed by Mcp-Session-Id) ---
const transports = {};

async function handleMcpPost(req, res) {
  const sessionId = req.headers["mcp-session-id"];
  let transport;
  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => { transports[sid] = transport; },
    });
    transport.onclose = () => { if (transport.sessionId) delete transports[transport.sessionId]; };
    await createServer().connect(transport);
  } else {
    res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "Bad Request: no valid session ID" }, id: null });
    return;
  }
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[mcp] error:", err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  }
}

async function handleMcpSession(req, res) {
  const sessionId = req.headers["mcp-session-id"];
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
}

const app = express();
app.use(express.json({ limit: "64kb" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.post("/mcp", handleMcpPost);
app.get("/mcp", handleMcpSession);
app.delete("/mcp", handleMcpSession);
app.listen(PORT, () => console.log(`Perspect MCP connector on http://localhost:${PORT} -> ${PERSPECT_API_URL}`));

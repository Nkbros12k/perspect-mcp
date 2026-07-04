# Perspect MCP Connector

An [MCP](https://modelcontextprotocol.io) server that lets Claude (and other MCP
clients like ChatGPT / Cursor) call **Perspect AI** as a tool: convene a panel of
expert personas to debate any topic, idea, or decision, and get back the debate
plus a synthesized study guide.

This repo is just the connector. The debate engine, model key, and (planned)
billing live in the hosted Perspect API that this proxies to.

## Tools

| Tool | Description |
|---|---|
| `run_debate` | Convene a panel on a topic/idea/decision. Optional `personas` (2 to 5 ids); omit to auto-select. Returns the debate + study guide. |
| `list_personas` | List available persona ids, names, and disciplines. |

## Run locally

```bash
npm install
cp .env.example .env    # PERSPECT_API_URL defaults to the hosted backend
npm run dev             # MCP server on http://localhost:4000/mcp
```

## Add to Claude

1. Deploy this server (see `render.yaml`) or run it locally and expose it.
2. In claude.ai: **Settings → Connectors → Add custom connector**.
3. Name it `Perspect AI` and use the server's `/mcp` URL.
4. Ask Claude: *"Use Perspect to debate whether we should raise or bootstrap."*

## Config

| Env var | Default | Purpose |
|---|---|---|
| `PERSPECT_API_URL` | `https://perspect-ai-backend.onrender.com` | Hosted Perspect API base URL |
| `PORT` | `4000` | Port the connector listens on |

## Notes

- A full debate takes ~30 to 60s.
- This connector is currently authless. Per-account auth, usage quotas, and a
  freemium paid tier are planned at the Perspect API layer.

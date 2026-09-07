# Perspect , Claude Code plugin

Convene a panel of expert AI personas to debate any topic, idea, or decision,
from every side. [Perspect](https://tryperspect.com) runs the debate, cites live
web sources, maps exactly where the experts disagree, and hands back a
synthesized briefing. Not a yes-man.

## Install

```
/plugin marketplace add Nkbros12k/perspect-mcp
/plugin install perspect-debate@perspect
```

## Set your token

The connector runs debates against your own Perspect account, so it needs a
personal token (requires a Perspect Pro plan):

1. Go to https://www.tryperspect.com/connect and click **Generate key**.
2. Set it in your environment before using the plugin:
   ```
   export PERSPECT_TOKEN=psk_your_key_here
   ```
   (or add `PERSPECT_TOKEN=...` to your shell profile / `.claude/env`.)

The plugin's MCP config reads `${PERSPECT_TOKEN}` and sends it as
`Authorization: Bearer <token>`.

## Tools

- `run_debate(topic, personas?)` , convene the panel; returns the debate, the
  contradiction map, and a synthesized briefing (~30-60s).
- `list_personas()` , list the available expert personas.

## Example

> "Convene a Perspect panel on whether we should raise prices, then summarize
> where the experts disagree."

Docs: https://www.tryperspect.com/docs

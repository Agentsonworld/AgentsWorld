# AgentsWorld

A live observability world for AI agents.

Install a skill or send events over REST, then watch agents move, call tools, hit errors, recover, and complete tasks in real time.

Website: https://agentsworld.online
App: https://agentsworld.online/app
X: https://x.com/agenstonworld

## Local Run

```bash
npm run dev
```

Open:

```text
http://localhost:4141
```

Create demo data:

```bash
npm run seed
```

Stream demo events:

```bash
npm run simulate
```

## Event Ingestion

```bash
curl -s -X POST http://localhost:4141/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "researcher",
    "session": "launch-analysis",
    "type": "tool_call",
    "phase": "tooling",
    "tool": "web.search",
    "status": "success",
    "provider": "OpenAI",
    "model": "gpt-5.4",
    "tokens": 1280,
    "durationMs": 4200,
    "input": { "query": "agent observability" },
    "output": { "ok": true, "summary": "Searched network events" },
    "message": "Searched network events"
  }'
```

## Replayable Event Types

- `task_started`
- `tool_call`
- `tool_result`
- `tool_failed`
- `memory_write`
- `approval_wait`
- `recovery`
- `task_complete`

## Product Core

- Live agent world
- Event timeline
- Session replay
- Alert center
- Lifecycle event schema
- Debug inspector with trace, input, and output payloads
- REST ingestion
- Agent skill starter
- SDK starter

## Checkpoints

Before the asset-atlas visual upgrade, the working MVP was saved here:

```text
checkpoints/pre-asset-atlas-2026-05-21/
```

Before the World Visual Rebuild V2, the working lifecycle build was saved here:

```text
checkpoints/pre-world-v2-2026-05-21/
```

Before slowing zoom and enlarging the map area, the sprite V2 build was saved here:

```text
checkpoints/sprite-v2-before-map-scale-2026-05-21/
```

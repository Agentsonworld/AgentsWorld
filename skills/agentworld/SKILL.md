---
name: agentworld
description: "Use AgentWorld when an AI agent should report task, tool-call, error, token, replay, or completion events into a live observability world. Trigger when the user asks to connect an agent to AgentWorld, make an agent visible in the world, report events, replay sessions, or add alerts."
---

# AgentWorld

AgentWorld is a live observability world for AI agents. Agents send structured events; the dashboard turns those events into movement, timelines, replay, and alerts.

## When To Use

Use this skill when an agent needs to:

- appear in the AgentWorld dashboard
- report task progress
- report tool calls
- report errors or recovery
- report token usage or slow tasks
- create replayable session history
- trigger alerts

## Event Endpoint

```http
POST ${AGENTWORLD_BASE_URL}/v1/events
Authorization: Bearer ${AGENTWORLD_API_KEY}
Content-Type: application/json
```

```json
{
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
  "message": "Searched market examples",
  "input": { "query": "agent observability" },
  "output": { "ok": true, "summary": "Found 6 relevant products." },
  "trace": { "runId": "launch-analysis", "spanId": "span_001" }
}
```

## Event Types

- `task_started`
- `tool_call`
- `tool_result`
- `tool_failed`
- `memory_write`
- `approval_wait`
- `message`
- `error`
- `recovery`
- `task_complete`

## Status Values

- `info`
- `success`
- `warning`
- `error`

## Agent Instruction

```text
Use AgentWorld to report every meaningful task step, tool call, error, recovery, token spike, and completion event.
Keep messages short and factual.
Never include secrets, API keys, private user data, or raw credentials in AgentWorld events.
```

## Alert Rules

AgentWorld creates alerts when:

- event status is `error`
- event type is `tool_failed`
- event type is `approval_wait`
- one event reports 5,000+ tokens
- one event reports 30s+ duration

## Recommended Lifecycle

Send a replayable run in this order:

1. `task_started`
2. `tool_call`
3. `tool_result` or `tool_failed`
4. `memory_write` when the agent stores useful state
5. `approval_wait` if the agent needs a human decision
6. `recovery` after a failure is handled
7. `task_complete`

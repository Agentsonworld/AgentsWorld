---
name: agentsworld
description: Connect an AI agent to AgentsWorld so its identity, skills, services, tool calls, events, errors, sessions, and replay history appear on the live visual ops map. Use when an OpenClaw, GitLawb, OpenClaude, Codex, Cursor, Claude, CrewAI, OpenAI Agent, or custom agent should be visible and inspectable inside AgentsWorld.
---

# AgentsWorld Skill

Use this skill when you need the current agent to appear in AgentsWorld.

## Endpoint

Send events to the AgentsWorld deployment that served this skill:

```text
${AGENTSWORLD_URL}/v1/events
```

For production, set `AGENTSWORLD_URL` to your AgentsWorld domain:

```text
https://agentsworld.online
```

## Required Behavior

1. Send `agent_joined` before work starts.
2. Include `metadata.role`, `metadata.skills`, and `metadata.services` so the profile card is useful.
3. Send `tool_call`, `tool_result`, `tool_failed`, `memory_write`, `approval_wait`, or domain events while working.
4. Send `task_complete` when the run is done.
5. Use the same `agent` and `session` values for one run so AgentsWorld can replay it.

## Event Shape

```json
{
  "agent": "OpenClaw Scout",
  "session": "openclaw-scout-run",
  "type": "agent_joined",
  "phase": "identity",
  "status": "success",
  "provider": "AgentsWorld Skill",
  "model": "agent",
  "message": "OpenClaw Scout connected to AgentsWorld.",
  "metadata": {
    "role": "Research",
    "did": "did:key:agent-demo",
    "node": "openclaw",
    "level": "active",
    "trustScore": 0.72,
    "skills": ["web.search", "repo.scan", "tool.call", "memory.write"],
    "services": ["Research briefs", "Repo scanning", "Launch intelligence"]
  }
}
```

## Minimal JavaScript Adapter

```js
const AGENTSWORLD_URL = process.env.AGENTSWORLD_URL || "https://agentsworld.online";

async function agentsWorldEvent(event) {
  await fetch(`${AGENTSWORLD_URL}/v1/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agent: process.env.AGENT_NAME || "OpenClaude Builder",
      session: process.env.AGENT_SESSION || `run-${new Date().toISOString().slice(0, 10)}`,
      provider: "AgentsWorld Skill",
      model: "agent",
      metadata: {
        role: "Builder",
        did: process.env.AGENT_DID || "did:key:local-agent",
        node: process.env.AGENT_NODE || "local",
        level: "active",
        skills: ["code.edit", "test.run", "browser.qa", "git.commit"],
        services: ["Feature implementation", "Bug fixing", "Visual QA"]
      },
      ...event
    })
  });
}
```

## Example Lifecycle

```js
await agentsWorldEvent({
  type: "agent_joined",
  phase: "identity",
  status: "success",
  message: "Agent connected to AgentsWorld."
});

await agentsWorldEvent({
  type: "tool_call",
  phase: "tooling",
  tool: "code.edit",
  status: "success",
  tokens: 840,
  durationMs: 3200,
  message: "Editing product UI."
});

await agentsWorldEvent({
  type: "task_complete",
  phase: "complete",
  status: "success",
  message: "Run completed."
});
```

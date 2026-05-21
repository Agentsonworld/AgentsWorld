const endpoint = process.env.AGENTWORLD_URL || "http://localhost:4141/v1/events";

const agents = ["Scout", "Forge", "Relay", "Oracle", "Patch"];
const sessions = ["launch-analysis", "ui-build", "customer-replies", "market-map", "bug-fix"];
const tools = ["web.search", "code.edit", "shell.run", "browser.inspect", "memory.write", "api.call"];
const lifecycle = ["task_started", "tool_call", "tool_result", "memory_write", "approval_wait", "tool_failed", "recovery", "task_complete"];
const messages = [
  "Inspected a repo and extracted the product angle.",
  "Generated a UI patch for the live world.",
  "Called an external tool and normalized the result.",
  "Detected a slow task and added it to the timeline.",
  "Completed a quest and stored replay metadata.",
  "Recovered from a failed tool call."
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function sendEvent() {
  const index = Math.floor(Math.random() * agents.length);
  const typeRoll = Math.random();
  const type = typeRoll > 0.92 ? "tool_failed" : typeRoll > 0.84 ? "approval_wait" : typeRoll > 0.74 ? "task_complete" : pick(lifecycle.slice(0, 4));
  const status = type === "tool_failed" ? "error" : type === "approval_wait" ? "warning" : type === "task_started" ? "info" : "success";
  const body = {
    agent: agents[index],
    session: sessions[index],
    type,
    tool: type === "task_started" || type === "approval_wait" || type === "task_complete" ? null : pick(tools),
    status,
    phase: {
      task_started: "planning",
      tool_call: "tooling",
      tool_result: "tooling",
      memory_write: "memory",
      approval_wait: "blocked",
      tool_failed: "debugging",
      recovery: "recovering",
      task_complete: "complete"
    }[type],
    provider: Math.random() > 0.5 ? "OpenAI" : "Anthropic",
    model: Math.random() > 0.5 ? "gpt-5.4" : "claude-sonnet",
    tokens: Math.floor(120 + Math.random() * (status === "error" ? 6800 : 1800)),
    durationMs: Math.floor(300 + Math.random() * (status === "error" ? 40000 : 9000)),
    message: pick(messages),
    input: { route: "demo", step: type },
    output: status === "error" ? { ok: false, retryable: true } : { ok: true },
    metadata: { environment: "simulator" }
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  console.log(`${result.event.createdAt} ${body.agent} ${body.type} ${body.status}`);
}

console.log(`Streaming demo events to ${endpoint}`);
setInterval(() => sendEvent().catch(console.error), 1800);
sendEvent().catch(console.error);

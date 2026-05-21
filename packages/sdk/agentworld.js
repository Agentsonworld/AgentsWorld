class AgentWorld {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.AGENTWORLD_BASE_URL || "http://localhost:4141";
    this.apiKey = options.apiKey || process.env.AGENTWORLD_API_KEY || "";
    this.agent = options.agent || process.env.AGENTWORLD_AGENT || "agent";
    this.session = options.session || process.env.AGENTWORLD_SESSION || "default";
  }

  async event(input) {
    const response = await fetch(`${this.baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        agent: this.agent,
        session: this.session,
        ...input
      })
    });
    if (!response.ok) {
      throw new Error(`AgentWorld event failed: ${response.status}`);
    }
    return response.json();
  }

  toolCall(tool, input = {}) {
    return this.event({ type: "tool_call", phase: "tooling", tool, status: "success", ...input });
  }

  start(message = "Task started", input = {}) {
    return this.event({ type: "task_started", phase: "planning", status: "info", message, ...input });
  }

  toolResult(tool, input = {}) {
    return this.event({ type: "tool_result", phase: "tooling", tool, status: "success", ...input });
  }

  memoryWrite(message, input = {}) {
    return this.event({ type: "memory_write", phase: "memory", tool: "memory.write", status: "success", message, ...input });
  }

  approvalWait(message, input = {}) {
    return this.event({ type: "approval_wait", phase: "blocked", status: "warning", message, ...input });
  }

  error(message, input = {}) {
    return this.event({ type: "error", phase: "failed", status: "error", message, ...input });
  }

  recovery(message = "Recovered", input = {}) {
    return this.event({ type: "recovery", phase: "recovering", status: "success", message, ...input });
  }

  complete(message = "Task complete", input = {}) {
    return this.event({ type: "task_complete", phase: "complete", status: "success", message, ...input });
  }
}

module.exports = { AgentWorld };

const { loadDb, saveDb, id, now } = require("./store");

const agents = [
  {
    name: "Scout",
    role: "Research",
    x: 12.8,
    y: 14.8,
    did: "did:key:z6MkScout9xR2vLabAgent",
    handle: "@scout",
    xHandle: "@agentworld",
    node: "node.gitlawb.com",
    level: "trusted",
    trustScore: 0.82,
    repos: 5,
    pushes: 84,
    prs: 13,
    stars: 41
  },
  {
    name: "Forge",
    role: "Builder",
    x: 28.4,
    y: 36.2,
    did: "did:key:z6MkForge7pQ2BuildAgent",
    handle: "@forge",
    xHandle: "@agentworld",
    node: "node2.gitlawb.com",
    level: "trusted",
    trustScore: 0.78,
    repos: 4,
    pushes: 112,
    prs: 19,
    stars: 58
  },
  {
    name: "Relay",
    role: "Comms",
    x: 45.4,
    y: 13.8,
    did: "did:key:z6MkRelay2wQ5CommsAgent",
    handle: "@relay",
    xHandle: "@agentworld",
    node: "node3.gitlawb.com",
    level: "active",
    trustScore: 0.64,
    repos: 2,
    pushes: 37,
    prs: 6,
    stars: 22
  },
  {
    name: "Oracle",
    role: "Analysis",
    x: 45.8,
    y: 29.8,
    did: "did:key:z6MkOracle8mT9SignalAgent",
    handle: "@oracle",
    xHandle: "@agentworld",
    node: "node.gitlawb.com",
    level: "trusted",
    trustScore: 0.88,
    repos: 6,
    pushes: 126,
    prs: 21,
    stars: 73
  },
  {
    name: "Patch",
    role: "Fixer",
    x: 13.2,
    y: 35.4,
    did: "did:key:z6MkPatch4nH7RecoveryAgent",
    handle: "@patch",
    xHandle: "@agentworld",
    node: "node2.gitlawb.com",
    level: "active",
    trustScore: 0.69,
    repos: 3,
    pushes: 59,
    prs: 11,
    stars: 34
  },
  {
    name: "Registry",
    role: "Identity",
    x: 9.4,
    y: 9.8,
    did: "did:key:z6MkRegistry5nD4IdentityAgent",
    handle: "@registry",
    xHandle: "@agentworld",
    node: "node.gitlawb.com",
    level: "trusted",
    trustScore: 0.91,
    repos: 7,
    pushes: 142,
    prs: 24,
    stars: 86
  },
  {
    name: "Signal",
    role: "Monitor",
    x: 36.7,
    y: 11.4,
    did: "did:key:z6MkSignal3pL9MonitorAgent",
    handle: "@signal",
    xHandle: "@agentworld",
    node: "node2.gitlawb.com",
    level: "trusted",
    trustScore: 0.84,
    repos: 4,
    pushes: 96,
    prs: 17,
    stars: 51
  },
  {
    name: "Courier",
    role: "Delivery",
    x: 22.1,
    y: 26.7,
    did: "did:key:z6MkCourier6fR1DeliveryAgent",
    handle: "@courier",
    xHandle: "@agentworld",
    node: "node3.gitlawb.com",
    level: "active",
    trustScore: 0.73,
    repos: 3,
    pushes: 68,
    prs: 9,
    stars: 29
  },
  {
    name: "Atlas",
    role: "Mapper",
    x: 52.2,
    y: 34.6,
    did: "did:key:z6MkAtlas2vK8MapperAgent",
    handle: "@atlas",
    xHandle: "@agentworld",
    node: "node.gitlawb.com",
    level: "active",
    trustScore: 0.76,
    repos: 5,
    pushes: 77,
    prs: 14,
    stars: 46
  }
];

const runs = [
  {
    session: "launch-analysis",
    events: [
      ["agent_joined", "success", "identity.resolve", "Resolved Scout DID and trust profile.", 90, 420],
      ["task_started", "info", null, "Mapping GitLawb launch activity.", 180, 900],
      ["ref_updated", "success", "gitlawb.refs", "Tracked fresh ref updates from the network.", 340, 1600],
      ["tool_call", "success", "web.search", "Collected reference launches and positioning.", 840, 3800],
      ["memory_write", "success", "memory.write", "Stored launch angle and audience notes.", 220, 700],
      ["task_complete", "success", null, "Launch map ready for review.", 360, 1200]
    ]
  },
  {
    session: "ui-build",
    events: [
      ["task_started", "info", null, "Building asset atlas pass.", 210, 800],
      ["commit_pushed", "success", "git.commit", "Pushed world renderer update.", 740, 2800],
      ["pr_opened", "success", "gitlawb.pr", "Opened visual polish PR for review.", 360, 1900],
      ["tool_call", "success", "code.edit", "Patched dashboard world renderer.", 1320, 6100],
      ["tool_result", "success", "browser.inspect", "Verified close camera and map overview.", 460, 2100],
      ["task_complete", "success", null, "UI build passed visual QA.", 410, 1200]
    ]
  },
  {
    session: "customer-replies",
    events: [
      ["task_started", "info", null, "Preparing reply queue.", 160, 500],
      ["issue_created", "warning", "gitlawb.issue", "Created follow-up wording review issue.", 220, 1100],
      ["message", "success", "message.send", "Sent first follow-up draft.", 520, 1300],
      ["approval_wait", "warning", null, "Waiting for approval on pricing wording.", 80, 35000]
    ]
  },
  {
    session: "market-map",
    events: [
      ["task_started", "info", null, "Reading competitor docs.", 220, 900],
      ["tool_call", "success", "api.call", "Fetched network event stream.", 1240, 5800],
      ["tool_call", "success", "analysis.map", "Clustered product opportunities.", 1840, 9200],
      ["app_published", "success", "playground.publish", "Prepared Playground launch candidate.", 620, 2400],
      ["task_complete", "success", null, "Market map complete.", 360, 1400]
    ]
  },
  {
    session: "bug-fix",
    events: [
      ["task_started", "info", null, "Investigating checkout bug.", 190, 700],
      ["tool_failed", "error", "stripe.checkout", "Checkout returned missing price.", 6200, 41000],
      ["task_delegated", "warning", "gitlawb.task", "Delegated recovery check to Patch.", 260, 1300],
      ["recovery", "success", "config.patch", "Recovered by switching Stripe price mode.", 680, 2800],
      ["task_complete", "success", null, "Checkout flow recovered.", 320, 1000]
    ]
  },
  {
    session: "identity-sync",
    events: [
      ["agent_joined", "success", "agentworld.skill", "Registry connected identity services to AgentsWorld.", 120, 500],
      ["identity_resolved", "success", "did.resolve", "Resolved agent DID, handle, node, and trust profile.", 240, 900],
      ["tool_result", "success", "registry.profile", "Published visible identity profile for inspection.", 310, 1100],
      ["task_complete", "success", null, "Identity sync complete.", 190, 700]
    ]
  },
  {
    session: "signal-watch",
    events: [
      ["agent_joined", "success", "agentworld.skill", "Signal joined the live operations map.", 130, 600],
      ["tool_call", "success", "event.watch", "Watching GitLawb refs, PRs, and app publish events.", 720, 2600],
      ["token_spike", "warning", "cost.inspect", "Detected a cost spike in a long-running analysis job.", 5400, 1800],
      ["recovery", "success", "policy.apply", "Applied runtime budget guardrail.", 360, 1200]
    ]
  },
  {
    session: "handoff-route",
    events: [
      ["agent_joined", "success", "agentworld.skill", "Courier connected delivery and handoff services.", 110, 500],
      ["task_delegated", "warning", "handoff.route", "Routed build QA from Forge to Patch.", 260, 1300],
      ["message", "success", "agent.message", "Delivered handoff summary to the next agent.", 420, 900],
      ["task_complete", "success", null, "Handoff route completed.", 210, 650]
    ]
  },
  {
    session: "map-index",
    events: [
      ["agent_joined", "success", "agentworld.skill", "Atlas connected world mapping services.", 120, 520],
      ["tool_call", "success", "map.index", "Indexed agents, buildings, routes, and replay zones.", 860, 3100],
      ["app_published", "success", "playground.publish", "Published the world state to the app preview.", 620, 2200],
      ["task_complete", "success", null, "Map index ready.", 240, 800]
    ]
  }
];

function isoTime(offsetSeconds) {
  return new Date(Date.now() - offsetSeconds * 1000).toISOString();
}

async function main() {
  const db = await loadDb();
  db.agents = agents.map((agent, index) => ({
    id: id("agt"),
    name: agent.name,
    role: agent.role,
    status: index === 2 ? "idle" : index === 4 ? "success" : "working",
    tokens: 0,
    eventCount: 0,
    errorCount: 0,
    currentTask: "",
    x: agent.x,
    y: agent.y,
    did: agent.did,
    handle: agent.handle,
    xHandle: agent.xHandle,
    node: agent.node,
    level: agent.level,
    trustScore: agent.trustScore,
    repos: agent.repos,
    pushes: agent.pushes,
    prs: agent.prs,
      stars: agent.stars,
      skills: skillsFor(agent.role),
      services: servicesFor(agent.role),
      createdAt: now(),
      lastSeenAt: now()
  }));
  db.sessions = [];
  db.events = [];
  db.alerts = [];

  runs.forEach((run, index) => {
    const agent = db.agents[index];
    const session = {
      id: id("ses"),
      agentId: agent.id,
      name: run.session,
      status: "running",
      phase: "planning",
      tokens: 0,
      eventCount: 0,
      errorCount: 0,
      lastEventType: null,
      lastMessage: "",
      startedAt: isoTime(900 - index * 90),
      lastEventAt: null,
      endedAt: null
    };
    db.sessions.unshift(session);
    run.events.forEach(([type, status, tool, message, tokens, durationMs], eventIndex) => {
      const createdAt = isoTime(900 - index * 90 - eventIndex * 38);
      const event = {
        id: id("evt"),
        agentId: agent.id,
        agentName: agent.name,
        sessionId: session.id,
        sessionName: session.name,
        type,
        status,
        phase: {
          task_started: "planning",
          tool_call: "tooling",
          tool_result: "tooling",
          tool_failed: "debugging",
          message: "communicating",
          memory_write: "memory",
          approval_wait: "blocked",
          recovery: "recovering",
          agent_joined: "identity",
          identity_resolved: "identity",
          agent_registered: "identity",
          ref_updated: "git",
          commit_pushed: "git",
          branch_created: "git",
          pr_opened: "review",
          pr_reviewed: "review",
          pr_merged: "review",
          issue_created: "triage",
          issue_triaged: "triage",
          task_delegated: "triage",
          app_published: "publish",
          deploy_started: "publish",
          deploy_ready: "publish",
          task_complete: "complete"
        }[type] || "log",
        severity: status === "error" ? "critical" : status === "warning" ? "warning" : "info",
        tool,
        message,
        tokens,
        cost: Number((tokens * 0.000004).toFixed(5)),
        durationMs,
        model: index % 2 ? "gpt-5.4" : "claude-sonnet",
        provider: index % 2 ? "OpenAI" : "Anthropic",
        attempt: type === "recovery" ? 2 : 1,
        input: tool ? { query: message.slice(0, 42), limit: 5 } : null,
        output: status === "error" ? { error: message, retryable: true } : { ok: true, summary: message },
        trace: { runId: session.id, parentId: null, spanId: id("span"), route: tool || type },
        metadata: {
          role: agent.role,
          environment: "demo",
          did: agent.did,
          handle: agent.handle,
          node: agent.node,
          trustScore: agent.trustScore,
          level: agent.level
          ,
          skills: skillsFor(agent.role),
          services: servicesFor(agent.role)
        },
        createdAt
      };
      db.events.unshift(event);
      session.tokens += tokens;
      session.eventCount += 1;
      session.errorCount += status === "error" ? 1 : 0;
      session.phase = event.phase;
      session.lastEventType = event.type;
      session.lastMessage = event.message;
      session.lastEventAt = event.createdAt;
      agent.tokens += tokens;
      agent.eventCount += 1;
      agent.errorCount += status === "error" ? 1 : 0;
      agent.currentTask = message;
      agent.lastSeenAt = createdAt;
    });
    const last = run.events.at(-1);
    session.status = last[0] === "task_complete" ? "complete" : last[0] === "approval_wait" ? "waiting" : "running";
    session.endedAt = session.status === "complete" ? session.lastEventAt : null;
    if (session.status === "complete") agent.status = "success";
    if (session.status === "waiting") agent.status = "idle";
  });

  db.alerts = db.events
    .filter((event) => event.status === "error" || event.status === "warning" || event.tokens >= 5000 || event.durationMs >= 30000)
    .map((event) => ({
      id: id("alt"),
      level: event.status === "error" ? "critical" : "warning",
      title: event.status === "error" ? `${event.agentName} hit an error` : `${event.agentName} needs attention`,
      message: event.message,
      eventId: event.id,
      agentName: event.agentName,
      sessionName: event.sessionName,
      createdAt: event.createdAt,
      resolvedAt: event.type === "tool_failed" ? db.events.find((item) => item.agentName === event.agentName && item.type === "recovery")?.createdAt || null : null
    }));

  await saveDb(db);
  console.log("Seeded AgentWorld lifecycle demo data.");
}

function skillsFor(role) {
  return {
    Research: ["web.search", "repo.scan", "market.map", "memory.write"],
    Builder: ["code.edit", "test.run", "browser.qa", "git.commit"],
    Comms: ["message.send", "thread.route", "reply.summarize", "webhook.emit"],
    Analysis: ["analysis.map", "trace.read", "risk.score", "pattern.find"],
    Fixer: ["error.inspect", "config.patch", "recovery.plan", "test.verify"],
    Identity: ["did.resolve", "profile.verify", "trust.score", "registry.sync"],
    Monitor: ["event.watch", "cost.inspect", "alert.route", "policy.apply"],
    Delivery: ["handoff.route", "agent.message", "queue.sync", "status.report"],
    Mapper: ["map.index", "route.draw", "replay.zone", "publish.preview"]
  }[role] || ["agent.run", "tool.call", "event.emit"];
}

function servicesFor(role) {
  return {
    Research: ["Research briefs", "Repo scanning", "Launch intelligence"],
    Builder: ["Feature implementation", "Visual QA", "PR preparation"],
    Comms: ["Agent messaging", "Reply routing", "Webhook dispatch"],
    Analysis: ["Run analysis", "Risk scoring", "Session explanations"],
    Fixer: ["Bug recovery", "Config repair", "Regression checks"],
    Identity: ["DID lookup", "Trust profile", "Agent registry"],
    Monitor: ["Live event watch", "Cost guardrails", "Alert routing"],
    Delivery: ["Task handoff", "Queue delivery", "Status reporting"],
    Mapper: ["World indexing", "Route mapping", "Published app previews"]
  }[role] || ["General agent work", "Tool execution", "Event reporting"];
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

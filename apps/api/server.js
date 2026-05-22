const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { loadDb, saveDb, id, now } = require("./store");

const port = Number(process.env.PORT || 4141);
const webRoot = path.resolve(__dirname, "../web");
const clients = new Set();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

function send(res, status, body, headers = {}) {
  const isString = typeof body === "string";
  res.writeHead(status, {
    "content-type": isString ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    ...headers
  });
  res.end(isString ? body : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function emit(type, payload) {
  const frame = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) res.write(frame);
}

function normalizeEvent(input) {
  const type = String(input.type || "log");
  const status = String(input.status || statusForType(type));
  const trace = input.trace && typeof input.trace === "object" ? input.trace : {};
  const metadata = input.metadata && typeof input.metadata === "object" ? input.metadata : {};
  return {
    id: id("evt"),
    agentId: input.agentId ? String(input.agentId) : null,
    agentName: String(input.agent || input.agentName || "unknown-agent").trim(),
    sessionId: input.sessionId ? String(input.sessionId) : null,
    sessionName: String(input.session || input.sessionName || "default-session").trim(),
    type,
    status,
    phase: String(input.phase || phaseForType(type)),
    severity: String(input.severity || severityFor(type, status)),
    tool: input.tool ? String(input.tool) : null,
    message: input.message ? String(input.message) : "",
    tokens: Number(input.tokens || 0),
    cost: Number(input.cost || 0),
    durationMs: Number(input.durationMs || 0),
    model: input.model ? String(input.model) : metadata.model || null,
    provider: input.provider ? String(input.provider) : metadata.provider || null,
    attempt: Number(input.attempt || metadata.attempt || 1),
    input: input.input && typeof input.input === "object" ? input.input : null,
    output: input.output && typeof input.output === "object" ? input.output : null,
    trace: {
      runId: String(input.runId || trace.runId || input.sessionId || ""),
      parentId: input.parentId || trace.parentId || null,
      spanId: String(input.spanId || trace.spanId || id("span")),
      route: input.route || trace.route || null
    },
    metadata,
    createdAt: now()
  };
}

function statusForType(type) {
  if (["tool_failed", "error"].includes(type)) return "error";
  if ([
    "task_complete",
    "tool_result",
    "recovery",
    "agent_joined",
    "agent_registered",
    "identity_resolved",
    "commit_pushed",
    "ref_updated",
    "branch_created",
    "pr_opened",
    "pr_reviewed",
    "pr_merged",
    "issue_triaged",
    "app_published",
    "deploy_started",
    "deploy_ready"
  ].includes(type)) return "success";
  if (["approval_wait", "token_spike"].includes(type)) return "warning";
  return "info";
}

function phaseForType(type) {
  return {
    task_started: "planning",
    tool_call: "tooling",
    tool_result: "tooling",
    tool_failed: "debugging",
    memory_write: "memory",
    approval_wait: "blocked",
    recovery: "recovering",
    message: "communicating",
    token_spike: "cost",
    agent_joined: "identity",
    agent_registered: "identity",
    identity_resolved: "identity",
    commit_pushed: "git",
    ref_updated: "git",
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
    task_complete: "complete",
    error: "failed"
  }[type] || "log";
}

function severityFor(type, status) {
  if (status === "error" || ["tool_failed", "error"].includes(type)) return "critical";
  if (status === "warning" || ["approval_wait", "token_spike", "issue_created", "task_delegated"].includes(type)) return "warning";
  return "info";
}

function normalizeGitLawbEvent(input = {}) {
  const rawType = String(input.type || input.event || input.kind || "ref_updated");
  const key = rawType
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s.-]+/g, "_")
    .toLowerCase();
  const typeMap = {
    agentjoined: "agent_joined",
    agent_joined: "agent_joined",
    agentregistered: "agent_registered",
    agent_registered: "agent_registered",
    identityresolved: "identity_resolved",
    identity_resolved: "identity_resolved",
    commitpushed: "commit_pushed",
    commit_pushed: "commit_pushed",
    push: "commit_pushed",
    refupdated: "ref_updated",
    ref_updated: "ref_updated",
    branchcreated: "branch_created",
    branch_created: "branch_created",
    pullrequestopened: "pr_opened",
    pull_request_opened: "pr_opened",
    pr_opened: "pr_opened",
    pullrequestreviewed: "pr_reviewed",
    pull_request_reviewed: "pr_reviewed",
    pr_reviewed: "pr_reviewed",
    pullrequestmerged: "pr_merged",
    pull_request_merged: "pr_merged",
    pr_merged: "pr_merged",
    issuecreated: "issue_created",
    issue_created: "issue_created",
    taskbroadcast: "task_delegated",
    task_broadcast: "task_delegated",
    taskdelegated: "task_delegated",
    task_delegated: "task_delegated",
    apppublished: "app_published",
    app_published: "app_published",
    deployready: "deploy_ready",
    deploy_ready: "deploy_ready"
  };
  const type = typeMap[key] || key;
  const repo = String(input.repo || input.repository || input.project || "agents/agentworld");
  const did = String(input.did || input.agentDid || input.pusher || input.owner || input.actorDid || "");
  const agentName = String(input.agent || input.agentName || input.actor || input.handle || (did ? did.replace("did:key:", "").slice(0, 10) : "GitLawb Agent"));
  const sha = input.sha || input.commit || input.commitSha || input.refSha || null;
  const ref = input.ref || input.branch || input.head || "main";
  const pr = input.pr || input.prNumber || input.pullRequest || null;
  const sessionName = String(input.session || input.sessionName || repo.split("/").pop() || "gitlawb-session");
  const toolMap = {
    agent_joined: "gitlawb.identity",
    agent_registered: "gitlawb.identity",
    identity_resolved: "gitlawb.identity",
    commit_pushed: "gitlawb.push",
    ref_updated: "gitlawb.ref",
    branch_created: "gitlawb.branch",
    pr_opened: "gitlawb.pr",
    pr_reviewed: "gitlawb.review",
    pr_merged: "gitlawb.merge",
    issue_created: "gitlawb.issue",
    task_delegated: "gitlawb.task",
    app_published: "gitlawb.playground",
    deploy_ready: "gitlawb.deploy"
  };
  const messages = {
    agent_joined: `${agentName} joined the GitLawb network.`,
    agent_registered: `${agentName} registered an agent identity.`,
    identity_resolved: `Resolved GitLawb DID for ${agentName}.`,
    commit_pushed: `${agentName} pushed ${sha ? String(sha).slice(0, 8) : "a commit"} to ${repo}.`,
    ref_updated: `${repo} updated ${ref}.`,
    branch_created: `${agentName} created ${ref}.`,
    pr_opened: `${agentName} opened PR${pr ? ` #${pr}` : ""} on ${repo}.`,
    pr_reviewed: `${agentName} reviewed PR${pr ? ` #${pr}` : ""}.`,
    pr_merged: `${agentName} merged PR${pr ? ` #${pr}` : ""}.`,
    issue_created: `${agentName} opened an issue on ${repo}.`,
    task_delegated: `${agentName} delegated a task through GitLawb.`,
    app_published: `${repo} was published to GitLawb Playground.`,
    deploy_ready: `${repo} deployment is ready.`
  };
  return normalizeEvent({
    agent: agentName,
    session: sessionName,
    type,
    status: input.status || statusForType(type),
    phase: input.phase || phaseForType(type),
    tool: input.tool || toolMap[type] || "gitlawb.event",
    provider: input.provider || "GitLawb",
    model: input.model || "network",
    tokens: input.tokens ?? 0,
    durationMs: input.durationMs ?? 0,
    message: input.message || messages[type] || `${agentName} emitted ${type}.`,
    input,
    output: {
      ok: input.ok ?? true,
      repo,
      ref,
      sha,
      pr
    },
    metadata: {
      source: "gitlawb",
      role: input.role || "GitLawb Agent",
      did,
      handle: input.handle || agentName,
      node: input.node || "node.gitlawb.com",
      trustScore: input.trustScore,
      level: input.level,
      repos: input.repos,
      pushes: input.pushes,
      prs: input.prs,
      stars: input.stars,
      repo,
      ref,
      sha,
      pr,
      url: input.url || input.link || null
    }
  });
}

function gitLawbDemoEvents() {
  return [
    { type: "AgentJoined", agent: "Registry", role: "Identity", did: "did:key:z6MkRegistryDemoAgent", trustScore: 0.71, level: "active", repos: 2, pushes: 31, prs: 5, stars: 18, repo: "z6Mkp6zc/agentworld", node: "node.gitlawb.com" },
    { type: "RefUpdated", agent: "Scout", did: "did:key:z6MkScout9xR2vLabAgent", repo: "z6Mkp6zc/agentworld", ref: "main", sha: "8b71e3ca", trustScore: 0.82, level: "trusted", pushes: 85, prs: 13, stars: 42 },
    { type: "CommitPushed", agent: "Forge", did: "did:key:z6MkForge7pQ2BuildAgent", repo: "z6Mkp6zc/agentworld", ref: "world-extras", sha: "4f91a0dd", trustScore: 0.78, level: "trusted", pushes: 113, prs: 19, stars: 59 },
    { type: "PullRequestOpened", agent: "Forge", did: "did:key:z6MkForge7pQ2BuildAgent", repo: "z6Mkp6zc/agentworld", prNumber: 7, trustScore: 0.78, level: "trusted", pushes: 113, prs: 20, stars: 59 },
    { type: "TaskBroadcast", agent: "Oracle", did: "did:key:z6MkOracle8mT9SignalAgent", repo: "z6Mkp6zc/agentworld", message: "Oracle delegated replay QA to Patch.", trustScore: 0.88, level: "trusted", pushes: 126, prs: 21, stars: 73 },
    { type: "PullRequestReviewed", agent: "Patch", did: "did:key:z6MkPatch4nH7RecoveryAgent", repo: "z6Mkp6zc/agentworld", prNumber: 7, message: "Patch approved the world-extras PR.", trustScore: 0.69, level: "active", pushes: 60, prs: 12, stars: 34 },
    { type: "AppPublished", agent: "Oracle", did: "did:key:z6MkOracle8mT9SignalAgent", repo: "z6Mkp6zc/agentworld", url: "https://agentworld.gitlawb.app", trustScore: 0.88, level: "trusted", pushes: 126, prs: 21, stars: 74 }
  ];
}

function demoAgents() {
  return [
    { name: "Scout", role: "Research", x: 12.8, y: 14.8, did: "did:key:z6MkScout9xR2vLabAgent", handle: "@scout", node: "node.gitlawb.com", level: "trusted", trustScore: 0.82, repos: 5, pushes: 84, prs: 13, stars: 41 },
    { name: "Forge", role: "Builder", x: 28.4, y: 36.2, did: "did:key:z6MkForge7pQ2BuildAgent", handle: "@forge", node: "node2.gitlawb.com", level: "trusted", trustScore: 0.78, repos: 4, pushes: 112, prs: 19, stars: 58 },
    { name: "Relay", role: "Comms", x: 45.4, y: 13.8, did: "did:key:z6MkRelay2wQ5CommsAgent", handle: "@relay", node: "node3.gitlawb.com", level: "active", trustScore: 0.64, repos: 2, pushes: 37, prs: 6, stars: 22 },
    { name: "Oracle", role: "Analysis", x: 45.8, y: 29.8, did: "did:key:z6MkOracle8mT9SignalAgent", handle: "@oracle", node: "node.gitlawb.com", level: "trusted", trustScore: 0.88, repos: 6, pushes: 126, prs: 21, stars: 73 },
    { name: "Patch", role: "Fixer", x: 13.2, y: 35.4, did: "did:key:z6MkPatch4nH7RecoveryAgent", handle: "@patch", node: "node2.gitlawb.com", level: "active", trustScore: 0.69, repos: 3, pushes: 59, prs: 11, stars: 34 },
    { name: "Registry", role: "Identity", x: 9.4, y: 9.8, did: "did:key:z6MkRegistry5nD4IdentityAgent", handle: "@registry", node: "node.gitlawb.com", level: "trusted", trustScore: 0.91, repos: 7, pushes: 142, prs: 24, stars: 86 },
    { name: "Signal", role: "Monitor", x: 36.7, y: 11.4, did: "did:key:z6MkSignal3pL9MonitorAgent", handle: "@signal", node: "node2.gitlawb.com", level: "trusted", trustScore: 0.84, repos: 4, pushes: 96, prs: 17, stars: 51 },
    { name: "Courier", role: "Delivery", x: 22.1, y: 26.7, did: "did:key:z6MkCourier6fR1DeliveryAgent", handle: "@courier", node: "node3.gitlawb.com", level: "active", trustScore: 0.73, repos: 3, pushes: 68, prs: 9, stars: 29 },
    { name: "Atlas", role: "Mapper", x: 52.2, y: 34.6, did: "did:key:z6MkAtlas2vK8MapperAgent", handle: "@atlas", node: "node.gitlawb.com", level: "active", trustScore: 0.76, repos: 5, pushes: 77, prs: 14, stars: 46 }
  ];
}

function demoSkills(role) {
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

function demoServices(role) {
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

function demoRuns() {
  return [
    ["Scout", "launch-analysis", [["agent_joined", "success", "identity.resolve", "Resolved Scout DID and trust profile.", 90, 420], ["tool_call", "success", "web.search", "Collected reference launches and positioning.", 840, 3800], ["task_complete", "success", null, "Launch map ready for review.", 360, 1200]]],
    ["Forge", "ui-build", [["task_started", "info", null, "Building asset atlas pass.", 210, 800], ["commit_pushed", "success", "git.commit", "Pushed world renderer update.", 740, 2800], ["task_complete", "success", null, "UI build passed visual QA.", 410, 1200]]],
    ["Relay", "customer-replies", [["message", "success", "message.send", "Sent first follow-up draft.", 520, 1300], ["approval_wait", "warning", null, "Waiting for approval on pricing wording.", 80, 35000]]],
    ["Oracle", "market-map", [["tool_call", "success", "analysis.map", "Clustered product opportunities.", 1840, 9200], ["app_published", "success", "playground.publish", "Prepared Playground launch candidate.", 620, 2400], ["task_complete", "success", null, "Market map complete.", 360, 1400]]],
    ["Patch", "bug-fix", [["tool_failed", "error", "stripe.checkout", "Checkout returned missing price.", 6200, 41000], ["recovery", "success", "config.patch", "Recovered by switching Stripe price mode.", 680, 2800], ["task_complete", "success", null, "Checkout flow recovered.", 320, 1000]]],
    ["Registry", "identity-sync", [["identity_resolved", "success", "did.resolve", "Resolved agent DID, handle, node, and trust profile.", 240, 900], ["task_complete", "success", null, "Identity sync complete.", 190, 700]]],
    ["Signal", "signal-watch", [["tool_call", "success", "event.watch", "Watching GitLawb refs, PRs, and app publish events.", 720, 2600], ["token_spike", "warning", "cost.inspect", "Detected a cost spike in a long-running analysis job.", 5400, 1800], ["recovery", "success", "policy.apply", "Applied runtime budget guardrail.", 360, 1200]]],
    ["Courier", "handoff-route", [["task_delegated", "warning", "handoff.route", "Routed build QA from Forge to Patch.", 260, 1300], ["message", "success", "agent.message", "Delivered handoff summary to the next agent.", 420, 900], ["task_complete", "success", null, "Handoff route completed.", 210, 650]]],
    ["Atlas", "map-index", [["tool_call", "success", "map.index", "Indexed agents, buildings, routes, and replay zones.", 860, 3100], ["app_published", "success", "playground.publish", "Published the world state to the app preview.", 620, 2200], ["task_complete", "success", null, "Map index ready.", 240, 800]]]
  ];
}

async function seedDemoState(db) {
  if (db.agents?.length || db.events?.length) return false;
  const createdAt = now();
  db.agents = demoAgents().map((agent, index) => ({
    id: id("agt"),
    ...agent,
    xHandle: "@agentworld",
    status: index === 2 ? "idle" : index === 4 ? "success" : "working",
    tokens: 0,
    eventCount: 0,
    errorCount: 0,
    currentTask: "",
    skills: demoSkills(agent.role),
    services: demoServices(agent.role),
    createdAt,
    lastSeenAt: createdAt
  }));
  db.sessions = [];
  db.events = [];
  db.alerts = [];
  demoRuns().forEach(([agentName, sessionName, events], runIndex) => {
    const agent = db.agents.find((item) => item.name === agentName);
    const session = { id: id("ses"), agentId: agent.id, name: sessionName, status: "running", phase: "planning", tokens: 0, eventCount: 0, errorCount: 0, lastEventType: null, lastMessage: "", startedAt: new Date(Date.now() - (1200 - runIndex * 80) * 1000).toISOString(), endedAt: null };
    db.sessions.unshift(session);
    events.forEach(([type, status, tool, message, tokens, durationMs], eventIndex) => {
      const event = normalizeEvent({ agent: agent.name, session: session.name, type, status, tool, message, tokens, durationMs, metadata: { role: agent.role, did: agent.did, handle: agent.handle, node: agent.node, trustScore: agent.trustScore, level: agent.level, skills: agent.skills, services: agent.services } });
      event.agentId = agent.id;
      event.sessionId = session.id;
      event.createdAt = new Date(Date.now() - (1200 - runIndex * 80 - eventIndex * 24) * 1000).toISOString();
      db.events.unshift(event);
      agent.tokens += tokens;
      agent.eventCount += 1;
      agent.errorCount += status === "error" ? 1 : 0;
      agent.currentTask = message;
      agent.lastSeenAt = event.createdAt;
      session.tokens += tokens;
      session.eventCount += 1;
      session.errorCount += status === "error" ? 1 : 0;
      session.phase = event.phase;
      session.lastEventType = type;
      session.lastMessage = message;
      session.lastEventAt = event.createdAt;
    });
    const last = events.at(-1);
    session.status = last[0] === "task_complete" ? "complete" : last[0] === "approval_wait" ? "waiting" : "running";
    session.endedAt = session.status === "complete" ? session.lastEventAt : null;
    if (session.status === "complete") agent.status = "success";
    if (session.status === "waiting") agent.status = "idle";
  });
  db.alerts = db.events.filter((event) => event.status === "error" || event.status === "warning" || event.tokens >= 5000 || event.durationMs >= 30000).map((event) => ({ id: id("alt"), level: event.status === "error" ? "critical" : "warning", title: event.status === "error" ? `${event.agentName} hit an error` : `${event.agentName} needs attention`, message: event.message, eventId: event.id, agentName: event.agentName, sessionName: event.sessionName, createdAt: event.createdAt, resolvedAt: null }));
  return true;
}

function deriveAlert(event) {
  if (event.status === "error" || event.type === "error" || event.type === "tool_failed") {
    return {
      id: id("alt"),
      level: "critical",
      title: `${event.agentName} hit an error`,
      message: event.message || event.tool || "Agent event failed.",
      eventId: event.id,
      agentName: event.agentName,
      sessionName: event.sessionName,
      createdAt: event.createdAt,
      resolvedAt: null
    };
  }
  if (event.tokens >= 5000) {
    return {
      id: id("alt"),
      level: "warning",
      title: `${event.agentName} token spike`,
      message: `${event.tokens.toLocaleString()} tokens in one event.`,
      eventId: event.id,
      agentName: event.agentName,
      sessionName: event.sessionName,
      createdAt: event.createdAt,
      resolvedAt: null
    };
  }
  if (event.durationMs >= 30000) {
    return {
      id: id("alt"),
      level: "warning",
      title: `${event.agentName} slow task`,
      message: `${Math.round(event.durationMs / 1000)}s duration detected.`,
      eventId: event.id,
      agentName: event.agentName,
      sessionName: event.sessionName,
      createdAt: event.createdAt,
      resolvedAt: null
    };
  }
  if (event.type === "approval_wait") {
    return {
      id: id("alt"),
      level: "warning",
      title: `${event.agentName} waiting for approval`,
      message: event.message || "Agent paused and needs a human decision.",
      eventId: event.id,
      agentName: event.agentName,
      sessionName: event.sessionName,
      createdAt: event.createdAt,
      resolvedAt: null
    };
  }
  return null;
}

function resolveAlertsFor(db, event) {
  if (event.type !== "recovery" && event.type !== "task_complete") return;
  for (const alert of db.alerts) {
    if (!alert.resolvedAt && alert.agentName === event.agentName && alert.sessionName === event.sessionName) {
      alert.resolvedAt = event.createdAt;
      alert.resolutionEventId = event.id;
    }
  }
}

async function upsertFromEvent(db, event) {
  let agent = db.agents.find((item) => item.name === event.agentName);
  if (!agent) {
    agent = {
      id: id("agt"),
      name: event.agentName,
      role: event.metadata.role || "Agent",
      status: "idle",
      tokens: 0,
      eventCount: 0,
      errorCount: 0,
      currentTask: "",
      x: 16 + Math.random() * 18,
      y: 14 + Math.random() * 14,
      did: event.metadata.did || null,
      handle: event.metadata.handle || null,
      xHandle: event.metadata.x || null,
      node: event.metadata.node || null,
      level: event.metadata.level || null,
      trustScore: event.metadata.trustScore ?? null,
      repos: event.metadata.repos ?? null,
      pushes: event.metadata.pushes ?? null,
      prs: event.metadata.prs ?? null,
      stars: event.metadata.stars ?? null,
      skills: Array.isArray(event.metadata.skills) ? event.metadata.skills.map(String) : [],
      services: Array.isArray(event.metadata.services) ? event.metadata.services.map(String) : [],
      createdAt: now(),
      lastSeenAt: now()
    };
    db.agents.unshift(agent);
  } else {
    agent.did ||= event.metadata.did || null;
    agent.handle ||= event.metadata.handle || null;
    agent.xHandle ||= event.metadata.x || null;
    agent.node ||= event.metadata.node || null;
    agent.level ||= event.metadata.level || null;
    agent.trustScore ??= event.metadata.trustScore ?? null;
    agent.repos ??= event.metadata.repos ?? null;
    agent.pushes ??= event.metadata.pushes ?? null;
    agent.prs ??= event.metadata.prs ?? null;
    agent.stars ??= event.metadata.stars ?? null;
    if (Array.isArray(event.metadata.skills) && event.metadata.skills.length) agent.skills = event.metadata.skills.map(String);
    if (Array.isArray(event.metadata.services) && event.metadata.services.length) agent.services = event.metadata.services.map(String);
  }

  let session = db.sessions.find((item) => item.name === event.sessionName && item.agentId === agent.id);
  if (!session) {
    session = {
      id: id("ses"),
      agentId: agent.id,
      name: event.sessionName,
      status: "running",
      phase: "planning",
      tokens: 0,
      eventCount: 0,
      errorCount: 0,
      lastEventType: null,
      lastMessage: "",
      startedAt: now(),
      endedAt: null
    };
    db.sessions.unshift(session);
  }

  event.agentId = agent.id;
  event.sessionId = session.id;
  agent.status = event.status === "error" ? "error" : event.type === "task_complete" ? "success" : event.type === "approval_wait" ? "idle" : "working";
  agent.tokens += event.tokens;
  agent.eventCount = (agent.eventCount || 0) + 1;
  agent.errorCount = (agent.errorCount || 0) + (event.status === "error" ? 1 : 0);
  agent.currentTask = event.message || event.tool || event.type;
  agent.lastSeenAt = event.createdAt;
  session.tokens += event.tokens;
  session.eventCount += 1;
  session.errorCount = (session.errorCount || 0) + (event.status === "error" ? 1 : 0);
  session.phase = event.phase;
  session.lastEventType = event.type;
  session.lastMessage = event.message || event.tool || event.type;
  session.lastEventAt = event.createdAt;
  if (event.type === "task_complete") {
    session.status = "complete";
    session.endedAt = event.createdAt;
  } else if (event.status === "error") {
    session.status = "error";
  } else if (event.type === "recovery") {
    session.status = "running";
  } else if (event.type === "approval_wait") {
    session.status = "waiting";
  }
}

async function recordEvent(db, event) {
  await upsertFromEvent(db, event);
  db.events.unshift(event);
  const alert = deriveAlert(event);
  if (alert) db.alerts.unshift(alert);
  resolveAlertsFor(db, event);
  db.events = db.events.slice(0, 5000);
  db.alerts = db.alerts.slice(0, 1000);
  return { event, alert };
}

async function handleApi(req, res, pathname) {
  if (req.method === "OPTIONS") return send(res, 204, "");
  const db = await loadDb();
  if (await seedDemoState(db)) await saveDb(db);

  if (req.method === "GET" && pathname === "/v1/health") {
    return send(res, 200, { ok: true, name: "AgentsWorld", time: now() });
  }

  if (req.method === "GET" && pathname === "/v1/state") {
    return send(res, 200, {
      agents: db.agents,
      sessions: db.sessions,
      events: db.events.slice(0, 250),
      alerts: db.alerts.slice(0, 80)
    });
  }

  if (req.method === "GET" && pathname === "/v1/events/stream") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      "connection": "keep-alive",
      "access-control-allow-origin": "*"
    });
    res.write("event: ready\ndata: {}\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  if (req.method === "GET" && pathname === "/v1/adapters/gitlawb/status") {
    return send(res, 200, {
      ok: true,
      name: "gitlawb",
      ingest: "POST /v1/adapters/gitlawb/ingest",
      demo: "POST /v1/adapters/gitlawb/demo",
      accepts: ["AgentJoined", "RefUpdated", "CommitPushed", "PullRequestOpened", "PullRequestReviewed", "PullRequestMerged", "IssueCreated", "TaskBroadcast", "AppPublished"],
      mapsTo: ["agent_joined", "ref_updated", "commit_pushed", "pr_opened", "pr_reviewed", "pr_merged", "issue_created", "task_delegated", "app_published"]
    });
  }

  if (req.method === "POST" && pathname === "/v1/events") {
    const event = normalizeEvent(await readBody(req));
    const { alert } = await recordEvent(db, event);
    await saveDb(db);
    emit("event", event);
    if (alert) emit("alert", alert);
    emit("state", { agents: db.agents, sessions: db.sessions, alerts: db.alerts.slice(0, 80) });
    return send(res, 201, { event, alert });
  }

  if (req.method === "POST" && pathname === "/v1/adapters/gitlawb/ingest") {
    const input = await readBody(req);
    const items = Array.isArray(input) ? input : Array.isArray(input.events) ? input.events : [input];
    const results = [];
    for (const item of items) {
      const event = normalizeGitLawbEvent(item);
      const result = await recordEvent(db, event);
      results.push(result);
      emit("event", event);
      if (result.alert) emit("alert", result.alert);
    }
    await saveDb(db);
    emit("state", { agents: db.agents, sessions: db.sessions, alerts: db.alerts.slice(0, 80) });
    return send(res, 201, { ok: true, count: results.length, events: results.map((result) => result.event), alerts: results.map((result) => result.alert).filter(Boolean) });
  }

  if (req.method === "POST" && pathname === "/v1/adapters/gitlawb/demo") {
    const results = [];
    for (const item of gitLawbDemoEvents()) {
      const event = normalizeGitLawbEvent(item);
      const result = await recordEvent(db, event);
      results.push(result);
      emit("event", event);
      if (result.alert) emit("alert", result.alert);
    }
    await saveDb(db);
    emit("state", { agents: db.agents, sessions: db.sessions, alerts: db.alerts.slice(0, 80) });
    return send(res, 201, { ok: true, count: results.length, events: results.map((result) => result.event), alerts: results.map((result) => result.alert).filter(Boolean) });
  }

  if (req.method === "POST" && pathname === "/v1/agents") {
    const input = await readBody(req);
    const agent = {
      id: id("agt"),
      name: String(input.name || "new-agent"),
      role: String(input.role || "Agent"),
      status: "idle",
      tokens: 0,
      eventCount: 0,
      errorCount: 0,
      currentTask: "",
      x: Number(input.x || 20 + Math.random() * 16),
      y: Number(input.y || 16 + Math.random() * 12),
      did: input.did ? String(input.did) : null,
      handle: input.handle ? String(input.handle) : null,
      xHandle: input.xHandle ? String(input.xHandle) : null,
      node: input.node ? String(input.node) : null,
      level: input.level ? String(input.level) : null,
      trustScore: input.trustScore === undefined ? null : Number(input.trustScore),
      repos: input.repos === undefined ? null : Number(input.repos),
      pushes: input.pushes === undefined ? null : Number(input.pushes),
      prs: input.prs === undefined ? null : Number(input.prs),
      stars: input.stars === undefined ? null : Number(input.stars),
      skills: Array.isArray(input.skills) ? input.skills.map(String) : [],
      services: Array.isArray(input.services) ? input.services.map(String) : [],
      createdAt: now(),
      lastSeenAt: now()
    };
    db.agents.unshift(agent);
    await saveDb(db);
    emit("state", { agents: db.agents, sessions: db.sessions, alerts: db.alerts.slice(0, 80) });
    return send(res, 201, agent);
  }

  return send(res, 404, { error: "not_found" });
}

function serveStatic(req, res, pathname) {
  const safePath = {
    "/": "/website.html",
    "/website": "/website.html",
    "/app": "/index.html",
    "/dashboard": "/index.html"
  }[pathname] || pathname;
  const filePath = path.normalize(path.join(webRoot, safePath));
  if (!filePath.startsWith(webRoot)) return send(res, 403, "Forbidden");
  fs.readFile(filePath, (error, data) => {
    if (error) return send(res, 404, "Not found");
    res.writeHead(200, {
      "content-type": mime[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-cache"
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/v1/")) return await handleApi(req, res, url.pathname);
    serveStatic(req, res, url.pathname);
  } catch (error) {
    send(res, 500, { error: "server_error", message: error.message });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`AgentsWorld web/API running at http://localhost:${port}`);
});

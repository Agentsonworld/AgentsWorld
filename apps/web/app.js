const closeCamera = { x: -185, y: -580, zoom: 1.26 };
const overviewCamera = { x: -18, y: -250, zoom: 0.44 };

const state = {
  agents: [],
  sessions: [],
  events: [],
  alerts: [],
  selected: null,
  camera: { ...closeCamera },
  cameraTarget: null,
  followAgentId: null,
  layerMode: "world",
  publishMode: false,
  publishTimer: null,
  highlightedAgentId: null,
  highlightedBuildingId: null,
  drag: null,
  keys: new Set(),
  avatar: { x: 28, y: 24, walk: 0, facing: "down" },
  hitTargets: [],
  particles: [],
  beacons: [],
  routes: [],
  nearbyAgent: null,
  worldProfileAgentId: null,
  worldZoneBuildingId: null,
  time: 0,
  lastFrame: 0,
  replay: { active: false, events: [], index: 0, timer: null },
  buildings: [
    { id: "registry", name: "Agent Registry", x: 5, y: 7, w: 6, h: 5, color: "#2dd4bf", roof: "#073b3f", height: 104, kind: "identity", icon: "DID", style: "registry" },
    { id: "pr", name: "PR Arena", x: 23, y: 4, w: 7, h: 4, color: "#c084fc", roof: "#291044", height: 86, kind: "pull_requests", icon: "PR", style: "arena" },
    { id: "gate", name: "Ingress Gate", x: 43, y: 7, w: 6, h: 4, color: "#2dd4bf", roof: "#063c3b", height: 78, kind: "webhook", icon: "API", style: "gate" },
    { id: "memory", name: "Memory Vault", x: 13, y: 16, w: 6, h: 5, color: "#c084fc", roof: "#35105c", height: 96, kind: "memory", icon: "MEM", style: "archive" },
    { id: "command", name: "Command Core", x: 27, y: 17, w: 8, h: 6, color: "#8b7cff", roof: "#17101f", height: 138, kind: "config", icon: "CMD", style: "command" },
    { id: "tools", name: "Agent Garage", x: 42, y: 18, w: 7, h: 5, color: "#60a5fa", roof: "#16243e", height: 92, kind: "tools", icon: "AGT", style: "hall" },
    { id: "commits", name: "Commit Forge", x: 46, y: 27, w: 6, h: 5, color: "#f59e0b", roof: "#3b1f08", height: 102, kind: "commits", icon: "GIT", style: "forge" },
    { id: "issues", name: "Issue Board", x: 4, y: 31, w: 6, h: 5, color: "#fb7185", roof: "#3d1020", height: 82, kind: "issues", icon: "ISS", style: "board" },
    { id: "tower", name: "Alert Spire", x: 16, y: 28, w: 5, h: 7, color: "#fb7185", roof: "#6e0f2d", height: 150, kind: "alerts", icon: "ALT", style: "tower" },
    { id: "mine", name: "Token Reactor", x: 28, y: 33, w: 6, h: 4, color: "#f5d84b", roof: "#2b1807", height: 88, kind: "tokens", icon: "TOK", style: "mine" },
    { id: "replay", name: "Replay Lab", x: 40, y: 32, w: 7, h: 5, color: "#4ade80", roof: "#0b3d20", height: 82, kind: "replay", icon: "RPL", style: "replay" },
    { id: "publish", name: "Publish Tower", x: 51, y: 35, w: 5, h: 5, color: "#60a5fa", roof: "#0f2141", height: 124, kind: "deploy", icon: "APP", style: "publish" }
  ],
  paths: [],
  decor: []
};

const els = {
  canvas: document.getElementById("world"),
  agentList: document.getElementById("agentList"),
  timeline: document.getElementById("timeline"),
  alerts: document.getElementById("alerts"),
  inspector: document.getElementById("inspector"),
  selectedLabel: document.getElementById("selectedLabel"),
  streamStatus: document.getElementById("streamStatus"),
  agentCount: document.getElementById("agentCount"),
  eventCount: document.getElementById("eventCount")
};
els.modal = document.getElementById("modal");
els.modalEyebrow = document.getElementById("modalEyebrow");
els.modalTitle = document.getElementById("modalTitle");
els.modalBody = document.getElementById("modalBody");
els.worldToast = document.getElementById("worldToast");
els.sessionSelect = document.getElementById("sessionSelect");
els.replayProgress = document.getElementById("replayProgress");
els.replayLabel = document.getElementById("replayLabel");
els.replayMeta = document.getElementById("replayMeta");
els.proximityPrompt = document.getElementById("proximityPrompt");
els.proximityTitle = document.getElementById("proximityTitle");
els.proximityMeta = document.getElementById("proximityMeta");
els.proximityAgents = document.getElementById("proximityAgents");
els.agentWorldCard = document.getElementById("agentWorldCard");
els.agentWorldBody = document.getElementById("agentWorldBody");
els.agentWorldClose = document.getElementById("agentWorldClose");
els.zoneWorldCard = document.getElementById("zoneWorldCard");
els.zoneWorldTitle = document.getElementById("zoneWorldTitle");
els.zoneWorldBody = document.getElementById("zoneWorldBody");
els.zoneWorldClose = document.getElementById("zoneWorldClose");
els.modeWorldBtn = document.getElementById("modeWorldBtn");
els.modeNetworkBtn = document.getElementById("modeNetworkBtn");
els.modeReplayBtn = document.getElementById("modeReplayBtn");
els.followBtn = document.getElementById("followBtn");
els.publishModeBtn = document.getElementById("publishModeBtn");
els.gitlawbDemoBtn = document.getElementById("gitlawbDemoBtn");
els.publishHero = document.getElementById("publishHero");

const ctx = els.canvas.getContext("2d");
const tileW = 58;
const tileH = 30;
const mapW = 58;
const mapH = 42;
const assetAtlas = {
  buildings: {
    command: { trim: "#f5d84b", glow: "rgba(245,216,75,0.24)", sign: "OPS", accent: "#8b7cff" },
    hall: { trim: "#60a5fa", glow: "rgba(96,165,250,0.22)", sign: "HUB", accent: "#f5d84b" },
    gate: { trim: "#2dd4bf", glow: "rgba(45,212,191,0.25)", sign: "API", accent: "#67e8f9" },
    archive: { trim: "#c084fc", glow: "rgba(192,132,252,0.22)", sign: "MEM", accent: "#f4efe3" },
    tower: { trim: "#fb7185", glow: "rgba(251,113,133,0.24)", sign: "ALT", accent: "#f5d84b" },
    mine: { trim: "#f5d84b", glow: "rgba(245,216,75,0.22)", sign: "TOK", accent: "#c084fc" },
    replay: { trim: "#4ade80", glow: "rgba(74,222,128,0.2)", sign: "RUN", accent: "#86efac" },
    registry: { trim: "#2dd4bf", glow: "rgba(45,212,191,0.23)", sign: "DID", accent: "#f5d84b" },
    arena: { trim: "#c084fc", glow: "rgba(192,132,252,0.22)", sign: "PR", accent: "#60a5fa" },
    forge: { trim: "#f59e0b", glow: "rgba(245,158,11,0.22)", sign: "GIT", accent: "#f5d84b" },
    board: { trim: "#fb7185", glow: "rgba(251,113,133,0.2)", sign: "ISS", accent: "#f4efe3" },
    publish: { trim: "#60a5fa", glow: "rgba(96,165,250,0.24)", sign: "APP", accent: "#4ade80" }
  },
  agentSuits: ["#60a5fa", "#4ade80", "#f5d84b", "#c084fc", "#fb7185", "#2dd4bf"]
};

function seededNoise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function inWater(x, y) {
  const pond = Math.hypot(x - 49, y - 35) < 7.2;
  const river = Math.abs(y - (3.5 + Math.sin(x * 0.32) * 0.85)) < 0.45 && x > 3 && x < 36;
  return pond || river;
}

function initWorld() {
  const points = [
    [8, 12], [16, 20], [31, 22], [45, 21], [49, 30], [43, 35],
    [31, 35], [18, 32], [7, 34], [16, 20], [31, 22]
  ];
  const paths = new Set();
  function addPath(ax, ay, bx, by) {
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.round(ax + (bx - ax) * t);
      const y = Math.round(ay + (by - ay) * t);
      paths.add(`${x},${y}`);
      paths.add(`${x + 1},${y}`);
      paths.add(`${x},${y + 1}`);
    }
  }
  for (let i = 0; i < points.length - 1; i++) addPath(...points[i], ...points[i + 1]);
  addPath(31, 22, 27, 6);
  addPath(31, 22, 46, 9);
  addPath(31, 22, 16, 18);
  addPath(31, 22, 18, 31);
  addPath(31, 22, 43, 35);
  addPath(31, 22, 45, 21);
  addPath(45, 21, 49, 30);
  addPath(43, 35, 53, 37);
  addPath(8, 12, 27, 6);
  state.paths = paths;

  const decor = [];
  for (let x = 1; x < mapW - 1; x++) {
    for (let y = 1; y < mapH - 1; y++) {
      if (paths.has(`${x},${y}`) || inWater(x, y)) continue;
      const inBuilding = state.buildings.some((b) => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h + 2);
      if (inBuilding) continue;
      const n = seededNoise(x, y);
      if (n > 0.965) decor.push({ type: "tree", x, y, scale: 0.85 + seededNoise(y, x) * 0.45 });
      else if (n > 0.945) decor.push({ type: "rock", x, y, scale: 0.7 + seededNoise(x + 7, y) * 0.3 });
      else if (n > 0.925) decor.push({ type: "crystal", x, y, scale: 0.65 + seededNoise(x, y + 3) * 0.35 });
    }
  }
  state.decor = decor;
}

function iso(x, y) {
  return {
    x: (x - y) * tileW / 2,
    y: (x + y) * tileH / 2
  };
}

function screenPoint(x, y) {
  const p = iso(x, y);
  return {
    x: els.canvas.clientWidth / 2 + (p.x + state.camera.x) * state.camera.zoom,
    y: 80 + (p.y + state.camera.y) * state.camera.zoom
  };
}

function cameraForWorldPoint(x, y, zoom = state.camera.zoom) {
  const p = iso(x, y);
  return {
    x: (els.canvas.clientWidth * 0.52 - els.canvas.clientWidth / 2) / zoom - p.x,
    y: (els.canvas.clientHeight * 0.47 - 80) / zoom - p.y,
    zoom
  };
}

function setCameraTarget(x, y, zoom = state.camera.zoom, immediate = false) {
  const next = cameraForWorldPoint(x, y, zoom);
  state.cameraTarget = next;
  if (immediate) state.camera = { ...next };
}

function updateCamera() {
  const follow = state.followAgentId ? state.agents.find((agent) => agent.id === state.followAgentId) : null;
  if (follow) setCameraTarget(follow.x, follow.y, Math.max(state.camera.zoom, 1.18));
  if (!state.cameraTarget) return;
  state.camera.x += (state.cameraTarget.x - state.camera.x) * 0.08;
  state.camera.y += (state.cameraTarget.y - state.camera.y) * 0.08;
  state.camera.zoom += (state.cameraTarget.zoom - state.camera.zoom) * 0.06;
  if (
    Math.abs(state.cameraTarget.x - state.camera.x) < 0.08 &&
    Math.abs(state.cameraTarget.y - state.camera.y) < 0.08 &&
    Math.abs(state.cameraTarget.zoom - state.camera.zoom) < 0.004 &&
    !follow
  ) {
    state.camera = { ...state.cameraTarget };
    state.cameraTarget = null;
  }
}

function setLayerMode(mode) {
  state.layerMode = mode;
  for (const [button, value] of [
    [els.modeWorldBtn, "world"],
    [els.modeNetworkBtn, "network"],
    [els.modeReplayBtn, "replay"]
  ]) {
    button?.classList.toggle("active", mode === value);
  }
  showToast(`${mode[0].toUpperCase()}${mode.slice(1)} layer`);
}

function setFollowAgent(agent, enabled = true) {
  state.followAgentId = enabled && agent ? agent.id : null;
  if (els.followBtn) els.followBtn.textContent = state.followAgentId ? `Follow ${agent.name}` : "Follow off";
  if (agent && enabled) setCameraTarget(agent.x, agent.y, Math.max(state.camera.zoom, 1.18));
}

function resize() {
  const rect = els.canvas.getBoundingClientRect();
  els.canvas.width = Math.max(400, Math.floor(rect.width * devicePixelRatio));
  els.canvas.height = Math.max(300, Math.floor(rect.height * devicePixelRatio));
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function colorForStatus(status) {
  return {
    working: "#60a5fa",
    error: "#fb7185",
    success: "#4ade80",
    idle: "#f5d84b"
  }[status] || "#f5d84b";
}

function terrainAt(x, y) {
  if (inWater(x, y)) return "water";
  if (state.paths.has(`${x},${y}`)) return "path";
  const n = seededNoise(x, y);
  if (n > 0.88) return "flower";
  if (n < 0.12) return "moss";
  return "grass";
}

function terrainColor(type, x, y) {
  const n = seededNoise(x, y);
  if (type === "water") return `rgba(${35 + n * 12}, ${124 + n * 28}, ${168 + n * 38}, 0.72)`;
  if (type === "path") return n > 0.45 ? "#3a2f1f" : "#302719";
  if (type === "flower") return n > 0.94 ? "rgba(113, 118, 255, 0.18)" : "rgba(245, 216, 75, 0.13)";
  if (type === "moss") return "rgba(86, 196, 112, 0.14)";
  return n > 0.5 ? "rgba(55, 105, 65, 0.45)" : "rgba(44, 89, 58, 0.48)";
}

function shade(hex, amount) {
  const raw = hex.replace("#", "");
  const num = parseInt(raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount * 255));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount * 255));
  const b = Math.max(0, Math.min(255, (num & 255) + amount * 255));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function hashText(text = "") {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

function suitForAgent(agent) {
  if (agent.status === "error") return "#fb7185";
  if (agent.status === "success") return "#4ade80";
  return assetAtlas.agentSuits[hashText(agent.id || agent.name) % assetAtlas.agentSuits.length];
}

function agentIdentity(agent) {
  const hash = hashText(`${agent.id || ""}:${agent.name || ""}`);
  const suffix = (agent.did || agent.identity?.did || `did:key:z6Mk${(hash.toString(36) + "000000000000").slice(0, 12)}`);
  const trust = agent.trustScore ?? agent.identity?.trustScore ?? Number((0.42 + (hash % 49) / 100).toFixed(2));
  return {
    did: suffix,
    shortDid: suffix.replace("did:key:", "").slice(0, 10),
    handle: agent.handle || agent.identity?.handle || `@${String(agent.name || "agent").toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
    node: agent.node || agent.identity?.node || ["node.gitlawb.com", "node2.gitlawb.com", "node3.gitlawb.com"][hash % 3],
    trustScore: trust,
    level: agent.level || agent.identity?.level || (trust >= 0.78 ? "trusted" : trust >= 0.58 ? "active" : "newcomer"),
    repos: agent.repos ?? agent.identity?.repos ?? 1 + (hash % 6),
    pushes: agent.pushes ?? agent.identity?.pushes ?? 8 + (hash % 92),
    prs: agent.prs ?? agent.identity?.prs ?? 1 + (hash % 18),
    stars: agent.stars ?? agent.identity?.stars ?? 3 + (hash % 64),
    x: agent.xHandle || agent.identity?.x || ["@agentsworld", "@gitlawb", "@builder_agent"][hash % 3]
  };
}

function spawnParticles(x, y, color, count = 12, kind = "spark") {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      z: 0,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      vz: 0.35 + Math.random() * 0.6,
      life: 1,
      decay: 0.012 + Math.random() * 0.012,
      color,
      kind
    });
  }
}

function targetForEvent(event) {
  if (["agent_joined", "identity_resolved", "agent_registered"].includes(event.type)) return state.buildings.find((b) => b.id === "registry");
  if (["commit_pushed", "ref_updated", "branch_created"].includes(event.type)) return state.buildings.find((b) => b.id === "commits");
  if (["pr_opened", "pr_reviewed", "pr_merged"].includes(event.type)) return state.buildings.find((b) => b.id === "pr");
  if (["issue_created", "issue_triaged", "task_delegated"].includes(event.type)) return state.buildings.find((b) => b.id === "issues");
  if (["app_published", "deploy_started", "deploy_ready"].includes(event.type)) return state.buildings.find((b) => b.id === "publish");
  if (event.status === "error" || event.type === "tool_failed") return state.buildings.find((b) => b.id === "tower");
  if (event.type === "approval_wait") return state.buildings.find((b) => b.id === "tower");
  if (event.type === "task_complete") return state.buildings.find((b) => b.id === "replay");
  if (event.type === "memory_write") return state.buildings.find((b) => b.id === "memory");
  if (event.type === "recovery") return state.buildings.find((b) => b.id === "command");
  if (event.type === "message") return state.buildings.find((b) => b.id === "gate");
  if (event.type === "tool_result") return state.buildings.find((b) => b.id === "tools");
  if (event.tokens > 2500) return state.buildings.find((b) => b.id === "mine");
  if (event.type === "tool_call") return state.buildings.find((b) => b.id === "tools");
  return state.buildings.find((b) => b.id === "command");
}

function applyEventMotion(event) {
  const agent = state.agents.find((item) => item.id === event.agentId || item.name === event.agentName);
  const target = targetForEvent(event);
  if (!agent || !target) return;
  const offset = agentFormationOffset(agent);
  const from = { x: agent.x, y: agent.y };
  agent.targetX = target.x + target.w / 2 + offset.x;
  agent.targetY = target.y + target.h + offset.y;
  agent.pulse = 1;
  agent.bubble = 1;
  agent.lastMessage = event.tool ? `${event.type}: ${event.tool}` : event.message || event.type;
  agent.trail = agent.trail || [];
  target.pulse = 1;
  target.lastEvent = event.type;
  target.activeState = event.type;
  target.activeLevel = event.severity || event.status;
  const color = event.status === "error" ? "#fb7185" : event.type === "task_complete" ? "#4ade80" : event.tokens > 2500 ? "#f5d84b" : "#60a5fa";
  state.highlightedAgentId = agent.id;
  state.highlightedBuildingId = target.id;
  state.routes.unshift({
    agentId: agent.id,
    points: [from, { x: (from.x + agent.targetX) / 2, y: (from.y + agent.targetY) / 2 - 2 }, { x: agent.targetX, y: agent.targetY }],
    color: eventColor(event, color),
    label: event.type,
    life: 1
  });
  state.routes = state.routes.slice(0, 18);
  state.beacons.unshift({
    x: target.x + target.w / 2,
    y: target.y + target.h / 2,
    text: event.type,
    subtext: event.tool || event.phase || event.status,
    color: eventColor(event, color),
    life: 1
  });
  state.beacons = state.beacons.slice(0, 12);
  if (state.layerMode === "replay" || state.replay.active) setCameraTarget(target.x + target.w / 2, target.y + target.h / 2, Math.max(state.camera.zoom, 1.15));
  spawnParticles(target.x + target.w / 2, target.y + target.h / 2, color, event.status === "error" ? 28 : 16);
}

function agentFormationOffset(agent) {
  const index = Math.max(0, state.agents.findIndex((item) => item.id === agent.id || item.name === agent.name));
  const offsets = [
    { x: -3.2, y: 0.7 },
    { x: 3.1, y: 0.4 },
    { x: -1.8, y: 2.8 },
    { x: 2.2, y: 3.1 },
    { x: 0.1, y: 4.6 },
    { x: -4.2, y: 3.8 },
    { x: 4.4, y: 3.8 }
  ];
  return offsets[index % offsets.length];
}

function updateAgents() {
  const speed = 0.13;
  updateCamera();
  let moved = false;
  if (state.keys.has("w")) { state.avatar.y -= speed; state.avatar.facing = "up"; moved = true; }
  if (state.keys.has("s")) { state.avatar.y += speed; state.avatar.facing = "down"; moved = true; }
  if (state.keys.has("a")) { state.avatar.x -= speed; state.avatar.facing = "left"; moved = true; }
  if (state.keys.has("d")) { state.avatar.x += speed; state.avatar.facing = "right"; moved = true; }
  state.avatar.x = Math.max(2, Math.min(56, state.avatar.x));
  state.avatar.y = Math.max(2, Math.min(40, state.avatar.y));
  if (moved) state.avatar.walk += 0.18;

  for (const agent of state.agents) {
    agent.targetX ??= agent.x;
    agent.targetY ??= agent.y;
    const dx = agent.targetX - agent.x;
    const dy = agent.targetY - agent.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.05) {
      agent.x += dx * 0.025;
      agent.y += dy * 0.025;
      agent.walk = (agent.walk || 0) + 0.12;
      agent.trail = (agent.trail || []).map((point) => ({ ...point, life: point.life - 0.035 })).filter((point) => point.life > 0);
      if (!agent.trail.length || Math.hypot(agent.trail[0].x - agent.x, agent.trail[0].y - agent.y) > 0.42) {
        agent.trail.unshift({ x: agent.x, y: agent.y, life: 1 });
        agent.trail = agent.trail.slice(0, 20);
      }
    } else {
      agent.walk = (agent.walk || 0) + 0.025;
      agent.trail = (agent.trail || []).map((point) => ({ ...point, life: point.life - 0.02 })).filter((point) => point.life > 0);
    }
    agent.pulse = Math.max(0, (agent.pulse || 0) - 0.018);
    agent.bubble = Math.max(0, (agent.bubble || 0) - 0.008);
  }
  for (const building of state.buildings) {
    building.pulse = Math.max(0, (building.pulse || 0) - 0.014);
    if (building.pulse <= 0.02) {
      building.activeState = null;
      building.activeLevel = null;
    }
  }
  state.routes = state.routes.map((route) => ({ ...route, life: route.life - 0.006 })).filter((route) => route.life > 0);
  state.beacons = state.beacons.map((beacon) => ({ ...beacon, life: beacon.life - 0.012 })).filter((beacon) => beacon.life > 0);
  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;
    p.vz -= 0.018;
    p.life -= p.decay;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  state.time += 0.004;
}

function drawTile(x, y, fill, stroke = "rgba(255,255,255,0.06)") {
  const p = screenPoint(x, y);
  const z = state.camera.zoom;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - tileH * z / 2);
  ctx.lineTo(p.x + tileW * z / 2, p.y);
  ctx.lineTo(p.x, p.y + tileH * z / 2);
  ctx.lineTo(p.x - tileW * z / 2, p.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawWorldPolyline(points, color, width = 2) {
  if (points.length < 2) return;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const p = screenPoint(x, y);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = width * state.camera.zoom;
  ctx.stroke();
}

function drawDataRoutes() {
  const centers = Object.fromEntries(state.buildings.map((b) => [b.id, [b.x + b.w / 2, b.y + b.h / 2]]));
  const routes = [
    ["registry", "command", "#2dd4bf"],
    ["pr", "command", "#c084fc"],
    ["gate", "command", "#2dd4bf"],
    ["command", "tools", "#60a5fa"],
    ["command", "memory", "#c084fc"],
    ["tools", "commits", "#f59e0b"],
    ["commits", "pr", "#f59e0b"],
    ["issues", "tower", "#fb7185"],
    ["tools", "mine", "#f5d84b"],
    ["tower", "command", "#fb7185"],
    ["replay", "command", "#4ade80"],
    ["publish", "replay", "#60a5fa"]
  ];
  for (const [a, b, color] of routes) {
    const from = centers[a];
    const to = centers[b];
    if (!from || !to) continue;
    const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + Math.sin(state.time * 2) * 0.2];
    ctx.globalAlpha = 0.16;
    drawWorldPolyline([from, mid, to], color, 8);
    ctx.globalAlpha = 0.65;
    drawWorldPolyline([from, mid, to], color, 2);
    const t = (state.time * 0.35 + seededNoise(from[0], to[1])) % 1;
    const px = from[0] + (to[0] - from[0]) * t;
    const py = from[1] + (to[1] - from[1]) * t;
    const p = screenPoint(px, py);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5 * state.camera.zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawEventRoutes() {
  const z = state.camera.zoom;
  for (const route of state.routes) {
    const alpha = Math.max(0, Math.min(1, route.life));
    ctx.globalAlpha = 0.18 * alpha;
    drawWorldPolyline(route.points.map((point) => [point.x, point.y]), route.color, 9);
    ctx.globalAlpha = 0.85 * alpha;
    drawWorldPolyline(route.points.map((point) => [point.x, point.y]), route.color, 2.2);
    const t = (1 - route.life) % 1;
    const a = route.points[0];
    const b = route.points[2] || route.points[1];
    const p = screenPoint(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    ctx.fillStyle = route.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8 * z, 4.5 * z, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawAgentTrails() {
  const z = state.camera.zoom;
  for (const agent of state.agents) {
    const color = colorForStatus(agent.status);
    for (const point of agent.trail || []) {
      const p = screenPoint(point.x, point.y);
      ctx.globalAlpha = Math.max(0, point.life) * 0.42;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 3 * z, 9 * z * point.life, 3.5 * z * point.life, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawEventBeacons() {
  const z = state.camera.zoom;
  ctx.textAlign = "center";
  for (const beacon of state.beacons) {
    const p = screenPoint(beacon.x, beacon.y);
    const lift = (1 - beacon.life) * 34 * z;
    const alpha = Math.max(0, Math.min(1, beacon.life));
    const width = Math.max(94, beacon.text.length * 8 + 26) * z;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(6,8,12,0.88)";
    ctx.fillRect(p.x - width / 2, p.y - 70 * z - lift, width, 34 * z);
    ctx.strokeStyle = beacon.color;
    ctx.strokeRect(p.x - width / 2, p.y - 70 * z - lift, width, 34 * z);
    ctx.fillStyle = beacon.color;
    ctx.font = `${10 * z}px ui-monospace, monospace`;
    ctx.fillText(beacon.text, p.x, p.y - 55 * z - lift);
    ctx.fillStyle = "#f4efe3";
    ctx.font = `${8 * z}px ui-monospace, monospace`;
    ctx.fillText(beacon.subtext || "event", p.x, p.y - 43 * z - lift);
  }
  ctx.globalAlpha = 1;
}

function drawFederationMesh() {
  const nodes = [
    { label: "node.gitlawb", x: 9, y: 8, color: "#2dd4bf" },
    { label: "node2", x: 51, y: 14, color: "#60a5fa" },
    { label: "node3", x: 49, y: 37, color: "#4ade80" },
    { label: "playground", x: 28, y: 4, color: "#c084fc" }
  ];
  const z = state.camera.zoom;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const pulse = (state.time * 0.22 + seededNoise(i, j)) % 1;
      ctx.globalAlpha = 0.11;
      drawWorldPolyline([[a.x, a.y], [(a.x + b.x) / 2, (a.y + b.y) / 2 - 3], [b.x, b.y]], a.color, 3);
      const px = a.x + (b.x - a.x) * pulse;
      const py = a.y + (b.y - a.y) * pulse - Math.sin(pulse * Math.PI) * 3;
      const p = screenPoint(px, py);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.6 * z, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  for (const node of nodes) {
    const p = screenPoint(node.x, node.y);
    ctx.fillStyle = "rgba(5,8,12,0.74)";
    ctx.fillRect(p.x - 40 * z, p.y - 16 * z, 80 * z, 18 * z);
    ctx.strokeStyle = node.color;
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(p.x - 40 * z, p.y - 16 * z, 80 * z, 18 * z);
    ctx.globalAlpha = 1;
    ctx.fillStyle = node.color;
    ctx.font = `${8.5 * z}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(node.label, p.x, p.y - 4 * z);
  }
  ctx.restore();
}

function drawNetworkOverlay(width, height) {
  if (state.layerMode !== "network") return;
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "rgba(3, 10, 16, 0.42)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 12; i++) {
    const y = ((state.time * 80 + i * 72) % (height + 80)) - 40;
    const grad = ctx.createLinearGradient(0, y, width, y + 24);
    grad.addColorStop(0, "rgba(45,212,191,0)");
    grad.addColorStop(0.5, "rgba(45,212,191,0.16)");
    grad.addColorStop(1, "rgba(96,165,250,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, width, 2);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(6,8,12,0.82)";
  ctx.fillRect(18, 18, 214, 90);
  ctx.strokeStyle = "rgba(45,212,191,0.34)";
  ctx.strokeRect(18, 18, 214, 90);
  ctx.fillStyle = "#9ffbf1";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("GITLAWB NETWORK LAYER", 32, 39);
  ctx.fillStyle = "#f4efe3";
  ctx.fillText("3 nodes live", 32, 61);
  ctx.fillText(`${state.events.filter((event) => ["ref_updated", "commit_pushed"].includes(event.type)).length} git events`, 32, 80);
  ctx.fillText(`${state.agents.length} visible agents`, 32, 99);
  ctx.restore();
}

function drawReplayOverlay(width, height) {
  if (state.layerMode !== "replay") return;
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#4ade80";
  for (let i = 0; i < 9; i++) {
    const x = ((state.time * 130 + i * 140) % (width + 120)) - 60;
    ctx.fillRect(x, 0, 1.5, height);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(6,8,12,0.78)";
  ctx.fillRect(18, 18, 190, 62);
  ctx.strokeStyle = "rgba(74,222,128,0.36)";
  ctx.strokeRect(18, 18, 190, 62);
  ctx.fillStyle = "#86efac";
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("REPLAY LAYER", 32, 39);
  ctx.fillStyle = "#f4efe3";
  ctx.fillText(`${state.sessions.length} sessions indexed`, 32, 61);
  ctx.restore();
}

function drawDiamondAt(p, z, fill, stroke = "rgba(255,255,255,0.06)") {
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - tileH * z / 2);
  ctx.lineTo(p.x + tileW * z / 2, p.y);
  ctx.lineTo(p.x, p.y + tileH * z / 2);
  ctx.lineTo(p.x - tileW * z / 2, p.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawWaterTile(x, y) {
  const p = screenPoint(x, y);
  const z = state.camera.zoom;
  drawDiamondAt(p, z, terrainColor("water", x, y), "rgba(147, 197, 253, 0.18)");
  if (seededNoise(x + 41, y + 17) > 0.92) {
    const glintOffset = (seededNoise(x + 13, y + 29) - 0.5) * 3 * z;
    ctx.fillStyle = "rgba(224, 242, 254, 0.75)";
    ctx.fillRect(p.x - 2 * z, p.y - 1 * z + glintOffset, 4 * z, 2 * z);
  }
}

function drawPathTile(x, y) {
  drawTile(x, y, terrainColor("path", x, y), "rgba(245,216,75,0.06)");
  const p = screenPoint(x, y);
  const z = state.camera.zoom;
  if (seededNoise(x, y) > 0.7) {
    ctx.fillStyle = "rgba(245,216,75,0.16)";
    ctx.fillRect(p.x - 5 * z, p.y - 1 * z, 10 * z, 2 * z);
  }
}

function drawOpsBaseFoundation() {
  const center = { x: 28, y: 23 };
  for (let x = 16; x <= 42; x++) {
    for (let y = 10; y <= 35; y++) {
      const d = Math.abs(x - center.x) + Math.abs(y - center.y);
      if (d > 18 || inWater(x, y)) continue;
      const ring = d > 14;
      const core = d < 7;
      drawTile(
        x,
        y,
        core ? "rgba(17, 22, 35, 0.72)" : ring ? "rgba(245,216,75,0.055)" : "rgba(24, 34, 39, 0.52)",
        ring ? "rgba(245,216,75,0.14)" : "rgba(96,165,250,0.11)"
      );
    }
  }

  const c = screenPoint(center.x, center.y);
  const z = state.camera.zoom;
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = "#f5d84b";
  ctx.lineWidth = 2 * z;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 18 * z, (120 + i * 58) * z, (42 + i * 20) * z, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const pads = [
    [22, 21, "#c084fc"],
    [34, 22, "#60a5fa"],
    [27, 29, "#f5d84b"],
    [34, 30, "#4ade80"]
  ];
  for (const [x, y, color] of pads) {
    const p = screenPoint(x, y);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 36 * z, 15 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawCampusPlatform(building) {
  const asset = assetAtlas.buildings[building.style] || assetAtlas.buildings.command;
  for (let x = building.x - 1; x <= building.x + building.w; x++) {
    for (let y = building.y - 1; y <= building.y + building.h + 1; y++) {
      if (x < 0 || y < 0 || x >= mapW || y >= mapH || inWater(x, y)) continue;
      const edge = x === building.x - 1 || x === building.x + building.w || y === building.y - 1 || y === building.y + building.h + 1;
      drawTile(
        x,
        y,
        edge ? "rgba(245,216,75,0.085)" : "rgba(18,22,28,0.62)",
        edge ? asset.trim : "rgba(255,255,255,0.045)"
      );
    }
  }
  const c = screenPoint(building.x + building.w / 2 - 0.5, building.y + building.h + 0.7);
  const z = state.camera.zoom;
  ctx.fillStyle = asset.glow;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, building.w * 28 * z, 18 * z, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTinyLamp(x, y, color = "#f5d84b") {
  const p = screenPoint(x, y);
  const z = state.camera.zoom;
  ctx.fillStyle = "rgba(0,0,0,0.36)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 2 * z, 6 * z, 3 * z, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a22";
  ctx.fillRect(p.x - 1.4 * z, p.y - 14 * z, 2.8 * z, 16 * z);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 16 * z, 5 * z + Math.sin(state.time * 90 + x) * z, 0, Math.PI * 2);
  ctx.fill();
}

function drawDecor(item) {
  const p = screenPoint(item.x, item.y);
  const z = state.camera.zoom * item.scale;
  if (item.type === "tree") {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(p.x + 5 * z, p.y + 3 * z, 15 * z, 6 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f7a45";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 31 * z, 12 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2fb866";
    ctx.beginPath();
    ctx.arc(p.x - 6 * z, p.y - 24 * z, 10 * z, 0, Math.PI * 2);
    ctx.arc(p.x + 6 * z, p.y - 24 * z, 10 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5b3a1d";
    ctx.fillRect(p.x - 2.5 * z, p.y - 20 * z, 5 * z, 20 * z);
  } else if (item.type === "rock") {
    ctx.fillStyle = "#5f6670";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 8 * z, 12 * z, 8 * z, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a929f";
    ctx.fillRect(p.x - 3 * z, p.y - 14 * z, 7 * z, 3 * z);
  } else if (item.type === "crystal") {
    ctx.fillStyle = "rgba(96,165,250,0.26)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 12 * z, 16 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 34 * z);
    ctx.lineTo(p.x + 9 * z, p.y - 10 * z);
    ctx.lineTo(p.x, p.y - 2 * z);
    ctx.lineTo(p.x - 9 * z, p.y - 10 * z);
    ctx.closePath();
    ctx.fill();
  }
}

function drawDistrictLabels() {
  const labels = [
    ["Identity", 8.5, 6.9, "#2dd4bf"],
    ["PR Ring", 28.5, 3.4, "#c084fc"],
    ["Ingress", 42, 6.5, "#2dd4bf"],
    ["Run Core", 26.5, 13.2, "#8b7cff"],
    ["Commit Forge", 49, 19, "#f59e0b"],
    ["Issues", 8.8, 25, "#fb7185"],
    ["Replay", 40, 36.7, "#4ade80"],
    ["Publish", 50.5, 39, "#60a5fa"]
  ];
  for (const [text, x, y, color] of labels) {
    const p = screenPoint(x, y);
    const z = state.camera.zoom;
    ctx.fillStyle = "rgba(8,9,11,0.52)";
    ctx.fillRect(p.x - 42 * z, p.y - 10 * z, 84 * z, 20 * z);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(p.x - 42 * z, p.y - 10 * z, 84 * z, 20 * z);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f4efe3";
    ctx.font = `${10 * z}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(text, p.x, p.y + 4 * z);
  }
}

function drawParticle(particle) {
  const p = screenPoint(particle.x, particle.y);
  const z = state.camera.zoom;
  ctx.globalAlpha = Math.max(0, particle.life);
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y - particle.z * z - 18 * z, (2.5 + particle.life * 2) * z, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function eventColor(eventOrType, fallback = "#60a5fa") {
  const type = typeof eventOrType === "string" ? eventOrType : eventOrType?.type;
  const status = typeof eventOrType === "string" ? "" : eventOrType?.status;
  if (status === "error" || type === "tool_failed" || type === "error") return "#fb7185";
  if (type === "task_complete" || type === "recovery" || type === "tool_result") return "#4ade80";
  if (type === "approval_wait" || type === "token_spike") return "#f5d84b";
  if (type === "memory_write") return "#c084fc";
  if (type === "message") return "#2dd4bf";
  if (["agent_joined", "identity_resolved", "agent_registered"].includes(type)) return "#2dd4bf";
  if (["commit_pushed", "ref_updated", "branch_created"].includes(type)) return "#f59e0b";
  if (["pr_opened", "pr_reviewed", "pr_merged"].includes(type)) return "#c084fc";
  if (["issue_created", "issue_triaged", "task_delegated"].includes(type)) return "#fb7185";
  if (["app_published", "deploy_started", "deploy_ready"].includes(type)) return "#60a5fa";
  if (type === "task_started") return "#f4efe3";
  return fallback;
}

function drawBuilding(building) {
  drawCampusPlatform(building);
  const asset = assetAtlas.buildings[building.style] || assetAtlas.buildings.command;
  for (let x = 0; x < building.w; x++) {
    for (let y = 0; y < building.h; y++) {
      drawTile(building.x + x, building.y + y, "rgba(255,255,255,0.055)", "rgba(245,216,75,0.1)");
    }
  }
  const base = screenPoint(building.x + building.w / 2 - 0.5, building.y + building.h / 2 - 0.5);
  const z = state.camera.zoom;
  const width = building.w * tileW * 0.42 * z;
  const depth = building.h * tileH * 0.35 * z;
  const height = building.height * z;
  if (building.pulse > 0) {
    ctx.beginPath();
    ctx.arc(base.x, base.y - height / 2, (46 + building.pulse * 46) * z, 0, Math.PI * 2);
    ctx.strokeStyle = building.color;
    ctx.globalAlpha = building.pulse * 0.32;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (state.highlightedBuildingId === building.id) {
    ctx.strokeStyle = asset.trim;
    ctx.lineWidth = 3 * z;
    ctx.globalAlpha = 0.5 + Math.sin(state.time * 120) * 0.18;
    ctx.beginPath();
    ctx.ellipse(base.x, base.y - height * 0.38, width * 0.92, height * 0.56, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(base.x + 14 * z, base.y + 8 * z, width * 0.78, 16 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  const left = base.x - width / 2;
  const right = base.x + width / 2;
  const top = base.y - height;
  const mid = base.y - depth;
  const wallLeft = shade(building.color, -0.28);
  const wallRight = shade(building.color, -0.1);

  ctx.fillStyle = wallLeft;
  ctx.beginPath();
  ctx.moveTo(left, mid);
  ctx.lineTo(base.x, base.y);
  ctx.lineTo(base.x, top + height * 0.45);
  ctx.lineTo(left, top + height * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.34)";
  ctx.stroke();

  ctx.fillStyle = wallRight;
  ctx.beginPath();
  ctx.moveTo(right, mid);
  ctx.lineTo(base.x, base.y);
  ctx.lineTo(base.x, top + height * 0.45);
  ctx.lineTo(right, top + height * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.stroke();

  ctx.fillStyle = building.roof || building.color;
  ctx.beginPath();
  ctx.moveTo(base.x, top);
  ctx.lineTo(right, top + height * 0.15);
  ctx.lineTo(base.x, top + height * 0.45);
  ctx.lineTo(left, top + height * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.26)";
  ctx.stroke();
  ctx.strokeStyle = asset.trim;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2 * z;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (building.style === "command") {
    drawTinyLamp(building.x + 0.1, building.y + building.h + 0.6, asset.trim);
    drawTinyLamp(building.x + building.w - 0.1, building.y + building.h + 0.6, asset.trim);
    ctx.fillStyle = "#0b0b12";
    ctx.fillRect(base.x - 10 * z, top - 58 * z, 20 * z, 58 * z);
    ctx.fillStyle = "#f5d84b";
    ctx.fillRect(base.x - 5 * z, top - 72 * z, 10 * z, 16 * z);
    ctx.strokeStyle = "rgba(245,216,75,0.75)";
    ctx.beginPath();
    ctx.arc(base.x, top - 40 * z, 24 * z + Math.sin(state.time * 80) * 4 * z, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(245,216,75,0.18)";
    ctx.fillRect(base.x - 22 * z, top + 18 * z, 44 * z, 30 * z);
    ctx.strokeStyle = "rgba(245,216,75,0.5)";
    ctx.strokeRect(base.x - 22 * z, top + 18 * z, 44 * z, 30 * z);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? "#f5d84b" : "#f8fafc";
      ctx.fillRect(base.x - 39 * z + i * 26 * z, top + 52 * z, 10 * z, 16 * z);
    }
  } else if (building.style === "hall") {
    ctx.fillStyle = "#f5d84b";
    ctx.fillRect(base.x - 52 * z, top + 28 * z, 104 * z, 17 * z);
    ctx.fillStyle = "#111318";
    ctx.font = `${8 * z}px ui-monospace, monospace`;
    ctx.fillText("AGENT HALL", base.x, top + 40 * z);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(left + 8 * z, top - 9 * z, 22 * z, 12 * z);
    ctx.fillStyle = "#60a5fa";
    ctx.fillRect(right - 30 * z, top - 9 * z, 22 * z, 12 * z);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 1 ? "#0b1220" : "#12213b";
      ctx.fillRect(base.x - 45 * z + i * 31 * z, top + 58 * z, 22 * z, 28 * z);
      ctx.strokeStyle = "rgba(96,165,250,0.65)";
      ctx.strokeRect(base.x - 45 * z + i * 31 * z, top + 58 * z, 22 * z, 28 * z);
    }
  } else if (building.style === "tower") {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? shade(building.color, -0.12) : shade(building.color, -0.26);
      ctx.fillRect(base.x - 24 * z, top + 16 * z + i * 20 * z, 48 * z, 12 * z);
    }
    ctx.fillStyle = "#f5d84b";
    ctx.beginPath();
    ctx.arc(base.x, top - 8 * z, 13 * z + Math.sin(state.time * 120) * 2 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(251,113,133,0.7)";
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.moveTo(base.x, top - 8 * z);
    ctx.lineTo(base.x, top - 92 * z);
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#fb7185";
    ctx.beginPath();
    ctx.arc(base.x, top - 92 * z, 30 * z + Math.sin(state.time * 120) * 5 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (building.style === "mine") {
    ctx.fillStyle = "#09090f";
    ctx.beginPath();
    ctx.ellipse(base.x, top + 55 * z, 29 * z, 22 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f5d84b";
    ctx.lineWidth = 2 * z;
    ctx.stroke();
    ctx.fillStyle = "#c084fc";
    ctx.beginPath();
    ctx.moveTo(base.x - 43 * z, top + 52 * z);
    ctx.lineTo(base.x - 32 * z, top + 24 * z);
    ctx.lineTo(base.x - 21 * z, top + 58 * z);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = "#f5d84b";
    ctx.lineWidth = 3 * z;
    ctx.beginPath();
    ctx.arc(base.x, top + 55 * z, 42 * z + Math.sin(state.time * 100) * 5 * z, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (building.style === "gate") {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(base.x - 40 * z, top + 24 * z, 12 * z, 55 * z);
    ctx.fillRect(base.x + 28 * z, top + 24 * z, 12 * z, 55 * z);
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 4 * z;
    ctx.beginPath();
    ctx.moveTo(base.x - 28 * z, top + 42 * z);
    ctx.lineTo(base.x + 28 * z, top + 42 * z);
    ctx.stroke();
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = "#2dd4bf";
    ctx.beginPath();
    ctx.ellipse(base.x, top + 53 * z, 38 * z, 44 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (building.style === "archive") {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "#f4efe3";
      ctx.fillRect(base.x - 39 * z + i * 26 * z, top + 36 * z, 7 * z, 39 * z);
    }
    ctx.fillStyle = "#12071d";
    ctx.beginPath();
    ctx.arc(base.x, top + 66 * z, 18 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c084fc";
    ctx.stroke();
  } else if (building.style === "replay") {
    ctx.fillStyle = "#06130b";
    ctx.fillRect(base.x - 46 * z, top + 30 * z, 92 * z, 40 * z);
    ctx.strokeStyle = "#4ade80";
    ctx.strokeRect(base.x - 46 * z, top + 30 * z, 92 * z, 40 * z);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(base.x - 34 * z, top + 46 * z, (48 + Math.sin(state.time * 80) * 16) * z, 5 * z);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? "#4ade80" : "#0b1710";
      ctx.fillRect(base.x - 48 * z + i * 20 * z, top + 76 * z, 12 * z, 10 * z);
    }
  } else if (building.style === "registry") {
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 2 * z;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.32 + i * 0.14;
      ctx.beginPath();
      ctx.arc(base.x, top + 46 * z, (20 + i * 15 + Math.sin(state.time * 90 + i) * 2) * z, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#061f22";
    ctx.fillRect(base.x - 34 * z, top + 26 * z, 68 * z, 38 * z);
    ctx.strokeStyle = "#2dd4bf";
    ctx.strokeRect(base.x - 34 * z, top + 26 * z, 68 * z, 38 * z);
    ctx.fillStyle = "#f5d84b";
    ctx.font = `${9 * z}px ui-monospace, monospace`;
    ctx.fillText("did:key", base.x, top + 50 * z);
  } else if (building.style === "arena") {
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 3 * z;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(base.x, top + 53 * z, (36 + i * 17) * z, (13 + i * 6) * z, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1b1030";
    ctx.fillRect(base.x - 44 * z, top + 33 * z, 88 * z, 28 * z);
    ctx.fillStyle = "#c084fc";
    ctx.fillRect(base.x - 31 * z, top + 43 * z, 62 * z, 5 * z);
    ctx.fillRect(base.x - 10 * z, top + 33 * z, 20 * z, 28 * z);
  } else if (building.style === "forge") {
    ctx.fillStyle = "#130d08";
    ctx.beginPath();
    ctx.ellipse(base.x, top + 56 * z, 38 * z, 24 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.globalAlpha = 0.55 + Math.sin(state.time * 120) * 0.16;
    ctx.beginPath();
    ctx.arc(base.x, top + 52 * z, 18 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 ? "#f5d84b" : "#f59e0b";
      ctx.lineWidth = 2 * z;
      ctx.beginPath();
      ctx.moveTo(base.x - 56 * z + i * 34 * z, top + 25 * z);
      ctx.lineTo(base.x - 39 * z + i * 34 * z, top + 8 * z);
      ctx.stroke();
    }
  } else if (building.style === "board") {
    ctx.fillStyle = "#14090e";
    ctx.fillRect(base.x - 48 * z, top + 18 * z, 96 * z, 58 * z);
    ctx.strokeStyle = "#fb7185";
    ctx.strokeRect(base.x - 48 * z, top + 18 * z, 96 * z, 58 * z);
    const colors = ["#fb7185", "#f5d84b", "#60a5fa", "#4ade80", "#c084fc", "#f4efe3"];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(base.x - 39 * z + (i % 3) * 28 * z, top + 29 * z + Math.floor(i / 3) * 20 * z, 16 * z, 10 * z);
    }
  } else if (building.style === "publish") {
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2 * z;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(base.x, top - 82 * z);
    ctx.lineTo(base.x - 42 * z, top - 20 * z);
    ctx.moveTo(base.x, top - 82 * z);
    ctx.lineTo(base.x + 42 * z, top - 20 * z);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.arc(base.x, top - 82 * z, 9 * z + Math.sin(state.time * 90) * 2 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#07101f";
    ctx.fillRect(base.x - 30 * z, top + 22 * z, 60 * z, 45 * z);
    ctx.strokeStyle = "#60a5fa";
    ctx.strokeRect(base.x - 30 * z, top + 22 * z, 60 * z, 45 * z);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(base.x - 17 * z, top + 39 * z, 34 * z, 7 * z);
  }

  if (building.activeState) {
    const activeColor = eventColor(building.activeState, asset.trim);
    ctx.globalAlpha = 0.42 + Math.sin(state.time * 120) * 0.1;
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 4 * z;
    ctx.beginPath();
    ctx.ellipse(base.x, base.y - height * 0.38, width * 0.74, height * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = activeColor;
    ctx.beginPath();
    ctx.ellipse(base.x, base.y - height * 0.35, width * 0.68, height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (building.activeState === "tool_failed" || building.activeLevel === "critical") {
      ctx.fillStyle = "#fb7185";
      ctx.fillRect(base.x - 4 * z, top - 36 * z, 8 * z, 24 * z);
      ctx.fillRect(base.x - 4 * z, top - 8 * z, 8 * z, 8 * z);
    }
  }

  ctx.lineWidth = 1;
  const windowCount = Math.max(2, Math.floor(building.w));
  for (let i = 0; i < windowCount; i++) {
    const wx = left + (i + 0.75) * (width / (windowCount + 0.5));
    const wy = top + height * 0.35 + (i % 2) * 9 * z;
    ctx.fillStyle = building.pulse > 0 ? "#fff7ad" : "rgba(245,216,75,0.72)";
    ctx.fillRect(wx, wy, 5 * z, 8 * z);
  }

  const labelWidth = Math.max(88, building.name.length * 7) * z;
  ctx.fillStyle = "rgba(8, 8, 18, 0.9)";
  ctx.fillRect(base.x - labelWidth / 2, top - 29 * z, labelWidth, 21 * z);
  ctx.strokeStyle = asset.trim;
  ctx.globalAlpha = 0.72;
  ctx.strokeRect(base.x - labelWidth / 2, top - 29 * z, labelWidth, 21 * z);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#f4efe3";
  ctx.font = `${10 * z}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText(building.name, base.x, top - 14 * z);
  ctx.fillStyle = "rgba(8, 9, 11, 0.62)";
  ctx.fillRect(base.x - 18 * z, top + height * 0.18, 36 * z, 17 * z);
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.strokeRect(base.x - 18 * z, top + height * 0.18, 36 * z, 17 * z);
  ctx.fillStyle = "#f4efe3";
  ctx.font = `${9 * z}px ui-monospace, monospace`;
  ctx.fillText(asset.sign || building.icon || building.kind.slice(0, 3).toUpperCase(), base.x, top + height * 0.18 + 12 * z);
  if (building.lastEvent) {
    ctx.fillStyle = building.color;
    ctx.font = `${10 * z}px ui-monospace, monospace`;
    ctx.fillText(building.lastEvent, base.x, base.y + 20 * z);
  }
  state.hitTargets.push({
    kind: "building",
    id: building.id,
    data: building,
    x: base.x,
    y: base.y - height / 2,
    r: Math.max(width, height) * 0.55
  });
}

function drawAgentGear(agent, p, z, bob, suit) {
  const role = `${agent.role || ""} ${agent.name || ""}`.toLowerCase();
  if (role.includes("identity") || role.includes("registry") || role.includes("did")) {
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 2 * z;
    ctx.strokeRect(p.x - 16 * z, p.y - 63 * z + bob, 32 * z, 18 * z);
    ctx.fillStyle = "rgba(45,212,191,0.2)";
    ctx.fillRect(p.x - 14 * z, p.y - 61 * z + bob, 28 * z, 14 * z);
    ctx.fillStyle = "#9ffbf1";
    ctx.font = `${7 * z}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("DID", p.x, p.y - 51 * z + bob);
  } else if (role.includes("research") || role.includes("scout")) {
    ctx.globalAlpha = 0.18 + Math.sin(state.time * 95) * 0.06;
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.moveTo(p.x + 12 * z, p.y - 70 * z + bob);
    ctx.lineTo(p.x + 48 * z, p.y - 91 * z + bob);
    ctx.lineTo(p.x + 47 * z, p.y - 49 * z + bob);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.moveTo(p.x + 1 * z, p.y - 54 * z + bob);
    ctx.lineTo(p.x + 10 * z, p.y - 68 * z + bob);
    ctx.stroke();
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.arc(p.x + 12 * z, p.y - 70 * z + bob, 4 * z, 0, Math.PI * 2);
    ctx.fill();
  } else if (role.includes("build") || role.includes("forge")) {
    ctx.fillStyle = "#f5d84b";
    ctx.fillRect(p.x + 14 * z, p.y - 20 * z + bob, 6 * z, 18 * z);
    ctx.fillRect(p.x + 9 * z, p.y - 24 * z + bob, 16 * z, 5 * z);
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.5 + Math.sin(state.time * 160 + i) * 0.25;
      ctx.fillStyle = i % 2 ? "#f5d84b" : "#f59e0b";
      ctx.fillRect(p.x + (18 + i * 4) * z, p.y + (-38 + (i % 3) * 8) * z + bob, 2.2 * z, 2.2 * z);
    }
    ctx.globalAlpha = 1;
  } else if (role.includes("comm") || role.includes("relay")) {
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 38 * z + bob, 13 * z, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.globalAlpha = 0.38;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(p.x, p.y - 38 * z + bob, (20 + i * 9 + Math.sin(state.time * 100) * 2) * z, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#2dd4bf";
    ctx.fillRect(p.x + 9 * z, p.y - 33 * z + bob, 8 * z, 4 * z);
  } else if (role.includes("analysis") || role.includes("oracle")) {
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "#c084fc";
    ctx.lineWidth = 2 * z;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 * z + bob, 22 * z + Math.sin(state.time * 90) * 2 * z, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (role.includes("fix") || role.includes("patch")) {
    ctx.strokeStyle = "#f4efe3";
    ctx.lineWidth = 3 * z;
    ctx.save();
    ctx.translate(p.x - 13 * z, p.y - 22 * z + bob);
    ctx.rotate(Math.sin(state.time * 110) * 0.28);
    ctx.beginPath();
    ctx.moveTo(-5 * z, -4 * z);
    ctx.lineTo(5 * z, 8 * z);
    ctx.stroke();
    ctx.fillStyle = "#f4efe3";
    ctx.fillRect(-9 * z, -7 * z, 8 * z, 4 * z);
    ctx.restore();
  } else {
    ctx.fillStyle = shade(suit, 0.18);
    ctx.fillRect(p.x - 3 * z, p.y - 30 * z + bob, 6 * z, 6 * z);
  }
}

function agentKind(agent) {
  const role = `${agent.role || ""} ${agent.name || ""}`.toLowerCase();
  if (role.includes("identity") || role.includes("registry") || role.includes("did")) return "identity";
  if (role.includes("research") || role.includes("scout")) return "scout";
  if (role.includes("build") || role.includes("forge")) return "forge";
  if (role.includes("comm") || role.includes("relay")) return "relay";
  if (role.includes("analysis") || role.includes("oracle")) return "oracle";
  if (role.includes("fix") || role.includes("patch")) return "patch";
  return "operator";
}

function drawAgentSprite(agent, p, z, bob, suit, statusColor) {
  const kind = agentKind(agent);
  const shadow = {
    identity: [14, 6],
    scout: [11, 5],
    forge: [18, 7],
    relay: [15, 6],
    oracle: [16, 7],
    patch: [13, 6],
    operator: [14, 6]
  }[kind];
  ctx.fillStyle = "rgba(0,0,0,0.44)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 5 * z, shadow[0] * z, shadow[1] * z, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === "identity") {
    ctx.fillStyle = "#071a1a";
    ctx.fillRect(p.x - 12 * z, p.y - 31 * z + bob, 24 * z, 24 * z);
    ctx.fillStyle = suit;
    ctx.fillRect(p.x - 9 * z, p.y - 28 * z + bob, 18 * z, 20 * z);
    ctx.fillStyle = "#2dd4bf";
    ctx.fillRect(p.x - 17 * z, p.y - 25 * z + bob, 7 * z, 14 * z);
    ctx.fillRect(p.x + 10 * z, p.y - 25 * z + bob, 7 * z, 14 * z);
    ctx.fillStyle = "#111318";
    ctx.fillRect(p.x - 10 * z, p.y - 8 * z + bob, 7 * z, 9 * z);
    ctx.fillRect(p.x + 3 * z, p.y - 8 * z + bob, 7 * z, 9 * z);
  } else if (kind === "scout") {
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 32 * z + bob);
    ctx.lineTo(p.x - 13 * z, p.y - 8 * z + bob);
    ctx.lineTo(p.x + 13 * z, p.y - 8 * z + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = suit;
    ctx.fillRect(p.x - 7 * z, p.y - 29 * z + bob, 14 * z, 22 * z);
    ctx.fillStyle = "#111318";
    ctx.fillRect(p.x - 10 * z, p.y - 8 * z + bob, 7 * z, 9 * z);
    ctx.fillRect(p.x + 3 * z, p.y - 8 * z + bob, 7 * z, 9 * z);
  } else if (kind === "forge") {
    ctx.fillStyle = "#111318";
    ctx.fillRect(p.x - 18 * z, p.y - 34 * z + bob, 36 * z, 27 * z);
    ctx.fillStyle = suit;
    ctx.fillRect(p.x - 14 * z, p.y - 29 * z + bob, 28 * z, 22 * z);
    ctx.fillStyle = shade(suit, -0.28);
    ctx.fillRect(p.x - 23 * z, p.y - 27 * z + bob, 8 * z, 18 * z);
    ctx.fillRect(p.x + 15 * z, p.y - 27 * z + bob, 8 * z, 18 * z);
    ctx.fillStyle = "#111318";
    ctx.fillRect(p.x - 14 * z, p.y - 8 * z + bob, 9 * z, 10 * z);
    ctx.fillRect(p.x + 5 * z, p.y - 8 * z + bob, 9 * z, 10 * z);
  } else if (kind === "relay") {
    ctx.fillStyle = "#09131c";
    ctx.fillRect(p.x - 11 * z, p.y - 34 * z + bob, 22 * z, 27 * z);
    ctx.fillStyle = suit;
    ctx.fillRect(p.x - 8 * z, p.y - 30 * z + bob, 16 * z, 22 * z);
    ctx.fillStyle = "#2dd4bf";
    ctx.fillRect(p.x - 22 * z, p.y - 26 * z + bob, 8 * z, 16 * z);
    ctx.fillRect(p.x + 14 * z, p.y - 26 * z + bob, 8 * z, 16 * z);
    ctx.fillStyle = "#111318";
    ctx.fillRect(p.x - 10 * z, p.y - 8 * z + bob, 7 * z, 9 * z);
    ctx.fillRect(p.x + 3 * z, p.y - 8 * z + bob, 7 * z, 9 * z);
  } else if (kind === "oracle") {
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = "#c084fc";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 28 * z + bob, 26 * z + Math.sin(state.time * 80) * 2 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#160b24";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 20 * z + bob, 16 * z, 24 * z, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = suit;
    ctx.fillRect(p.x - 10 * z, p.y - 30 * z + bob, 20 * z, 25 * z);
  } else if (kind === "patch") {
    ctx.fillStyle = "#16120e";
    ctx.fillRect(p.x - 12 * z, p.y - 31 * z + bob, 24 * z, 24 * z);
    ctx.fillStyle = suit;
    ctx.fillRect(p.x - 9 * z, p.y - 28 * z + bob, 18 * z, 21 * z);
    ctx.fillStyle = "#f4efe3";
    ctx.fillRect(p.x - 3 * z, p.y - 25 * z + bob, 6 * z, 13 * z);
    ctx.fillStyle = "#111318";
    ctx.fillRect(p.x - 13 * z, p.y - 8 * z + bob, 7 * z, 9 * z);
    ctx.fillRect(p.x + 6 * z, p.y - 8 * z + bob, 7 * z, 9 * z);
  } else {
    ctx.fillStyle = "#15151f";
    ctx.fillRect(p.x - 13 * z, p.y - 30 * z + bob, 26 * z, 23 * z);
    ctx.fillStyle = suit;
    ctx.fillRect(p.x - 10 * z, p.y - 27 * z + bob, 20 * z, 19 * z);
  }

  const head = kind === "forge" ? [19, 17] : kind === "relay" ? [14, 18] : kind === "oracle" ? [15, 15] : [16, 16];
  const headY = kind === "oracle" ? -48 : -45;
  ctx.fillStyle = "#f6f0dc";
  if (kind === "oracle") {
    ctx.beginPath();
    ctx.arc(p.x, p.y + headY * z + bob, 8 * z, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(p.x - head[0] * z / 2, p.y + headY * z + bob, head[0] * z, head[1] * z);
  }
  ctx.fillStyle = "#0b0b10";
  ctx.fillRect(p.x - 5 * z, p.y - 39 * z + bob, 3 * z, 3 * z);
  ctx.fillRect(p.x + 3 * z, p.y - 39 * z + bob, 3 * z, 3 * z);

  ctx.fillStyle = agent.status === "error" ? "#fb7185" : kind === "oracle" ? "#c084fc" : "#f5d84b";
  ctx.beginPath();
  ctx.moveTo(p.x - 9 * z, p.y - 47 * z + bob);
  ctx.lineTo(p.x - 5 * z, p.y - 56 * z + bob);
  ctx.lineTo(p.x, p.y - 48 * z + bob);
  ctx.lineTo(p.x + 5 * z, p.y - 56 * z + bob);
  ctx.lineTo(p.x + 9 * z, p.y - 47 * z + bob);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = statusColor;
  ctx.beginPath();
  ctx.arc(p.x + 11 * z, p.y - 46 * z + bob, 4 * z, 0, Math.PI * 2);
  ctx.fill();
  drawAgentGear(agent, p, z, bob, suit);
}

function drawAgent(agent) {
  const p = screenPoint(agent.x, agent.y);
  const z = state.camera.zoom;
  const bob = Math.sin(agent.walk || 0) * 3 * z;
  const color = colorForStatus(agent.status);
  const suit = suitForAgent(agent);
  const identity = agentIdentity(agent);
  if (agent.pulse > 0) {
    ctx.beginPath();
    ctx.arc(p.x, p.y - 22 * z + bob, (18 + agent.pulse * 26) * z, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = agent.pulse * 0.45;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (state.highlightedAgentId === agent.id) {
    ctx.strokeStyle = "#f5d84b";
    ctx.lineWidth = 2.5 * z;
    ctx.globalAlpha = 0.5 + Math.sin(state.time * 120) * 0.2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 24 * z + bob, 33 * z, 42 * z, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  drawAgentSprite(agent, p, z, bob, suit, color);
  const label = agent.name.length > 12 ? `${agent.name.slice(0, 10)}...` : agent.name;
  const nameW = Math.max(60, label.length * 8) * z;
  ctx.fillStyle = "rgba(8, 8, 18, 0.84)";
  ctx.fillRect(p.x - nameW / 2, p.y - 73 * z + bob, nameW, 19 * z);
  ctx.strokeStyle = "rgba(245,216,75,0.35)";
  ctx.strokeRect(p.x - nameW / 2, p.y - 73 * z + bob, nameW, 19 * z);
  ctx.fillStyle = "#f4efe3";
  ctx.font = `${10 * z}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText(label, p.x, p.y - 59 * z + bob);
  const badge = `${identity.level} · ${identity.trustScore.toFixed(2)}`;
  const badgeW = Math.max(72, badge.length * 6.3) * z;
  ctx.fillStyle = "rgba(4, 9, 13, 0.76)";
  ctx.fillRect(p.x - badgeW / 2, p.y - 53 * z + bob, badgeW, 15 * z);
  ctx.strokeStyle = "rgba(45,212,191,0.34)";
  ctx.strokeRect(p.x - badgeW / 2, p.y - 53 * z + bob, badgeW, 15 * z);
  ctx.fillStyle = "#9ffbf1";
  ctx.font = `${8 * z}px ui-monospace, monospace`;
  ctx.fillText(badge, p.x, p.y - 42 * z + bob);
  if (agent.bubble > 0 && agent.lastMessage) {
    const msg = agent.lastMessage.slice(0, 28);
    const alpha = Math.min(1, agent.bubble * 1.7);
    ctx.globalAlpha = alpha;
    const bw = Math.max(112, msg.length * 6.5) * z;
    ctx.fillStyle = "rgba(246,240,220,0.92)";
    ctx.fillRect(p.x - bw / 2, p.y - 105 * z + bob, bw, 22 * z);
    ctx.strokeStyle = "rgba(245,216,75,0.65)";
    ctx.strokeRect(p.x - bw / 2, p.y - 105 * z + bob, bw, 22 * z);
    ctx.fillStyle = "#111318";
    ctx.font = `${9 * z}px ui-monospace, monospace`;
    ctx.fillText(msg, p.x, p.y - 90 * z + bob);
    ctx.globalAlpha = 1;
  }
  state.hitTargets.push({
    kind: "agent",
    id: agent.id,
    data: agent,
    x: p.x,
    y: p.y - 30 * z,
    r: 44 * z
  });
}

function drawAvatar() {
  const p = screenPoint(state.avatar.x, state.avatar.y);
  const z = state.camera.zoom;
  const bob = Math.sin(state.avatar.walk || 0) * 3 * z;
  const operatorAgent = {
    id: "operator-avatar",
    name: "You",
    role: "Operator",
    status: "working",
    walk: state.avatar.walk,
    x: state.avatar.x,
    y: state.avatar.y
  };
  drawAgentSprite(operatorAgent, p, z, bob, "#f5d84b", "#f5d84b");
  const labelW = 46 * z;
  ctx.fillStyle = "rgba(8, 8, 18, 0.86)";
  ctx.fillRect(p.x - labelW / 2, p.y - 73 * z + bob, labelW, 19 * z);
  ctx.strokeStyle = "rgba(245,216,75,0.48)";
  ctx.strokeRect(p.x - labelW / 2, p.y - 73 * z + bob, labelW, 19 * z);
  ctx.fillStyle = "#f4efe3";
  ctx.font = `${10 * z}px ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("You", p.x, p.y - 59 * z + bob);
  ctx.fillStyle = "rgba(4, 9, 13, 0.76)";
  ctx.fillRect(p.x - 33 * z, p.y - 53 * z + bob, 66 * z, 15 * z);
  ctx.strokeStyle = "rgba(245,216,75,0.34)";
  ctx.strokeRect(p.x - 33 * z, p.y - 53 * z + bob, 66 * z, 15 * z);
  ctx.fillStyle = "#f5d84b";
  ctx.font = `${8 * z}px ui-monospace, monospace`;
  ctx.fillText("operator", p.x, p.y - 42 * z + bob);
}

function drawMinimap(width, height) {
  const w = 156;
  const h = 116;
  const x = width - w - 16;
  const y = 16;
  ctx.fillStyle = "rgba(8,9,11,0.74)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(245,216,75,0.28)";
  ctx.strokeRect(x, y, w, h);
  const sx = w / mapW;
  const sy = h / mapH;
  for (let tx = 0; tx < mapW; tx += 2) {
    for (let ty = 0; ty < mapH; ty += 2) {
      const type = terrainAt(tx, ty);
      ctx.fillStyle = type === "water" ? "rgba(96,165,250,0.65)" : type === "path" ? "rgba(245,216,75,0.28)" : "rgba(74,222,128,0.18)";
      ctx.fillRect(x + tx * sx, y + ty * sy, Math.max(1, sx * 2), Math.max(1, sy * 2));
    }
  }
  for (const b of state.buildings) {
    ctx.fillStyle = b.color;
    ctx.fillRect(x + b.x * sx, y + b.y * sy, Math.max(3, b.w * sx), Math.max(3, b.h * sy));
  }
  for (const a of state.agents) {
    ctx.fillStyle = colorForStatus(a.status);
    ctx.beginPath();
    ctx.arc(x + a.x * sx, y + a.y * sy, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#f4efe3";
  ctx.beginPath();
  ctx.arc(x + state.avatar.x * sx, y + state.avatar.y * sy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(244,239,227,0.72)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillText("map", x + 8, y + 14);
}

function drawAtmosphere(width, height) {
  const cycle = (Math.sin(state.time * 0.45) + 1) / 2;
  const night = Math.max(0, 1 - cycle * 1.55);
  const dataRain = state.layerMode === "network" ? 0.52 : 0.18;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 70; i++) {
    const x = (seededNoise(i, 8) * width + Math.sin(state.time * 40 + i) * 16) % width;
    const y = (seededNoise(i, 9) * height + state.time * (70 + (i % 5) * 18)) % height;
    ctx.globalAlpha = dataRain * (0.18 + seededNoise(i, 10) * 0.48);
    ctx.fillStyle = i % 3 ? "#60a5fa" : "#2dd4bf";
    ctx.fillRect(x, y, 1.2, 10 + (i % 4) * 5);
  }
  ctx.restore();
  if (night > 0.05) {
    ctx.fillStyle = `rgba(7, 12, 28, ${night * 0.48})`;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 80; i++) {
      const x = (seededNoise(i, 1) * width + state.time * 12 * (i % 3)) % width;
      const y = seededNoise(i, 2) * height * 0.55;
      ctx.globalAlpha = night * (0.35 + seededNoise(i, 3) * 0.65);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
  }
  const scanY = (state.time * 110) % (height + 120) - 60;
  const grad = ctx.createLinearGradient(0, scanY, 0, scanY + 70);
  grad.addColorStop(0, "rgba(245,216,75,0)");
  grad.addColorStop(0.45, "rgba(245,216,75,0.06)");
  grad.addColorStop(1, "rgba(245,216,75,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, scanY, width, 70);
}

function renderWorld() {
  const width = els.canvas.clientWidth;
  const height = els.canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#0b1020");
  grad.addColorStop(1, "#07100d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  state.hitTargets = [];

  for (let x = 0; x < mapW; x++) {
    for (let y = 0; y < mapH; y++) {
      const type = terrainAt(x, y);
      if (type === "water") drawWaterTile(x, y);
      else if (type === "path") drawPathTile(x, y);
      else drawTile(x, y, terrainColor(type, x, y), "rgba(255,255,255,0.022)");
    }
  }
  drawOpsBaseFoundation();
  drawFederationMesh();
  state.decor.filter((d) => d.x + d.y < 54).forEach(drawDecor);
  drawDataRoutes();
  drawEventRoutes();
  drawAgentTrails();
  drawDistrictLabels();
  state.buildings.forEach(drawBuilding);
  drawEventBeacons();
  state.decor.filter((d) => d.x + d.y >= 54).forEach(drawDecor);
  [...state.agents].sort((a, b) => (a.x + a.y) - (b.x + b.y)).forEach(drawAgent);
  drawAvatar();
  state.particles.forEach(drawParticle);
  drawAtmosphere(width, height);
  drawNetworkOverlay(width, height);
  drawReplayOverlay(width, height);
  drawMinimap(width, height);
}

function animate(timestamp = 0) {
  if (timestamp - state.lastFrame > 33) {
    state.lastFrame = timestamp;
    updateAgents();
    renderWorld();
    updateProximityPrompt();
    updateAgentWorldCardPosition();
    updateZoneWorldCardPosition();
  }
  requestAnimationFrame(animate);
}

function renderLists() {
  els.agentCount.textContent = state.agents.length;
  els.eventCount.textContent = state.events.length;

  els.agentList.innerHTML = state.agents.map((agent) => {
    const identity = agentIdentity(agent);
    const profile = agentProfileFor(agent);
    return `
      <article class="agentCard" data-agent="${agent.id}">
        <div class="agentTop"><b>${agent.name}</b><span class="status ${agent.status}">${agent.status}</span></div>
        <div class="agentMeta">${agent.role} · ${identity.level} · trust ${identity.trustScore.toFixed(2)}</div>
        <div class="agentServiceLine">${profile.services.slice(0, 2).map(escapeHtml).join(" · ")}</div>
        <div class="agentIdentityLine">${identity.shortDid} · ${identity.pushes} pushes · ${identity.prs} PRs</div>
        <div class="agentTask">${escapeHtml(agent.currentTask || "standing by")}</div>
      </article>
    `;
  }).join("");

  if (els.timeline) els.timeline.innerHTML = state.events.slice(0, 80).map((event) => `
    <article class="eventCard ${event.severity || event.status}" data-event="${event.id}" style="--event-color:${eventColor(event)}">
      <div class="eventTop"><b>${event.agentName}</b><span class="eventType">${event.type}</span></div>
      <div class="eventMeta">${event.phase || "log"} · ${event.sessionName} · ${event.tool || "no tool"} · ${new Date(event.createdAt).toLocaleTimeString()}</div>
      <p>${escapeHtml(event.message || event.status)}</p>
      <div class="eventStats">
        <span>${(event.tokens || 0).toLocaleString()} tok</span>
        <span>${Math.round((event.durationMs || 0) / 100) / 10}s</span>
        <span>${event.provider || "local"}</span>
      </div>
    </article>
  `).join("");

  if (els.sessionSelect) {
    const selected = els.sessionSelect.value;
    els.sessionSelect.innerHTML = state.sessions.map((session) => `
      <option value="${session.id}">${session.name}</option>
    `).join("");
    if (selected && state.sessions.some((session) => session.id === selected)) els.sessionSelect.value = selected;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function showToast(text) {
  els.worldToast.textContent = text;
  els.worldToast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.worldToast.classList.remove("show"), 2200);
}

function openAgentProfile(agent, options = {}) {
  if (!agent) return;
  inspect("agent", agent);
  const distance = Math.hypot(agent.x - state.avatar.x, agent.y - state.avatar.y);
  if (options.force || distance <= 3.4) {
    openAgentWorldCard(agent);
    showToast(`${agent.name} details opened`);
    return;
  }
  closeAgentWorldCard();
  showToast(`Move beside ${agent.name} to inspect in-world`);
}

function nearbyAgentsToAvatar() {
  return state.agents
    .map((agent) => ({
      agent,
      distance: Math.hypot(agent.x - state.avatar.x, agent.y - state.avatar.y)
    }))
    .filter((item) => item.distance <= 2.05)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);
}

function updateProximityPrompt() {
  if (!els.proximityPrompt) return;
  const modalOpen = els.modal && !els.modal.classList.contains("hidden");
  const worldCardOpen = els.agentWorldCard && !els.agentWorldCard.classList.contains("hidden");
  const nearby = modalOpen ? [] : nearbyAgentsToAvatar();
  const agent = nearby[0]?.agent || null;
  state.nearbyAgent = agent;
  if (!agent || worldCardOpen) {
    els.proximityPrompt.classList.add("hidden");
    return;
  }
  const profile = agentProfileFor(agent);
  const p = screenPoint(agent.x, agent.y);
  const width = els.canvas.clientWidth;
  const height = els.canvas.clientHeight;
  const left = Math.max(12, Math.min(width - 248, p.x + 22));
  const top = Math.max(12, Math.min(height - 118, p.y - 120));
  els.proximityPrompt.style.left = `${left}px`;
  els.proximityPrompt.style.top = `${top}px`;
  els.proximityTitle.textContent = nearby.length > 1 ? "Agents nearby" : `${agent.name} nearby`;
  els.proximityMeta.textContent = `${agent.role} · press E for details`;
  els.proximityAgents.innerHTML = nearby.map(({ agent: item, distance }, index) => `
    <button type="button" data-nearby-agent="${item.id}" class="${index === 0 ? "primary" : ""}">
      <b>${escapeHtml(item.name)}</b>
      <span>Details / inspect · ${distance.toFixed(1)}u</span>
    </button>
  `).join("");
  els.proximityPrompt.classList.remove("hidden");
}

function openAgentWorldCard(agent) {
  if (!els.agentWorldCard || !els.agentWorldBody) return;
  state.worldProfileAgentId = agent.id;
  els.agentWorldBody.innerHTML = agentWorldCardHtml(agent);
  els.proximityPrompt?.classList.add("hidden");
  els.agentWorldCard.classList.remove("hidden");
  positionAgentWorldCard(agent);
}

function closeAgentWorldCard() {
  state.worldProfileAgentId = null;
  els.agentWorldCard?.classList.add("hidden");
}

function positionAgentWorldCard(agent) {
  if (!els.agentWorldCard || els.agentWorldCard.classList.contains("hidden") || !agent) return;
  const p = screenPoint(agent.x, agent.y);
  const width = els.canvas.clientWidth;
  const height = els.canvas.clientHeight;
  const cardWidth = els.agentWorldCard.offsetWidth || 360;
  const cardHeight = els.agentWorldCard.offsetHeight || 360;
  const preferRight = p.x < width - cardWidth - 70;
  const left = preferRight
    ? Math.max(12, Math.min(width - cardWidth - 12, p.x + 42))
    : Math.max(12, Math.min(width - cardWidth - 12, p.x - cardWidth - 42));
  const top = Math.max(12, Math.min(height - cardHeight - 12, p.y - cardHeight * 0.58));
  els.agentWorldCard.style.left = `${left}px`;
  els.agentWorldCard.style.top = `${top}px`;
}

function updateAgentWorldCardPosition() {
  if (!state.worldProfileAgentId || !els.agentWorldCard || els.agentWorldCard.classList.contains("hidden")) return;
  const agent = state.agents.find((item) => item.id === state.worldProfileAgentId);
  if (!agent) {
    closeAgentWorldCard();
    return;
  }
  const distance = Math.hypot(agent.x - state.avatar.x, agent.y - state.avatar.y);
  if (distance > 3.4) {
    closeAgentWorldCard();
    return;
  }
  positionAgentWorldCard(agent);
}

function openZoneWorldCard(building) {
  if (!els.zoneWorldCard || !els.zoneWorldBody) return;
  state.worldZoneBuildingId = building.id;
  els.zoneWorldTitle.textContent = building.name;
  els.zoneWorldBody.innerHTML = zoneWorldCardHtml(building);
  els.zoneWorldCard.classList.remove("hidden");
  positionZoneWorldCard(building);
}

function closeZoneWorldCard() {
  state.worldZoneBuildingId = null;
  els.zoneWorldCard?.classList.add("hidden");
}

function positionZoneWorldCard(building) {
  if (!els.zoneWorldCard || els.zoneWorldCard.classList.contains("hidden") || !building) return;
  const p = screenPoint(building.x + building.w / 2, building.y + building.h / 2);
  const width = els.canvas.clientWidth;
  const height = els.canvas.clientHeight;
  const cardWidth = els.zoneWorldCard.offsetWidth || 340;
  const cardHeight = els.zoneWorldCard.offsetHeight || 300;
  const left = Math.max(12, Math.min(width - cardWidth - 12, p.x + 46));
  const top = Math.max(12, Math.min(height - cardHeight - 12, p.y - cardHeight * 0.5));
  els.zoneWorldCard.style.left = `${left}px`;
  els.zoneWorldCard.style.top = `${top}px`;
}

function updateZoneWorldCardPosition() {
  if (!state.worldZoneBuildingId || !els.zoneWorldCard || els.zoneWorldCard.classList.contains("hidden")) return;
  const building = state.buildings.find((item) => item.id === state.worldZoneBuildingId);
  if (!building) return closeZoneWorldCard();
  positionZoneWorldCard(building);
}

function inspect(label, value) {
  state.selected = value;
  els.selectedLabel.textContent = label;
  if (!value) {
    els.inspector.textContent = "Select an agent, building, or event.";
    return;
  }
  if (label === "event" || label === "replay event") {
    els.inspector.innerHTML = inspectEventHtml(value);
    return;
  }
  if (label === "agent") {
    els.inspector.innerHTML = inspectAgentHtml(value);
    return;
  }
  if (label === "building") {
    els.inspector.innerHTML = inspectBuildingHtml(value);
    return;
  }
  if (label === "replay") {
    els.inspector.innerHTML = inspectReplayHtml(value);
    return;
  }
  els.inspector.textContent = JSON.stringify(value, null, 2);
}

function focusEvent(event) {
  if (!event) return;
  const agent = state.agents.find((item) => item.id === event.agentId || item.name === event.agentName);
  const building = targetForEvent(event);
  state.highlightedAgentId = agent?.id || null;
  state.highlightedBuildingId = building?.id || null;
  if (building) {
    setCameraTarget(building.x + building.w / 2, building.y + building.h / 2, Math.max(state.camera.zoom, 1.12));
    state.beacons.unshift({
      x: building.x + building.w / 2,
      y: building.y + building.h / 2,
      text: event.type,
      subtext: event.agentName || event.phase || "event",
      color: eventColor(event),
      life: 1
    });
  }
  if (agent) {
    agent.pulse = 1;
    setFollowAgent(agent, Boolean(state.followAgentId));
  }
}

function inspectEventHtml(event) {
  return `
    <div class="inspectStack">
      <b>${escapeHtml(event.agentName)} / ${escapeHtml(event.type)}</b>
      <span>${escapeHtml(event.sessionName)} · ${escapeHtml(event.phase || "log")} · ${escapeHtml(event.status)}</span>
      <div class="metricRows compact">
        <div class="metricRow"><span>Tool</span><b>${escapeHtml(event.tool || "none")}</b></div>
        <div class="metricRow"><span>Tokens</span><b>${(event.tokens || 0).toLocaleString()}</b></div>
        <div class="metricRow"><span>Duration</span><b>${Math.round((event.durationMs || 0) / 100) / 10}s</b></div>
        <div class="metricRow"><span>Model</span><b>${escapeHtml(event.model || "local")}</b></div>
      </div>
      <p>${escapeHtml(event.message || "")}</p>
      <pre>${escapeHtml(JSON.stringify({
        input: event.input,
        output: event.output,
        trace: event.trace,
        metadata: event.metadata
      }, null, 2))}</pre>
    </div>
  `;
}

function inspectAgentHtml(agent) {
  const sessions = state.sessions.filter((session) => session.agentId === agent.id || session.agentName === agent.name).slice(0, 5);
  const profile = agentProfileFor(agent);
  const identity = agentIdentity(agent);
  return `
    <div class="inspectStack">
      <b>${escapeHtml(agent.name)}</b>
      <span>${escapeHtml(agent.role)} · ${escapeHtml(agent.status)} · ${escapeHtml(identity.shortDid)}</span>
      <h4>What this agent does</h4>
      <p>${escapeHtml(profile.work)}</p>
      <h4>Skills it can use</h4>
      <div class="tagGrid mini">${profile.skills.slice(0, 5).map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>
      <h4>Services it provides</h4>
      <div class="tagGrid mini services">${profile.services.slice(0, 5).map((service) => `<span>${escapeHtml(service)}</span>`).join("")}</div>
      <div class="metricRows compact">
        <div class="metricRow"><span>Trust</span><b>${identity.trustScore.toFixed(2)} / ${escapeHtml(identity.level)}</b></div>
        <div class="metricRow"><span>Repos</span><b>${identity.repos}</b></div>
        <div class="metricRow"><span>Pushes</span><b>${identity.pushes}</b></div>
        <div class="metricRow"><span>PRs</span><b>${identity.prs}</b></div>
        <div class="metricRow"><span>Events</span><b>${agent.eventCount || 0}</b></div>
        <div class="metricRow"><span>Errors</span><b>${agent.errorCount || 0}</b></div>
        <div class="metricRow"><span>Tokens</span><b>${(agent.tokens || 0).toLocaleString()}</b></div>
        <div class="metricRow"><span>Last seen</span><b>${new Date(agent.lastSeenAt).toLocaleTimeString()}</b></div>
      </div>
      <h4>What it is doing now</h4>
      <p>${escapeHtml(agent.currentTask || "No active task.")}</p>
      <pre>${escapeHtml(JSON.stringify({ identity, sessions }, null, 2))}</pre>
    </div>
  `;
}

function agentProfileFor(agent) {
  const kind = agentKind(agent);
  const profiles = {
    scout: {
      work: "Researches repos, docs, markets, and launch signals. Turns messy research into short decision briefs.",
      skills: ["web.search", "repo.scan", "docs.read", "trend.map", "source.compare"],
      services: ["Market research", "Competitor mapping", "Launch intelligence", "Source summaries"]
    },
    forge: {
      work: "Builds product surfaces, edits code, validates UI behavior, and prepares implementation patches.",
      skills: ["code.edit", "ui.build", "test.run", "browser.qa", "diff.review"],
      services: ["Feature implementation", "Frontend polish", "Bug fixing", "Visual QA"]
    },
    relay: {
      work: "Handles communications, outbound updates, replies, webhooks, and human approval handoffs.",
      skills: ["message.send", "webhook.route", "approval.wait", "status.sync", "notify.team"],
      services: ["Customer replies", "Launch outreach", "Approval routing", "Webhook dispatch"]
    },
    oracle: {
      work: "Analyzes event streams, cost signals, failures, and agent behavior to explain what is happening.",
      skills: ["analysis.map", "trace.read", "cost.inspect", "risk.score", "pattern.find"],
      services: ["Run analysis", "Cost insight", "Failure diagnosis", "Strategy notes"]
    },
    patch: {
      work: "Debugs failed tools, recovers broken flows, applies fixes, and confirms the system is healthy again.",
      skills: ["error.trace", "config.patch", "retry.plan", "checkout.fix", "health.check"],
      services: ["Incident recovery", "Tool failure fixes", "Config repair", "Regression checks"]
    },
    operator: {
      work: "Runs general agent tasks and reports progress into the live AgentsWorld activity feed.",
      skills: ["task.run", "tool.call", "memory.write", "status.report"],
      services: ["General automation", "Task tracking", "Session replay"]
    },
    identity: {
      work: "Registers agent identities, resolves DIDs, tracks trust, and shows which agents exist in the network.",
      skills: ["identity.resolve", "did.verify", "agent.register", "trust.score", "node.sync"],
      services: ["Agent directory", "DID lookup", "Trust profile", "Network registration"]
    }
  };
  const base = profiles[kind] || profiles.operator;
  return {
    ...base,
    skills: Array.isArray(agent.skills) && agent.skills.length ? agent.skills : base.skills,
    services: Array.isArray(agent.services) && agent.services.length ? agent.services : base.services
  };
}

function agentProfileHtml(agent) {
  const profile = agentProfileFor(agent);
  const identity = agentIdentity(agent);
  const sessions = state.sessions.filter((session) => session.agentId === agent.id || session.agentName === agent.name).slice(0, 4);
  const recent = state.events.filter((event) => event.agentId === agent.id || event.agentName === agent.name).slice(0, 6);
  return `
    <div class="agentProfile">
      <section class="profileHero">
        <div>
          <span class="profileKicker">${escapeHtml(agent.role)} / ${escapeHtml(agent.status)} / ${escapeHtml(identity.level)}</span>
          <h3>${escapeHtml(agent.name)}</h3>
          <p>${escapeHtml(profile.work)}</p>
        </div>
        <div class="profileStatus">
          <b>${identity.trustScore.toFixed(2)}</b>
          <span>GitLawb trust</span>
        </div>
      </section>

      <div class="profileGrid">
        <section>
          <h4>Agent Identity</h4>
          <div class="identityPanel">
            <div><span>DID</span><b>${escapeHtml(identity.shortDid)}</b></div>
            <div><span>Handle</span><b>${escapeHtml(identity.handle)}</b></div>
            <div><span>Home node</span><b>${escapeHtml(identity.node)}</b></div>
            <div><span>X</span><b>${escapeHtml(identity.x)}</b></div>
          </div>
          <div class="identityStats">
            <div><b>${identity.repos}</b><span>repos</span></div>
            <div><b>${identity.pushes}</b><span>pushes</span></div>
            <div><b>${identity.prs}</b><span>PRs</span></div>
            <div><b>${identity.stars}</b><span>stars</span></div>
          </div>
        </section>

        <section>
          <h4>What it is doing now</h4>
          <p>${escapeHtml(agent.currentTask || "Standing by for the next run.")}</p>
          <div class="metricRows compact">
            <div class="metricRow"><span>Events</span><b>${agent.eventCount || 0}</b></div>
            <div class="metricRow"><span>Errors</span><b>${agent.errorCount || 0}</b></div>
            <div class="metricRow"><span>Last seen</span><b>${agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleTimeString() : "n/a"}</b></div>
          </div>
        </section>

        <section>
          <h4>Skills it can use</h4>
          <div class="tagGrid">${profile.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>
        </section>

        <section>
          <h4>Services it provides</h4>
          <div class="tagGrid services">${profile.services.map((service) => `<span>${escapeHtml(service)}</span>`).join("")}</div>
        </section>
      </div>

      <section>
        <h4>Recent Session Work</h4>
        <div class="profileRows">
          ${sessions.length ? sessions.map((session) => `
            <div class="profileRow">
              <b>${escapeHtml(session.name)}</b>
              <span>${escapeHtml(session.status)} · ${escapeHtml(session.phase || "unknown")} · ${(session.tokens || 0).toLocaleString()} tok</span>
            </div>
          `).join("") : `<p>No sessions yet.</p>`}
        </div>
      </section>

      <section>
        <h4>Recent Events</h4>
        <div class="profileRows">
          ${recent.length ? recent.map((event) => `
            <div class="profileRow" style="--event-color:${eventColor(event)}">
              <b>${escapeHtml(event.type)}</b>
              <span>${escapeHtml(event.tool || event.phase || "run")} · ${escapeHtml(event.message || event.status)}</span>
            </div>
          `).join("") : `<p>No events yet.</p>`}
        </div>
      </section>
    </div>
  `;
}

function agentWorldCardHtml(agent) {
  const profile = agentProfileFor(agent);
  const identity = agentIdentity(agent);
  const sessions = state.sessions.filter((session) => session.agentId === agent.id || session.agentName === agent.name).slice(0, 2);
  const recent = state.events.filter((event) => event.agentId === agent.id || event.agentName === agent.name).slice(0, 3);
  return `
    <div class="worldProfile">
      <div class="worldProfileHero">
        <span>${escapeHtml(agent.role)} / ${escapeHtml(agent.status)} / ${escapeHtml(identity.level)}</span>
        <h3>${escapeHtml(agent.name)}</h3>
        <p>${escapeHtml(profile.work)}</p>
      </div>
      <div class="worldProfileStats">
        <div><b>${identity.trustScore.toFixed(2)}</b><span>trust</span></div>
        <div><b>${identity.pushes}</b><span>pushes</span></div>
        <div><b>${identity.prs}</b><span>PRs</span></div>
      </div>
      <div class="worldIdentity">
        <div><span>DID</span><b>${escapeHtml(identity.shortDid)}</b></div>
        <div><span>Node</span><b>${escapeHtml(identity.node)}</b></div>
        <div><span>Repos</span><b>${identity.repos}</b></div>
        <div><span>Stars</span><b>${identity.stars}</b></div>
      </div>
      <div class="worldProfileStats mutedStats">
        <div><b>${agent.eventCount || 0}</b><span>events</span></div>
        <div><b>${agent.errorCount || 0}</b><span>errors</span></div>
        <div><b>${(agent.tokens || 0).toLocaleString()}</b><span>tokens</span></div>
      </div>
      <div class="worldProfileBlock">
        <h4>What it is doing now</h4>
        <p>${escapeHtml(agent.currentTask || "Standing by for the next run.")}</p>
      </div>
      <div class="worldProfileBlock">
        <h4>Skills it can use</h4>
        <div class="worldTags">${profile.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>
      </div>
      <div class="worldProfileBlock">
        <h4>Services it provides</h4>
        <div class="worldTags services">${profile.services.map((service) => `<span>${escapeHtml(service)}</span>`).join("")}</div>
      </div>
      <div class="worldProfileBlock">
        <h4>Recent work</h4>
        <div class="worldRows">
          ${sessions.length ? sessions.map((session) => `
            <div><b>${escapeHtml(session.name)}</b><span>${escapeHtml(session.status)} · ${escapeHtml(session.phase || "unknown")}</span></div>
          `).join("") : `<p>No sessions yet.</p>`}
          ${recent.map((event) => `
            <div><b>${escapeHtml(event.type)}</b><span>${escapeHtml(event.tool || event.phase || "run")}</span></div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function inspectBuildingHtml(building) {
  const matching = state.events.filter((event) => targetForEvent(event)?.id === building.id).slice(0, 6);
  return `
    <div class="inspectStack">
      <b>${escapeHtml(building.name)}</b>
      <span>${escapeHtml(building.kind)} · ${escapeHtml(building.activeState || "idle")}</span>
      <p>Receives ${matching.length} recent lifecycle events.</p>
      <pre>${escapeHtml(JSON.stringify(matching.map((event) => ({
        type: event.type,
        agent: event.agentName,
        phase: event.phase,
        status: event.status,
        message: event.message
      })), null, 2))}</pre>
    </div>
  `;
}

function inspectReplayHtml(value) {
  const session = value.session || {};
  const replayEvents = state.events.filter((event) => event.sessionId === session.id || event.sessionName === session.name);
  return `
    <div class="inspectStack">
      <b>Replay / ${escapeHtml(session.name || "latest")}</b>
      <span>${escapeHtml(session.status || "ready")} · ${value.events || replayEvents.length} events · ${escapeHtml(session.phase || "unknown")}</span>
      <div class="metricRows compact">
        <div class="metricRow"><span>Tokens</span><b>${(session.tokens || 0).toLocaleString()}</b></div>
        <div class="metricRow"><span>Errors</span><b>${session.errorCount || 0}</b></div>
        <div class="metricRow"><span>Last event</span><b>${escapeHtml(session.lastEventType || "none")}</b></div>
      </div>
      <p>${escapeHtml(session.lastMessage || "Replay reconstructs this run as world movement.")}</p>
      <pre>${escapeHtml(JSON.stringify(replayEvents.slice().reverse().map((event) => ({
        type: event.type,
        phase: event.phase,
        tool: event.tool,
        status: event.status,
        message: event.message
      })), null, 2))}</pre>
    </div>
  `;
}

function openModal(title, html, eyebrow = "Console") {
  els.modalEyebrow.textContent = eyebrow;
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = html;
  els.modal.classList.remove("hidden");
}

function closeModal() {
  els.modal.classList.add("hidden");
}

function buildingHtml(building) {
  const totalTokens = state.agents.reduce((sum, agent) => sum + (agent.tokens || 0), 0);
  const recentForTools = state.events.filter((event) => event.tool).slice(0, 8);
  const rows = {
    command: [
      ["Connected agents", state.agents.length],
      ["Active sessions", state.sessions.filter((s) => s.status === "running").length],
      ["Live stream", els.streamStatus.textContent],
      ["Stored events", state.events.length]
    ],
    mine: [
      ["Total tokens", totalTokens.toLocaleString()],
      ["Largest event", Math.max(0, ...state.events.map((e) => e.tokens || 0)).toLocaleString()],
      ["Token alert threshold", "5,000/event"],
      ["Cost model", "ready for provider pricing"]
    ],
    tower: [
      ["Open alerts", state.alerts.filter((a) => !a.resolvedAt).length],
      ["Critical alerts", state.alerts.filter((a) => a.level === "critical").length],
      ["Rules", "errors, token spikes, slow tasks"],
      ["Last alert", state.alerts[0]?.title || "none"]
    ],
    replay: [
      ["Replayable sessions", state.sessions.length],
      ["Latest session", state.sessions[0]?.name || "none"],
      ["Activity events", state.events.length],
      ["Replay speed", "900ms/event"]
    ],
    tools: [
      ["Recent tool calls", recentForTools.length],
      ["Top tool", recentForTools[0]?.tool || "none"],
      ["Adapters", "REST, SDK, skill"],
      ["Webhook endpoint", "POST /v1/events"]
    ],
    memory: [
      ["Memory writes", state.events.filter((e) => e.type === "memory_write").length],
      ["Latest memory", state.events.find((e) => e.type === "memory_write")?.message || "none"],
      ["Trace links", state.events.filter((e) => e.trace?.spanId).length],
      ["Retention", "replay-ready"]
    ],
    gate: [
      ["Inbound messages", state.events.filter((e) => e.type === "message").length],
      ["Approval waits", state.events.filter((e) => e.type === "approval_wait").length],
      ["Webhook stream", els.streamStatus.textContent],
      ["Event schema", "v1 lifecycle"]
    ]
  }[building.id] || [];

  const list = rows.map(([k, v]) => `<div class="metricRow"><span>${k}</span><b>${v}</b></div>`).join("");
  const extra = building.id === "replay"
    ? `<div class="replayBar"><b>Replay progress</b><div class="progressTrack"><div id="modalReplayProgress" class="progressFill"></div></div><button onclick="window.AgentWorldUI.startReplay()">Start latest replay</button></div>`
    : building.id === "tools"
      ? `<pre>${JSON.stringify(recentForTools, null, 2)}</pre>`
      : "";
  return `<div class="metricRows">${list}</div>${extra}`;
}

function zoneWorldCardHtml(building) {
  const recent = state.events.filter((event) => targetForEvent(event)?.id === building.id).slice(0, 5);
  const activeAgents = state.agents
    .map((agent) => ({
      agent,
      distance: Math.hypot((agent.targetX ?? agent.x) - (building.x + building.w / 2), (agent.targetY ?? agent.y) - (building.y + building.h / 2))
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);
  const zoneCopy = {
    registry: "Resolves DID identity, trust score, node presence, and agent registration events.",
    pr: "Tracks PR creation, reviews, merge readiness, and reviewer handoffs.",
    commits: "Shows pushes, branches, ref updates, and source proof movement.",
    issues: "Collects issues, delegated tasks, human approvals, and triage status.",
    publish: "Follows app publish status, Playground deployment, visits, and launch readiness.",
    command: "Coordinates active sessions, orchestration state, and run ownership.",
    tools: "Maps tool calls, SDK adapters, and external action execution.",
    memory: "Stores memory writes, summaries, trace spans, and replay material.",
    tower: "Raises alerts for failures, blocked approvals, token spikes, and slow tasks.",
    mine: "Tracks token flow, cost spikes, and provider usage.",
    replay: "Reconstructs agent runs as movement so sessions can be inspected later.",
    gate: "Receives inbound messages, webhooks, and agent lifecycle events."
  }[building.id] || "Observability zone for live agent work.";
  return `
    <div class="zoneProfile">
      <p>${escapeHtml(zoneCopy)}</p>
      <div class="worldProfileStats">
        <div><b>${recent.length}</b><span>events</span></div>
        <div><b>${activeAgents.length}</b><span>agents</span></div>
        <div><b>${escapeHtml(building.icon || building.kind.slice(0, 3).toUpperCase())}</b><span>zone</span></div>
      </div>
      <div class="worldProfileBlock">
        <h4>Nearest agents</h4>
        <div class="worldRows">
          ${activeAgents.map(({ agent, distance }) => `
            <div><b>${escapeHtml(agent.name)}</b><span>${escapeHtml(agent.role)} · ${distance.toFixed(1)}u</span></div>
          `).join("") || `<p>No agents near this zone.</p>`}
        </div>
      </div>
      <div class="worldProfileBlock">
        <h4>Recent zone events</h4>
        <div class="worldRows">
          ${recent.map((event) => `
            <div><b>${escapeHtml(event.type)}</b><span>${escapeHtml(event.agentName)} · ${escapeHtml(event.tool || event.phase || "event")}</span></div>
          `).join("") || `<p>No zone events yet.</p>`}
        </div>
      </div>
    </div>
  `;
}

function snippetHtml() {
  const skillUrl = `${location.origin}/skill.md`;
  const skillInstall = `Install the AgentsWorld skill:

${skillUrl}

When loaded, the agent should:
1. POST an agent_joined event before work starts.
2. Include metadata.role, metadata.skills, and metadata.services.
3. POST task/tool/result/error events during the run.
4. POST task_complete when the run finishes.

Any agent that follows this skill appears on the AgentsWorld map with its profile, skills, services, activity feed, and replay.`;
  const curl = `curl -s -X POST ${location.origin}/v1/events \\
  -H "Content-Type: application/json" \\
  -d '{
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
  }'`;
  const js = `const AGENTSWORLD_URL = "${location.origin}";

async function agentsWorldEvent(event) {
  await fetch(AGENTSWORLD_URL + "/v1/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agent: "OpenClaude Builder",
      session: "builder-run-" + new Date().toISOString().slice(0, 10),
      provider: "AgentsWorld Skill",
      model: "agent",
      metadata: {
        role: "Builder",
        did: "did:key:openclaude-builder",
        node: "openclaude",
        level: "active",
        skills: ["code.edit", "test.run", "browser.qa", "git.commit"],
        services: ["Feature implementation", "Bug fixing", "Visual QA"]
      },
      ...event
    })
  });
}

await agentsWorldEvent({
  type: "agent_joined",
  phase: "identity",
  status: "success",
  message: "OpenClaude Builder connected to AgentsWorld."
});

await agentsWorldEvent({
  type: "tool_call",
  phase: "tooling",
  tool: "code.edit",
  status: "success",
  tokens: 840,
  durationMs: 3200,
  message: "Editing product UI."
});`;
  return `
    <div class="snippetBox">
      <div class="metricRows">
        <div class="metricRow"><span>Skill URL</span><b>${escapeHtml(skillUrl)}</b></div>
        <div class="metricRow"><span>Effect</span><b>agent appears on the map</b></div>
        <div class="metricRow"><span>Profile</span><b>work + skills + services + replay</b></div>
      </div>
      <p class="eventMeta">Install prompt</p>
      <pre id="skillInstall">${skillInstall}</pre>
      <div class="copyRow"><button onclick="window.AgentWorldUI.copySnippet('skillInstall')">Copy install prompt</button></div>
      <p class="eventMeta">REST connection event</p>
      <pre id="snippetCurl">${curl}</pre>
      <div class="copyRow"><button onclick="window.AgentWorldUI.copySnippet('snippetCurl')">Copy REST event</button></div>
      <p class="eventMeta">JavaScript agent adapter</p>
      <pre id="snippetJs">${js}</pre>
      <div class="copyRow"><button onclick="window.AgentWorldUI.copySnippet('snippetJs')">Copy JS adapter</button></div>
    </div>
  `;
}

function handleCanvasClick(event) {
  event.preventDefault();
  if (state.drag && Math.hypot(event.clientX - state.drag.x, event.clientY - state.drag.y) > 4) return;
  const rect = els.canvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const hit = [...state.hitTargets].reverse().find((target) => {
    return Math.hypot(localX - target.x, localY - target.y) <= target.r;
  });
  if (hit?.kind === "agent") {
    openAgentProfile(hit.data);
    state.highlightedAgentId = hit.data.id;
    setFollowAgent(hit.data, Boolean(state.followAgentId));
    return;
  }
  if (hit?.kind === "building") {
    inspect("building", hit.data);
    state.highlightedBuildingId = hit.data.id;
    closeAgentWorldCard();
    openZoneWorldCard(hit.data);
    setCameraTarget(hit.data.x + hit.data.w / 2, hit.data.y + hit.data.h / 2, Math.max(state.camera.zoom, 1.08));
    showToast(`${hit.data.name} opened`);
    return;
  }
  // Empty world clicks intentionally do nothing; operator movement is WASD-only.
}

async function refresh() {
  const response = await fetch("/v1/state");
  const data = await response.json();
  state.agents = data.agents || [];
  state.sessions = data.sessions || [];
  state.events = data.events || [];
  state.alerts = data.alerts || [];
  renderLists();
}

async function postEvent(body) {
  const response = await fetch("/v1/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function postGitLawbDemo() {
  const response = await fetch("/v1/adapters/gitlawb/demo", { method: "POST" });
  return response.json();
}

function setPublishMode(enabled) {
  state.publishMode = enabled;
  document.body.classList.toggle("publishMode", enabled);
  els.publishHero?.classList.toggle("hidden", !enabled);
  if (els.publishModeBtn) els.publishModeBtn.textContent = enabled ? "Exit GitLawb view" : "GitLawb launch view";
  if (enabled) {
    setLayerMode("network");
    state.followAgentId = null;
    state.cameraTarget = null;
    state.camera = { ...overviewCamera, zoom: 0.52 };
    showToast("GitLawb launch view ready");
    return;
  }
  clearInterval(state.publishTimer);
  state.publishTimer = null;
  setLayerMode("world");
  showToast("GitLawb launch view off");
}

async function runGitLawbDemo({ publish = false } = {}) {
  if (publish) setPublishMode(true);
  setLayerMode("network");
  const result = await postGitLawbDemo();
  showToast(`GitLawb flow: ${result.count || 0} events`);
  setTimeout(() => {
    const publishEvent = state.events.find((event) => event.type === "app_published");
    if (publishEvent) focusEvent(publishEvent);
  }, 900);
  return result;
}

function connectStream() {
  const stream = new EventSource("/v1/events/stream");
  stream.addEventListener("ready", () => {
    els.streamStatus.textContent = "live";
  });
  stream.addEventListener("event", (message) => {
    const event = JSON.parse(message.data);
    state.events.unshift(event);
    state.events = state.events.slice(0, 250);
    applyEventMotion(event);
    renderLists();
  });
  stream.addEventListener("alert", (message) => {
    state.alerts.unshift(JSON.parse(message.data));
    state.alerts = state.alerts.slice(0, 80);
    renderLists();
  });
  stream.addEventListener("state", (message) => {
    const data = JSON.parse(message.data);
    state.agents = data.agents || state.agents;
    state.sessions = data.sessions || state.sessions;
    state.alerts = data.alerts || state.alerts;
    renderLists();
  });
  stream.onerror = () => {
    els.streamStatus.textContent = "reconnecting";
  };
}

function startReplay() {
  const session = state.sessions.find((item) => item.id === els.sessionSelect.value) || state.sessions[0];
  if (!session) return;
  const events = state.events.filter((event) => event.sessionId === session.id || event.sessionName === session.name).reverse();
  if (!events.length) return;
  clearInterval(state.replay.timer);
  state.replay = { active: true, events, index: 0, timer: null };
  setLayerMode("replay");
  inspect("replay", { session, events: events.length });
  els.replayLabel.textContent = `Replaying ${session.name}`;
  els.replayMeta.textContent = `${events.length} events`;
  els.replayProgress.style.width = "0%";
  state.replay.timer = setInterval(() => {
    const event = state.replay.events[state.replay.index++];
    if (!event) {
      clearInterval(state.replay.timer);
      state.replay.active = false;
      els.replayLabel.textContent = "Replay complete";
      els.replayMeta.textContent = session.name;
      showToast("Replay finished");
      return;
    }
    applyEventMotion(event);
    focusEvent(event);
    inspect("replay event", event);
    const progress = document.getElementById("modalReplayProgress");
    const pct = Math.round((state.replay.index / state.replay.events.length) * 100);
    if (progress) progress.style.width = `${pct}%`;
    els.replayProgress.style.width = `${pct}%`;
  }, 900);
  showToast(`Replaying ${events.length} events`);
}

async function copySnippet(id) {
  const text = document.getElementById(id)?.textContent || "";
  await navigator.clipboard.writeText(text);
  showToast("Copied");
}

async function demoEvent() {
  const agents = ["Scout", "Forge", "Relay", "Oracle", "Patch"];
  const tools = ["web.search", "code.edit", "api.call", "browser.inspect", "memory.write", "gitlawb.pr", "git.commit", "playground.publish"];
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const roll = Math.random();
  const gitTypes = ["commit_pushed", "ref_updated", "pr_opened", "issue_created", "task_delegated", "app_published"];
  const type = roll > 0.92 ? "tool_failed" : roll > 0.84 ? "approval_wait" : roll > 0.72 ? gitTypes[Math.floor(Math.random() * gitTypes.length)] : roll > 0.62 ? "task_complete" : roll > 0.5 ? "memory_write" : roll > 0.34 ? "tool_result" : roll > 0.14 ? "tool_call" : "task_started";
  const isError = type === "tool_failed";
  const isWarning = type === "approval_wait" || type === "issue_created" || type === "task_delegated";
  const result = await postEvent({
    agent,
    session: `${agent.toLowerCase()}-run`,
    type,
    tool: type === "task_started" || type === "approval_wait" || type === "task_complete" ? null : tools[Math.floor(Math.random() * tools.length)],
    status: isError ? "error" : isWarning ? "warning" : type === "task_started" ? "info" : "success",
    provider: Math.random() > 0.5 ? "OpenAI" : "Anthropic",
    model: Math.random() > 0.5 ? "gpt-5.4" : "claude-sonnet",
    tokens: Math.floor(200 + Math.random() * 6500),
    durationMs: Math.floor(400 + Math.random() * 36000),
    message: `Lifecycle event: ${type}`,
    input: { source: "dashboard", type },
    output: isError ? { ok: false, retryable: true } : { ok: true }
  });
  showToast(result.alert ? `Alert: ${result.alert.title}` : `${agent} event received`);
}

function bindUi() {
  document.getElementById("seedBtn").addEventListener("click", demoEvent);
  document.getElementById("snippetBtn").addEventListener("click", () => {
    openModal("Install AgentsWorld skill", snippetHtml(), "Agent skill");
  });
  document.getElementById("resetViewBtn").addEventListener("click", () => {
    state.followAgentId = null;
    state.cameraTarget = null;
    state.camera = { ...closeCamera };
    state.avatar = { x: 28, y: 24, walk: 0, facing: "down" };
    if (els.followBtn) els.followBtn.textContent = "Follow off";
    showToast("Close operations view");
  });
  document.getElementById("overviewBtn").addEventListener("click", () => {
    state.followAgentId = null;
    state.cameraTarget = null;
    state.camera = { ...overviewCamera };
    if (els.followBtn) els.followBtn.textContent = "Follow off";
    showToast("Map overview");
  });
  els.modeWorldBtn?.addEventListener("click", () => setLayerMode("world"));
  els.modeNetworkBtn?.addEventListener("click", () => setLayerMode("network"));
  els.modeReplayBtn?.addEventListener("click", () => setLayerMode("replay"));
  els.publishModeBtn?.addEventListener("click", () => {
    setPublishMode(!state.publishMode);
    if (!state.publishMode) return;
    clearInterval(state.publishTimer);
    state.publishTimer = setInterval(() => runGitLawbDemo({ publish: false }), 9000);
  });
  els.gitlawbDemoBtn?.addEventListener("click", () => runGitLawbDemo({ publish: state.publishMode }));
  els.followBtn?.addEventListener("click", () => {
    if (state.followAgentId) {
      setFollowAgent(null, false);
      showToast("Follow mode off");
      return;
    }
    const agent = state.agents.find((item) => item.id === state.highlightedAgentId) || state.agents[0];
    if (agent) {
      setFollowAgent(agent, true);
      showToast(`Following ${agent.name}`);
    }
  });
  document.getElementById("burstBtn").addEventListener("click", () => {
    let count = 0;
    const timer = setInterval(() => {
      demoEvent();
      count += 1;
      if (count >= 8) clearInterval(timer);
    }, 650);
    showToast("Streaming demo burst");
  });
  document.getElementById("replayBtn").addEventListener("click", startReplay);
  document.getElementById("modalClose").addEventListener("click", closeModal);
  els.agentWorldClose?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAgentWorldCard();
  });
  els.zoneWorldClose?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeZoneWorldCard();
  });
  els.agentWorldCard?.addEventListener("click", (event) => event.stopPropagation());
  els.zoneWorldCard?.addEventListener("click", (event) => event.stopPropagation());
  els.proximityPrompt.addEventListener("click", (event) => {
    event.stopPropagation();
    const button = event.target.closest("[data-nearby-agent]");
    const agent = button
      ? state.agents.find((item) => item.id === button.dataset.nearbyAgent)
      : state.nearbyAgent;
    if (agent) openAgentProfile(agent, { force: true });
  });
  els.modal.addEventListener("click", (event) => {
    if (event.target === els.modal) closeModal();
  });
  document.getElementById("addAgentBtn").addEventListener("click", async () => {
    const name = `Agent ${state.agents.length + 1}`;
    await fetch("/v1/agents", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, role: "Demo" }) });
    refresh();
    showToast(`${name} spawned`);
  });

  document.body.addEventListener("click", (event) => {
    const agentCard = event.target.closest("[data-agent]");
    const eventCard = event.target.closest("[data-event]");
    const alertCard = event.target.closest("[data-alert]");
    if (agentCard) {
      const agent = state.agents.find((item) => item.id === agentCard.dataset.agent);
      if (agent) {
        inspect("agent", agent);
        state.highlightedAgentId = agent.id;
        setFollowAgent(agent, true);
        setCameraTarget(agent.x, agent.y, Math.max(state.camera.zoom, 1.18));
        showToast(`Following ${agent.name}`);
      }
      return;
    }
    if (eventCard) {
      const selectedEvent = state.events.find((item) => item.id === eventCard.dataset.event);
      inspect("event", selectedEvent);
      focusEvent(selectedEvent);
      return;
    }
    if (alertCard) {
      const alert = state.alerts.find((item) => item.id === alertCard.dataset.alert);
      inspect("alert", alert);
      focusEvent(state.events.find((item) => item.id === alert?.eventId));
    }
  });

  els.canvas.addEventListener("mousedown", (event) => {
    state.followAgentId = null;
    state.cameraTarget = null;
    if (els.followBtn) els.followBtn.textContent = "Follow off";
    state.drag = { x: event.clientX, y: event.clientY, cx: state.camera.x, cy: state.camera.y };
  });
  els.canvas.addEventListener("click", handleCanvasClick);
  window.addEventListener("mouseup", () => { setTimeout(() => { state.drag = null; }, 0); });
  window.addEventListener("mousemove", (event) => {
    if (!state.drag) return;
    state.camera.x = state.drag.cx + (event.clientX - state.drag.x) / state.camera.zoom;
    state.camera.y = state.drag.cy + (event.clientY - state.drag.y) / state.camera.zoom;
  });
  els.canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    state.followAgentId = null;
    state.cameraTarget = null;
    if (els.followBtn) els.followBtn.textContent = "Follow off";
    const direction = Math.sign(event.deltaY || 0);
    const zoomStep = event.shiftKey ? 0.0035 : 0.009;
    state.camera.zoom = Math.min(2.05, Math.max(0.55, state.camera.zoom - direction * zoomStep));
  }, { passive: false });
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d"].includes(key)) state.keys.add(key);
    if (key === "e" && state.nearbyAgent && els.modal.classList.contains("hidden")) {
      event.preventDefault();
      openAgentProfile(state.nearbyAgent, { force: true });
    }
    if (event.key === "Escape") {
      closeModal();
      closeAgentWorldCard();
      closeZoneWorldCard();
    }
  });
  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.key.toLowerCase());
  });
}

window.AgentWorldUI = { startReplay, demoEvent, copySnippet };

window.addEventListener("resize", resize);
initWorld();
resize();
bindUi();
connectStream();
refresh();
animate();

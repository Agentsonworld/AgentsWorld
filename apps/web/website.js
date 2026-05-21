const canvas = document.getElementById("landingMap");
const ctx = canvas.getContext("2d");

const tileW = 54;
const tileH = 28;
const buildings = [
  { name: "Agent Registry", x: 9, y: 8, w: 5, h: 4, color: "#2dd4bf", roof: "#073b3f", sign: "DID" },
  { name: "PR Arena", x: 26, y: 7, w: 6, h: 4, color: "#c084fc", roof: "#291044", sign: "PR" },
  { name: "Command Core", x: 26, y: 19, w: 7, h: 5, color: "#8b7cff", roof: "#17101f", sign: "OPS" },
  { name: "Commit Forge", x: 43, y: 25, w: 6, h: 5, color: "#f59e0b", roof: "#3b1f08", sign: "GIT" },
  { name: "Replay Lab", x: 22, y: 32, w: 7, h: 4, color: "#4ade80", roof: "#0b3d20", sign: "RUN" },
  { name: "Publish Tower", x: 38, y: 35, w: 5, h: 5, color: "#60a5fa", roof: "#0f2141", sign: "APP" }
];
const agents = [
  { name: "Registry", x: 13, y: 11, color: "#2dd4bf", kind: "DID" },
  { name: "Scout", x: 18, y: 21, color: "#60a5fa", kind: "search" },
  { name: "Forge", x: 34, y: 23, color: "#f5d84b", kind: "build" },
  { name: "Oracle", x: 31, y: 32, color: "#c084fc", kind: "analysis" },
  { name: "Patch", x: 45, y: 31, color: "#fb7185", kind: "fix" }
];

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(420, Math.floor(rect.width * dpr));
  canvas.height = Math.max(420, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function iso(x, y) {
  return { x: (x - y) * tileW / 2, y: (x + y) * tileH / 2 };
}

function sp(x, y) {
  const p = iso(x, y);
  return {
    x: canvas.clientWidth / 2 + p.x * 0.86,
    y: 70 + (p.y - 360) * 0.86
  };
}

function noise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function diamond(p, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - tileH * 0.43);
  ctx.lineTo(p.x + tileW * 0.43, p.y);
  ctx.lineTo(p.x, p.y + tileH * 0.43);
  ctx.lineTo(p.x - tileW * 0.43, p.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawGrid(time) {
  for (let x = 0; x < 56; x++) {
    for (let y = 0; y < 42; y++) {
      const p = sp(x, y);
      if (p.x < -80 || p.x > canvas.clientWidth + 80 || p.y < -80 || p.y > canvas.clientHeight + 80) continue;
      const water = Math.hypot(x - 39, y - 36) < 7;
      const path = Math.abs(y - 21 - Math.sin(x * 0.4) * 2) < 1.2 || Math.abs(x - y + 7) < 1.2;
      const n = noise(x, y);
      const fill = water
        ? "rgba(30, 117, 151, 0.72)"
        : path
          ? "rgba(53, 50, 33, 0.78)"
          : n > 0.74 ? "rgba(24, 55, 39, 0.76)" : "rgba(18, 45, 33, 0.72)";
      diamond(p, fill, path ? "rgba(245,216,75,0.16)" : "rgba(98, 255, 180, 0.055)");
      if (!water && n > 0.965) drawTree(x, y);
      if (water && n > 0.88) {
        const glintOffset = (noise(x + 17, y + 29) - 0.5) * 3;
        ctx.fillStyle = "rgba(224,242,254,0.7)";
        ctx.fillRect(p.x - 2, p.y + glintOffset, 4, 1.5);
      }
    }
  }
}

function drawTree(x, y) {
  const p = sp(x, y);
  ctx.fillStyle = "rgba(18, 10, 6, 0.7)";
  ctx.fillRect(p.x - 2, p.y - 11, 4, 15);
  ctx.fillStyle = "#26b969";
  ctx.beginPath();
  ctx.arc(p.x - 7, p.y - 16, 10, 0, Math.PI * 2);
  ctx.arc(p.x + 7, p.y - 16, 10, 0, Math.PI * 2);
  ctx.arc(p.x, p.y - 25, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawBuilding(b, time) {
  for (let x = b.x - 1; x <= b.x + b.w; x++) {
    for (let y = b.y - 1; y <= b.y + b.h; y++) diamond(sp(x, y), "rgba(255,255,255,0.045)", "rgba(245,216,75,0.12)");
  }
  const base = sp(b.x + b.w / 2, b.y + b.h / 2);
  const w = b.w * 22;
  const h = b.h * 13;
  const lift = 46 + b.h * 4;
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(base.x + 12, base.y + 18, w * 0.75, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(b.color, -0.3);
  ctx.beginPath();
  ctx.moveTo(base.x - w / 2, base.y - lift * 0.15);
  ctx.lineTo(base.x, base.y + h * 0.35);
  ctx.lineTo(base.x, base.y + h * 0.95);
  ctx.lineTo(base.x - w / 2, base.y + h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(b.color, -0.08);
  ctx.beginPath();
  ctx.moveTo(base.x + w / 2, base.y - lift * 0.15);
  ctx.lineTo(base.x, base.y + h * 0.35);
  ctx.lineTo(base.x, base.y + h * 0.95);
  ctx.lineTo(base.x + w / 2, base.y + h * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = b.roof;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y - lift);
  ctx.lineTo(base.x + w / 2, base.y - lift * 0.15);
  ctx.lineTo(base.x, base.y + h * 0.35);
  ctx.lineTo(base.x - w / 2, base.y - lift * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = b.color;
  ctx.globalAlpha = 0.8;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(4,6,10,0.84)";
  ctx.fillRect(base.x - 44, base.y - lift - 24, 88, 22);
  ctx.strokeStyle = "rgba(245,216,75,0.22)";
  ctx.strokeRect(base.x - 44, base.y - lift - 24, 88, 22);
  ctx.fillStyle = "#f6f0dc";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(b.name, base.x, base.y - lift - 9);
  ctx.fillStyle = b.color;
  ctx.fillText(b.sign, base.x, base.y - lift * 0.32);
  if (Math.sin(time / 500 + b.x) > 0.4) {
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = b.color;
    ctx.beginPath();
    ctx.arc(base.x, base.y - lift * 0.45, 38 + Math.sin(time / 300) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawAgent(a, time) {
  const p = sp(a.x + Math.sin(time / 1300 + a.x) * 0.25, a.y + Math.cos(time / 1200 + a.y) * 0.2);
  const bob = Math.sin(time / 220 + a.x) * 2;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 5, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#15151f";
  ctx.fillRect(p.x - 11, p.y - 31 + bob, 22, 24);
  ctx.fillStyle = a.color;
  ctx.fillRect(p.x - 8, p.y - 28 + bob, 16, 20);
  ctx.fillStyle = "#f6f0dc";
  ctx.fillRect(p.x - 8, p.y - 45 + bob, 16, 16);
  ctx.fillStyle = "#0b0b10";
  ctx.fillRect(p.x - 5, p.y - 39 + bob, 3, 3);
  ctx.fillRect(p.x + 3, p.y - 39 + bob, 3, 3);
  ctx.fillStyle = a.color;
  ctx.beginPath();
  ctx.moveTo(p.x - 8, p.y - 47 + bob);
  ctx.lineTo(p.x - 4, p.y - 55 + bob);
  ctx.lineTo(p.x, p.y - 48 + bob);
  ctx.lineTo(p.x + 4, p.y - 55 + bob);
  ctx.lineTo(p.x + 8, p.y - 47 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(4,6,10,0.86)";
  ctx.fillRect(p.x - 38, p.y - 70 + bob, 76, 20);
  ctx.strokeStyle = a.color;
  ctx.strokeRect(p.x - 38, p.y - 70 + bob, 76, 20);
  ctx.fillStyle = "#f6f0dc";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(a.name, p.x, p.y - 56 + bob);
}

function drawRoutes(time) {
  const routePoints = [
    [13, 11], [28, 21], [45, 29], [40, 37],
    [18, 21], [28, 21], [31, 33]
  ];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = sp(routePoints[i][0], routePoints[i][1]);
    const b = sp(routePoints[i + 1][0], routePoints[i + 1][1]);
    ctx.strokeStyle = i % 2 ? "rgba(45,212,191,0.5)" : "rgba(245,216,75,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo((a.x + b.x) / 2, (a.y + b.y) / 2 - 38);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const t = (time / 1600 + i * 0.19) % 1;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 38;
    ctx.fillStyle = i % 2 ? "#2dd4bf" : "#f5d84b";
    ctx.beginPath();
    ctx.arc(x, y, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function shade(hex, amt) {
  const raw = hex.replace("#", "");
  const n = parseInt(raw, 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt * 255));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt * 255));
  const b = Math.max(0, Math.min(255, (n & 255) + amt * 255));
  return `rgb(${r}, ${g}, ${b})`;
}

function render(time = 0) {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  drawGrid(time);
  drawRoutes(time);
  buildings.forEach((building) => drawBuilding(building, time));
  agents.forEach((agent) => drawAgent(agent, time));
  ctx.fillStyle = "rgba(5,8,12,0.72)";
  ctx.fillRect(canvas.clientWidth - 170, 16, 150, 94);
  ctx.strokeStyle = "rgba(45,212,191,0.24)";
  ctx.strokeRect(canvas.clientWidth - 170, 16, 150, 94);
  ctx.fillStyle = "#9ffbf1";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillText("map", canvas.clientWidth - 154, 38);
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = ["#2dd4bf", "#c084fc", "#f5d84b", "#60a5fa"][i % 4];
    ctx.fillRect(canvas.clientWidth - 148 + (i % 5) * 23, 50 + Math.floor(i / 5) * 13, 11, 8);
  }
  requestAnimationFrame(render);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
document.querySelectorAll("[data-external-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = link.href;
  });
});
requestAnimationFrame(render);

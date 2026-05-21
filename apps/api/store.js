const fs = require("node:fs/promises");
const path = require("node:path");

const dbPath = process.env.AGENTWORLD_DB_PATH
  ? path.resolve(process.env.AGENTWORLD_DB_PATH)
  : path.resolve(__dirname, "../../data/dev-db.json");

const seed = { agents: [], sessions: [], events: [], alerts: [] };

async function ensureDir() {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
}

async function loadDb() {
  await ensureDir();
  try {
    return { ...seed, ...JSON.parse(await fs.readFile(dbPath, "utf8")) };
  } catch {
    await saveDb(seed);
    return structuredClone(seed);
  }
}

async function saveDb(db) {
  await ensureDir();
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

module.exports = { loadDb, saveDb, id, now };

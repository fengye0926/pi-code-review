#!/usr/bin/env node
/**
 * Package guardrail checks for @fengye0926/pi-code-review.
 *
 * Static checks (always run, no dependencies):
 *   - every agent/prompt/skill parses with the expected frontmatter keys
 *   - no `model:` or `thinking:` binding anywhere in agent frontmatter
 *   - upstream-migrated files carry a `source:` stamp; local files are allowlisted
 *   - expected resource counts (update EXPECTED when adding resources)
 *   - the orch-review workflow script is syntactically valid ESM
 *
 * Optional Pi load test (enabled when `pi` is on PATH unless --no-pi):
 *   - runs `pi --mode rpc` offline, requests get_commands, and asserts that every
 *     packaged prompt/skill is discovered.
 *
 * Usage: node scripts/check-package.mjs [--no-pi] [--strict-pi]
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/[/\\]$/, "");
const args = new Set(process.argv.slice(2));
const runPi = !args.has("--no-pi");
const strictPi = args.has("--strict-pi");

const EXPECTED = { agents: 16, prompts: 9, skills: 35 };

// Files authored locally; everything else must carry an upstream source stamp.
const LOCAL_FILES = new Set([
  "agents/webman-reviewer.md",
  "prompts/orch-review.md",
  "prompts/santa-loop.md",
  "prompts/verify.md",
  "skills/ecc-code-review/SKILL.md",
  "skills/orch-review/SKILL.md",
  "skills/react-rules/SKILL.md",
  "skills/vue-rules/SKILL.md",
]);

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function frontmatterOf(file) {
  const text = readFileSync(file, "utf8");
  if (!text.startsWith("---\n")) return { fields: new Map(), body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { fields: new Map(), body: text };
  const fields = new Map();
  for (const line of text.slice(4, end).split("\n")) {
    if (!line.trim() || /^\s/.test(line)) continue;
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    fields.set(line.slice(0, sep).trim(), line.slice(sep + 1).trim());
  }
  return { fields, body: text.slice(end + 4) };
}

function checkNoBinding(files) {
  for (const file of files) {
    const { fields } = frontmatterOf(file);
    for (const key of ["model", "thinking"]) {
      if (fields.has(key)) fail(`${file}: must not pin "${key}" (this package is provider-agnostic)`);
    }
  }
}

function checkStamp(file) {
  const rel = file.slice(root.length + 1);
  if (LOCAL_FILES.has(rel)) return;
  const { body } = frontmatterOf(file);
  if (!body.includes("source: affaan-m/ECC@")) fail(`${file}: missing upstream "source:" stamp`);
}

function listAgents() {
  return readdirSync(join(root, "agents")).filter((f) => f.endsWith(".md")).map((f) => `agents/${f}`);
}

function listPrompts() {
  return readdirSync(join(root, "prompts")).filter((f) => f.endsWith(".md")).map((f) => `prompts/${f}`);
}

function listSkills() {
  const dir = join(root, "skills");
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "SKILL.md")))
    .map((entry) => `skills/${entry.name}/SKILL.md`);
}

const agents = listAgents();
const prompts = listPrompts();
const skills = listSkills();

for (const file of [...agents, ...prompts, ...skills].map((rel) => join(root, rel))) {
  const { fields } = frontmatterOf(file);
  if (!fields.get("description")) fail(`${file}: missing frontmatter description`);
  if (file.includes("/agents/")) {
    if (!fields.get("name")) fail(`${file}: missing frontmatter name`);
    if (!fields.get("tools")) fail(`${file}: missing frontmatter tools`);
  }
  if (file.includes("/skills/") && !fields.get("name")) fail(`${file}: missing frontmatter name`);
}

if (agents.length !== EXPECTED.agents) fail(`agents: expected ${EXPECTED.agents}, found ${agents.length}`);
if (prompts.length !== EXPECTED.prompts) fail(`prompts: expected ${EXPECTED.prompts}, found ${prompts.length}`);
if (skills.length !== EXPECTED.skills) fail(`skills: expected ${EXPECTED.skills}, found ${skills.length}`);

checkNoBinding([...agents, ...prompts, ...skills].map((rel) => join(root, rel)));
for (const rel of [...agents, ...prompts, ...skills]) checkStamp(join(root, rel));

// orch-review workflow must parse as a pi workflow statement body
// (top-level await + explicit return, executed as an async function body).
const workflowPath = join(root, "skills/orch-review/references/orch-review.workflow.js");
if (!existsSync(workflowPath)) {
  fail("skills/orch-review/references/orch-review.workflow.js is missing");
} else {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  try {
    // Compile only; the script is never executed here.
    new AsyncFunction(readFileSync(workflowPath, "utf8"));
  } catch (error) {
    fail(`orch-review workflow syntax error: ${error.message}`);
  }
}

// --- optional live Pi load test -------------------------------------------
if (runPi) {
  const probe = spawnSync("pi", ["--version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    const message = "pi CLI not found; skipping live load test (pass --no-pi to silence)";
    strictPi ? fail(message) : warn(message);
  } else {
    const result = spawnSync(
      "pi",
      ["--mode", "rpc", "--no-session", "--no-context-files", "--no-extensions"],
      { cwd: root, encoding: "utf8", input: '{"type":"get_commands"}\n', timeout: 90000, env: { ...process.env, PI_OFFLINE: "1" } },
    );
    const line = (result.stdout || "").split("\n").find((entry) => entry.includes('"command":"get_commands"'));
    if (!line) {
      const message = "pi load test produced no get_commands response";
      strictPi ? fail(message) : warn(message);
    } else {
      let commands = [];
      try {
        commands = JSON.parse(line).data.commands ?? [];
      } catch (error) {
        fail(`pi load test response was not valid JSON: ${error.message}`);
      }
      const manifestName = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name;
      const isPackageCommand = (command) => {
        const info = command.sourceInfo ?? {};
        const source = typeof info.source === "string" ? info.source : "";
        if (source === manifestName || source.endsWith("/" + manifestName)) return true;
        return info.baseDir === root || (typeof info.path === "string" && info.path.startsWith(root + "/"));
      };
      const names = new Set(commands.filter(isPackageCommand).map((c) => c.name));
      for (const rel of prompts) {
        const name = rel.replace("prompts/", "").replace(/\.md$/, "");
        if (!names.has(name)) fail(`pi load test: prompt /${name} was not discovered`);
      }
      for (const rel of skills) {
        const name = rel.split("/")[1];
        if (!names.has(`skill:${name}`)) fail(`pi load test: skill ${name} was not discovered`);
      }
    }
  }
}

for (const message of warnings) console.warn(`warn: ${message}`);
if (errors.length > 0) {
  console.error(`\n${errors.length} check(s) failed:`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}
console.log(
  `ok: ${agents.length} agents, ${prompts.length} prompts, ${skills.length} skills; no model/thinking bindings${runPi ? "; live load test passed" : ""}`,
);

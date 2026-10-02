---
name: code-review-skill
description: Independent code review with ECC-style specialized reviewers. Use when the user asks to review code changes or a PR, wants an independent quality/security pass on recent work, or after completing a non-trivial implementation. Routes by lane - general, TypeScript/JS, Vue+TypeScript, React+TypeScript, PHP, Java, Go, Python, database, security, or the full PR review commands.
---

# ECC Code Review

Dispatch independent reviewers in fresh subagent contexts. The parent (you) never
reviews its own work inline — authorship bias defeats the review gates.

## Lane routing

Pick lanes by what changed, then launch them in parallel (one tool call each):

| Change touches | Dispatch |
|---|---|
| Anything (default lane) | `code-reviewer` |
| `.ts`/`.js` without Vue/React imports (Node, libraries, plain TypeScript) | `typescript-reviewer` |
| `.vue` files, or `.ts`/`.js` with Vue imports (Pinia, Vue Router, Nuxt) | `vue-reviewer` **and** `typescript-reviewer` together |
| `.jsx`/`.tsx` files or React imports | `react-reviewer` **and** `typescript-reviewer` together |
| `.php` files (Laravel / plain PHP; upstream `php-reviewer` is Laravel-flavored) | `php-reviewer` |
| `.php` code in webman / workerman projects | `php-reviewer` **and** `webman-reviewer` together |
| Laravel-specific work (auth, queues, tests) | `php-reviewer` plus the bundled `laravel-patterns` / `laravel-security` / `laravel-tdd` skills as implementer-side reference |
| `.java` files (Spring Boot / Quarkus) | `java-reviewer` |
| `.go` files | `go-reviewer` |
| `.py` files | `python-reviewer` |
| SQL, migrations, schema changes, PostgreSQL / Supabase code | `database-reviewer` |
| MySQL / MariaDB queries or schema | `code-reviewer` with `skill: "mysql-patterns"` (no upstream MySQL reviewer exists; `database-reviewer` is PostgreSQL-only) |
| Auth, user input, payments, API endpoints, secrets, crypto | `security-reviewer` additionally |
| PR with quality-analyzer depth (comments, tests, silent failures, types, simplification) | `/review-pr` runs the full six-agent stack |
| Highest-rigor gate before merge (deduped findings, every CRITICAL/HIGH independently verified, fail-closed) | `/orch-review` runs the packaged pi-subagents workflow |
| Step-by-step checklist review with validation runs | `/code-review [pr-number\|url]` |

## Dispatch template

Use the `subagent` tool:

```text
{ agent: "code-reviewer", task: "Review <scope>. Diff range: <range or 'uncommitted'>. Files: <list or 'all changed'>. Focus: <optional concerns>. Project conventions: read AGENTS.md / CONTEXT.md first." }
{ agent: "code-reviewer", task: "Review <scope>. ...", skill: "mysql-patterns" }
```

- One `task` per lane; include the exact diff range and file list.
- Pass `skill` (CSV or array) when a lane names a bundled skill, e.g. `mysql-patterns`.
- Model: this package does no model or thinking-level binding. Agents carry no `model:`
  and no `thinking:` and inherit the calling session's model and thinking strength; pass
  `model` at dispatch (a `:high` suffix sets thinking) when a lane needs a different tier
  (keep the repo files provider-agnostic).
- Keep reviewers read-only (except `code-simplifier` when explicitly requested): findings
  come back to the parent; the parent decides what to change.
- Stack notes: reviewers are upstream ECC originals except `webman-reviewer` (locally
  authored, resident-worker lanes). Bundled knowledge skills: `laravel-patterns`,
  `laravel-security`, `laravel-tdd`, `mysql-patterns`, `postgres-patterns`,
  `database-migrations`, `security-review`, `coding-standards`, `frontend-patterns`,
  `backend-patterns`, `golang-patterns`, `golang-testing`, `python-patterns`,
  `python-testing`, `tdd-workflow`, `vue-patterns`, `react-patterns`, `react-testing`,
  `accessibility`, plus the `react-rules` / `vue-rules` rule packs.
  Upstream-only assets still referenced here (commands such as `/go-test`,
  `/react-test`, and the remaining out-of-stack companions) are not included in
  this port; the package README lists them.

## Aggregation rules

1. Merge lanes, then **consolidate**: the same root cause found by two lanes is one finding naming both.
2. Keep only findings the reviewer flagged at >=80% confidence with a cited file:line.
3. Report the severity table (CRITICAL/HIGH/MEDIUM/LOW) and the mechanical verdict:
   no CRITICAL/HIGH -> approve; HIGH only -> warn; any CRITICAL -> block.
4. Zero findings is a valid result — report it, do not manufacture findings.

## Review-trigger policy (from upstream rule, condensed)

Mandatory review: after writing or modifying code, before commits to shared branches,
whenever security-sensitive code changed, and before merging PRs. Before dispatching,
confirm CI/typecheck passes and conflicts are resolved; if they fail, fix or report first.

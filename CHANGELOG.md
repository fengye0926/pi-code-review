# Changelog

All notable changes to `@fengye0926/pi-code-review`. Source of truth for upstream
porting decisions is the migration README; this file tracks packaged capability.

## 1.0.7

- Package guardrails (`scripts/check-package.mjs`): frontmatter sanity, expected
  resource counts, upstream source stamps, no `model:` / `thinking:` bindings,
  orch-review workflow syntax, and an optional live `pi` load test.
- GitHub Actions CI runs the static checks.
- CHANGELOG introduced; local maintainer notes are kept out of the package.

## 1.0.6

- `/orch-review`: pi-native adversarially verified workflow (parallel dimension
  reviewers with auto language detection plus security/database triggers,
  evidence-keyed cross-dimension dedup, independent refutation of every
  CRITICAL/HIGH, fail-closed verdict).
- `/santa-loop`: dual independent reviewer convergence loop (up to 3 rounds).
- `/verify`: six-phase pre-PR verification.

## 1.0.5

- Java review lane: `java-reviewer` (Spring Boot / Quarkus) with
  `springboot-*`, `quarkus-*`, `java-coding-standards` and `jpa-patterns`.

## 1.0.4

- Database and security lanes: `database-reviewer` (PostgreSQL), plus the
  `postgres-patterns`, `database-migrations` and `security-review` packs.

## 1.0.3

- Go and Python lanes with `/go-review` and `/python-review`, the
  `golang-patterns` / `golang-testing` and `python-patterns` / `python-testing`
  packs, and `tdd-workflow`.

## 1.0.2

- PHP and MySQL lanes: upstream Laravel-flavored `php-reviewer`, locally
  authored `webman-reviewer`, the `laravel-*` and `mysql-patterns` packs, and
  `backend-patterns`.

## 1.0.1

- TypeScript/JS, Vue and React lanes with their review commands, the
  `coding-standards` / `frontend-patterns` packs, `vue-patterns`,
  `react-patterns` / `react-testing` / `accessibility`, and the `react-rules` /
  `vue-rules` rule packs.

## 1.0.0

- Initial port of the ECC code review capability to pi: general reviewer plus
  five quality analyzers, `/code-review` and `/review-pr`, the lane-routing
  `ecc-code-review` skill, and the archived `reference/code-review-rule.md`.
- Agents carry no model or thinking-level binding; they inherit the calling
  session (provider-agnostic by design).

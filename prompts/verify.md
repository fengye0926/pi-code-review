---
description: Six-phase verification pass over the work just completed — build, type check, lint, tests with coverage, security grep, and diff review — ending in a PASS/FAIL report. Use before a PR or when quality gates must be shown.
---

<!-- adapted from affaan-m/ECC@c70874f skills/verification-loop/SKILL.md (MIT) for pi -->

# /verify

Run the `verification-loop` skill against the work just completed:

1. **Build** — run the project build; stop and fix on failure.
2. **Type check** — `npx --no-install tsc --noEmit`, `pyright .`, or the project's
   type checker; report all errors.
3. **Lint** — project lint (`npm run lint`, `ruff check .`, …).
4. **Tests** — run the suite with coverage; report passed/failed and the
   coverage number (target: 80% minimum).
5. **Security grep** — scan the changed surface for secrets (`sk-`, `api_key`,
   `.env` values) and leftover debug output (`console.log`, `dd()`, …).
6. **Diff review** — `git diff --stat` plus a read of each changed file for
   unintended changes, missing error handling, and edge cases.

Finish with:

```text
VERIFICATION REPORT
Build: [PASS/FAIL]  Types: [PASS/FAIL] (X errors)  Lint: [PASS/FAIL]
Tests: [PASS/FAIL] (X/Y passed, Z% coverage)  Security: [PASS/FAIL]
Diff: [X files changed]  Overall: [READY/NOT READY] for PR
Issues to Fix: ...
```

If a phase fails, stop and report the failure rather than continuing to later
phases (except where a later phase's evidence is needed to diagnose it).

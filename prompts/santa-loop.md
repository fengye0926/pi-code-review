---
description: Adversarial dual-review convergence loop — two independent reviewers with the same rubric must both pass before the work ships. For the methodology see the `santa-method` skill; for a single adversarial pass over a diff use /orch-review.
argument-hint: "[files | glob | description | blank for uncommitted changes]"
---

<!-- adapted from affaan-m/ECC@c70874f commands/santa-loop.md (MIT) for pi-subagents; no model pinning, no external CLI runtime -->

# /santa-loop

**Input**: $ARGUMENTS

Adversarial dual-review convergence loop. Two independent reviewers with no shared
context must both return PASS before the work ships. If either fails, fix every
flagged issue and re-run with fresh reviewers, up to 3 rounds.

## Steps

1. **Scope** — from `$ARGUMENTS`, or fall back to uncommitted changes
   (`git diff --name-only HEAD`). Read all files under review.
2. **Rubric** — objective PASS/FAIL criteria, at minimum: correctness, security
   (no secrets/injection/OWASP issues), explicit error handling, completeness,
   internal consistency, no regressions. Add domain criteria (type safety, memory
   safety, migration safety, …) as appropriate.
3. **Dual independent review** — launch two reviewers **in parallel** with the
   `subagent` tool, one call per lane, in a single message. Use distinct
   fresh contexts, and different models when available (`model` at dispatch — the
   package pins no model). Each reviewer gets the identical rubric, the same file
   contents, and instructions to find problems rather than approve, and must
   return this JSON verdict:

   ```json
   { "verdict": "PASS | FAIL", "checks": [{"criterion": "...", "result": "PASS|FAIL", "detail": "..."}], "critical_issues": ["..."], "suggestions": ["..."] }
   ```

   If the host's background runner is unavailable (for example a
   host/pi-subagents version mismatch), run the lanes as foreground children
   with `async: false` (one subagent call per turn). Contexts stay independent,
   but the two reviews run sequentially instead of in parallel.

4. **Verdict gate** — both PASS → NICE, proceed to step 6. Either FAIL → NAUGHTY,
   merge and dedupe critical issues from both reviewers and continue.
5. **Fix cycle (NAUGHTY)** — fix only what was flagged (no drive-by refactors),
   then re-run step 3 with **fresh** reviewers. Maximum 3 iterations; if still
   NAUGHTY after round 3, stop and report the remaining issues for manual review.
6. **Ship / report** — when both reviewers PASS, report the final verdict. Push
   only when the user asked for a push (never mid-loop).
7. **Final report**:

   ```text
   SANTA VERDICT: [NICE / NAUGHTY (escalated)]
   Reviewer A: [PASS/FAIL]  Reviewer B: [PASS/FAIL]
   Both flagged: ... | A only: ... | B only: ...
   Iterations: [N]/3  Result: [SHIPPED / ESCALATED TO USER]
   ```

---
description: Adversarially verified multi-dimension code review over a diff (local changes or GitHub PR). Parallel reviewers, evidence-keyed dedup, then an independent skeptic confirms or refutes every CRITICAL/HIGH; the verdict fails closed. For the step-by-step checklist use /code-review; for the multi-agent pass use /review-pr.
argument-hint: "[pr-number | pr-url | blank for local uncommitted changes]"
---

<!-- adapted from affaan-m/ECC@c70874f commands/orch-review.md + workflows/orch-review.workflow.js (MIT) for pi-subagents -->

# /orch-review

**Input**: $ARGUMENTS

## Steps

1. Collect the review target:
   - **Local mode** (no argument): run `git diff` and `git diff --staged`; also list
     untracked files with `git status --porcelain` and include them (e.g.
     `git diff --no-index /dev/null <file>` per file).
   - **PR mode** (number or URL): run `gh pr view <ref> --json files,title` and
     `gh pr diff <ref>`.
   - If the diff exceeds ~600,000 characters, split it into per-file or
     per-directory batches and process one batch at a time.
2. Read the `orch-review` skill and follow it. Launch the packaged workflow with
   an absolute path derived from that skill's directory:

   ```js
   subagent({
     workflow: "<orch-review skill directory>/references/orch-review.workflow.js",
     args: { diff: "<unified diff>", changedFiles: ["<changed file>"] },
     async: true
   })
   ```

   Set `language` only when you already know it; otherwise let the workflow
   auto-detect it from the changed files.
3. Report the result when the run completes:
   - `verdict`, `blocking`, `advisory`, `incomplete`, `failedDimensions`, `stats`
   - For each blocking finding: severity, file, and the evidence/proof line.
   - If `incomplete` is true or any dimension failed, say so explicitly and offer
     to re-run — never report an approval in that state.

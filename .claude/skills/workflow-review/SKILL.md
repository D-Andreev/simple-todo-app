---
name: workflow-review
description: >-
  AI review phase for GitHub-issue workflows. Fresh-eyes scenario verification
  and principles review on the work branch diff; interactive fix loop in
  session until the user proceeds to human review. Use when a routine fires on
  workflow:review or for issue $0.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Review

Independent **fresh-eyes** review of the PR branch, then an **interactive session** — present findings, apply fixes when the user asks, repeat until they **`proceed to human review`**.

Triggered by label **`workflow:review`**. Reads the issue handoff comment. See [handoff-format.md](../workflow-routines/handoff-format.md), [state-schema.md](../workflow-routines/state-schema.md), [label-rules.md](../workflow-routines/label-rules.md).

Adapted from ai-workflow **workflow-review** — same verification and principles pass; delivery is **session-first** with optional fix iterations on `work_branch`.

## Preconditions

1. Issue has label **`workflow:review`**.
2. Handoff comment exists with `requirements_approved: true`, `implement-handoff.md`, and `work_branch` in `state.json`.
3. If handoff already has final `review-report.md` and `workflow_label` is `workflow:human-review` — stop; human review phase.

If preconditions fail, post a short issue comment and stop.

## Fresh-eyes rule

**Ignore prior implementation chat** (if any leaked into context). Base judgments only on:

- Handoff `requirements.md`, `implement-handoff.md`, `language.md`
- `workflow/PROJECT.md`, `workflow/learnings/gotchas.md`
- `git diff {base_branch}...HEAD` on **`work_branch`**
- Code and tests on that branch

State in the review-report header: **"Fresh-eyes: artifacts and diff only."**

## Start sequence

1. **Read issue** and **handoff** (all sections).
2. **Checkout `work_branch`** from handoff state (`workflow/issue-{n}`). Pull latest if remote exists.
3. **Post session comment** — link to this session; note branch and PR if known.
4. Run **initial review pass** (below) — present findings **in this session** (summary + top issues; not the full report dump unless helpful).
5. Tell the user they can:
   - Ask you to **fix** specific items (or "fix all critical")
   - Ask follow-up questions
   - Reply **`proceed to human review`** when ready for human PR review (no more AI fixes this round)

**Do not PATCH handoff or change labels until `proceed to human review`.**

## Initial review pass

### 1. Scenario verification

1. Read artifacts and diff — built vs required.
2. Derive **scenario tests** from requirements and implement-handoff "Suggested review scenarios":
   - Happy path
   - Edge cases from requirements
   - Error / failure paths
   - Regression risks (PROJECT.md domain)
3. Execute:
   - Unit tests (PROJECT.md commands)
   - Targeted tests for changed areas
   - Integration/e2e if contracts or cross-module flows touched
   - Manual trace if tests insufficient
4. Record results for the report (in session memory).

### 2. Principles review (same pass)

After scenarios, review:

1. Open 🔴/🟡 from scenario testing (severity + fix approach — do not fix yet unless user asked)
2. Areas scenarios cannot judge (design, security boundaries, maintainability)
3. Checklist: **Security**, **Design / maintainability**, **Conventions**

Apply stack-idiomatic practices from PROJECT.md and manifests.

**Do not** re-run passed scenarios. Reference them under "Scenario overlap avoided" in the report.

### 3. Verdict (for session + report)

`APPROVE` | `APPROVE WITH NOTES` | `REQUEST CHANGES`

Present verdict and counts in session. If REQUEST CHANGES, list must-fix items clearly.

## Interactive fix loop

When the user asks to fix items (in this session):

1. Confirm scope — which findings or "all critical".
2. Checkout `work_branch`; implement **minimal** fixes on branch only.
3. Run relevant tests; fix failures.
4. Commit and push; PR updates automatically.
5. Re-read diff; briefly note what changed in session.
6. **Do not** swap labels or PATCH handoff yet.
7. Offer: more fixes, re-review, or **`proceed to human review`**.

Stay in the loop until the user sends **`proceed to human review`**.

Aliases: `approve review`, `human review` — treat as the same advance command.

## On `proceed to human review`

1. Finalize in-session **`review-report.md`** (template below). Include any fixes applied during the session.
2. Update in-session handoff `state.json`:
   - `phase`: `review`
   - `status`: `awaiting_human`
   - `workflow_label`: `workflow:human-review`
   - Append history: `phase_completed`, `labels_updated`
   - Set `updated_at`
3. **PATCH handoff comment** — full snapshot including `review-report.md` and updated `state.json`.
4. Post **short issue comment** — AI review complete; human should review PR when ready; link to draft PR if known. Verdict one line. Note PR is still draft until author marks ready.
5. **Swap labels last** — remove `workflow:review`, add **`workflow:human-review`**. **Nothing else on GitHub after this.**
6. **Stop** — no further AI phases. Human reviews PR on GitHub after author marks ready.

## review-report.md template

```markdown
# Review Report

**Fresh-eyes:** judgments based on artifacts and diff only (`{base_branch}...HEAD` on `{work_branch}`).

## Verdict
APPROVE | APPROVE WITH NOTES | REQUEST CHANGES

## Scenario verification

### Scenarios tested

| # | Scenario | Method | Result | Notes |
|---|----------|--------|--------|-------|
| 1 | ... | test/manual | pass/fail | ... |

### Requirements coverage
- [ ] Each acceptance criterion verified or gap-noted

### Issues found (from testing)
- 🔴 Critical: ...
- 🟡 Minor: ...

### Gaps in test coverage
- ...

## Principles review

### Summary
{2-3 sentences}

### Critical (must fix)
- {file:line — or "fixed in session" if addressed}

### Suggestions (should consider)
- ...

### Nice to have
- ...

### Scenario overlap avoided
- ...

### Principles applied
- ...

## Fixes applied during AI review session
- {commit or summary — or "none"}

## Recommendation
Human PR review — {one line: verdict and remaining risk}
```

## Writable locations

| Location | When |
|----------|------|
| `work_branch` | Fixes during interactive loop |
| Issue handoff (PATCH) | Only on `proceed to human review` |
| GitHub | Session comment at start; complete comment at end; labels |

## Hard rules

- Fresh-eyes only for the initial pass — do not cite implementation-chat reasoning in the report.
- **Fixes only when the user asks** during the review session (not silently during initial pass).
- Do not expand scope beyond requirements + review findings.
- Prefer focused fix diffs; no drive-by refactors.
- Reference specific files and lines in findings.
- **Never PATCH handoff before `proceed to human review`.**
- **Never run human review for the user** — only set `workflow:human-review` and stop.
- **Label swap is always last** when advancing phases — see label-rules.md.
- Never leave two `workflow:*` labels on an issue.

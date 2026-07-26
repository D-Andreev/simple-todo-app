---
name: workflow-review
description: >-
  AI review phase for GitHub-issue workflows. Fresh-eyes scenario verification
  and principles review on the work branch; posts a short PR comment and submits
  an approve, approve-with-notes, or request-changes review. Use when a routine
  fires on workflow:review or for issue $0.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Review

Independent **fresh-eyes** review of the PR branch. Run once, autonomously — **no interactive fix loop**, **no waiting for human approval** in the session.

Triggered by label **`workflow:review`**. Reads the handoff gist. See [handoff-format.md](../workflow-routines/handoff-format.md), [state-schema.md](../workflow-routines/state-schema.md), [label-rules.md](../workflow-routines/label-rules.md).

## Preconditions

1. Issue has label **`workflow:review`**.
2. Handoff gist exists with `requirements_approved: true`, `implement-handoff.md`, and `work_branch` in `state.json`.
3. If gist has final `review-report.md` and `workflow_label` is `workflow:human-review` — stop; human review phase.

If preconditions fail, post a short issue comment and stop.

## Fresh-eyes rule

**Ignore prior implementation chat** (if any leaked into context). Base judgments only on:

- Gist `requirements.md`, `implement-handoff.md`, `language.md`
- `workflow/PROJECT.md`, `workflow/learnings/gotchas.md`
- `git diff {base_branch}...HEAD` on **`work_branch`**
- Code and tests on that branch

State in the review-report header: **"Fresh-eyes: artifacts and diff only."**

## Sequence (autonomous — complete in one run)

1. **Read issue** and **handoff gist** (all needed files).
2. **Checkout `work_branch`** from gist state. Pull latest if remote exists.
3. **Post session comment** (short) — e.g. `**Review** — [session]({url}) · PR #{pr}`.
4. **EDIT gist (start)** — update `state.json`: `phase: review`, `status: ai_running`, `last_session_url`, append history `started`.
5. **Find PR** — `gh pr list --head workflow/issue-{n} --json number,url` (or from implement-handoff / issue links).
6. **Review pass** — scenario verification + principles review (below).
7. **Verdict** — `APPROVE` | `APPROVE WITH NOTES` | `REQUEST CHANGES`.
8. **Write `review-report.md`** (full detail — template below). No code fixes on branch during review.
9. **Post short PR comment** and **submit PR review** (below).
10. **Update gist `state.json`**:
   - `phase`: `review`
   - `status`: `done`
   - `workflow_label`: `workflow:human-review`
   - `review_verdict`: `approve` | `approve_with_notes` | `request_changes`
   - `last_session_url`: this session URL
   - Append history: `phase_completed`, `labels_updated`, `pr_review_submitted`
   - Set `updated_at`
11. **EDIT gist (complete)** — upload `review-report.md` + updated `state.json`. Never create a new gist.
12. Post **short issue comment** — one line: verdict + link to PR review.
13. **Swap labels last** — remove `workflow:review`, add **`workflow:human-review`**. **Nothing else on GitHub after this.**
14. **Stop.**

## Review pass

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
4. Record results for the report.

### 2. Principles review (same pass)

After scenarios, review:

1. Open 🔴/🟡 from scenario testing (severity + fix approach)
2. Areas scenarios cannot judge (design, security boundaries, maintainability)
3. Checklist: **Security**, **Design / maintainability**, **Conventions**

Apply stack-idiomatic practices from PROJECT.md and manifests.

**Do not** re-run passed scenarios. Reference them under "Scenario overlap avoided" in the report.

### 3. Verdict

| Verdict | When |
|---------|------|
| **APPROVE** | Requirements met, tests pass, no meaningful issues |
| **APPROVE WITH NOTES** | Shippable; minor suggestions or non-blocking gaps |
| **REQUEST CHANGES** | Must-fix bugs, failed tests, missing AC, security/design blockers |

## PR comment and review (short)

Post **one** short comment on the PR, then submit the matching GitHub review. Full detail in gist `review-report.md`.

**Template (adapt, stay short):**

```markdown
**AI review: {APPROVE | APPROVE WITH NOTES | REQUEST CHANGES}**

{One sentence: what was checked and overall outcome.}

{If REQUEST CHANGES: bullet list of must-fix items, max 3.}
{If APPROVE WITH NOTES: bullet list of non-blocking notes, max 3.}
{If APPROVE: optional single line of praise or risk note.}

Full report: issue #{n} handoff gist.
```

**Submit review:**

```bash
# APPROVE
gh pr review {pr_number} --approve --body "$(cat <<'EOF'
{short comment body}
EOF
)"

# APPROVE WITH NOTES
gh pr review {pr_number} --approve --body "$(cat <<'EOF'
{short comment body}
EOF
)"

# REQUEST CHANGES
gh pr review {pr_number} --request-changes --body "$(cat <<'EOF'
{short comment body}
EOF
)"
```

If PR is **draft** and `gh pr review` fails, post the short text with `gh pr comment {pr_number} --body "..."` and note in the issue comment that formal review was blocked (draft); still EDIT gist with verdict.

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
- {file:line}

### Suggestions (should consider)
- ...

### Nice to have
- ...

### Scenario overlap avoided
- ...

### Principles applied
- ...

## Recommendation
{One line: merge readiness and remaining risk}
```

## Writable locations

| Location | When |
|----------|------|
| Handoff gist (EDIT) | `state.json` at start + complete; `review-report.md` at complete |
| GitHub PR | Short comment + `gh pr review` |
| GitHub issue | Short session/complete comments only |

**Do not** commit fixes to `work_branch` during review — report only. Author addresses REQUEST CHANGES in a follow-up.

## Hard rules

- Fresh-eyes only — do not cite implementation-chat reasoning in the report.
- **Autonomous** — complete review, PR comment, and PR review submission in one run; no waiting for human input.
- **Do not fix code** during review — verdict and findings only.
- Do not expand scope beyond requirements + review findings.
- Reference specific files and lines in findings.
- **PR comment must be short** — details in gist `review-report.md`.
- **EDIT gist at start and complete** — always update `state.json`. Never create a new handoff gist.
- **Handoff via `gh gist` / `gh api` only** — if gist edit fails, post short issue comment and **stop**; do not advance labels.
- **Never put artifacts in issue comments.**
- **Label swap is always last** — see label-rules.md.
- Never leave two `workflow:*` labels on an issue.

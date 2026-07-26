---
name: workflow-review
description: >-
  AI review phase for GitHub-issue workflows. Fresh-eyes scenario verification
  and principles review on the work branch; posts one PR comment with verdict. Use when a routine
  fires on workflow:review or for issue $0.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Review

Independent **fresh-eyes** review of the PR branch. Run once, autonomously — **no interactive fix loop**, **no waiting for human approval** in the session.

Triggered by label **`workflow:review`**. Reads handoff from **`workflow/issue-{n}`** / `workflow/issues/{n}/`. See [handoff-format.md](../workflow-routines/handoff-format.md), [state-schema.md](../workflow-routines/state-schema.md), [label-rules.md](../workflow-routines/label-rules.md).

## Preconditions

1. Issue has label **`workflow:review`**.
2. Branch exists with `requirements_approved: true`, `implement-handoff.md`, and `work_branch` in `state.json`.
3. If `review-report.md` exists and `workflow_label` is `workflow:human-review` — stop; human review phase.

If preconditions fail, post a short issue comment and stop.

## Fresh-eyes rule

**Ignore prior implementation chat** (if any leaked into context). Base judgments only on:

- `workflow/issues/{n}/requirements.md`, `implement-handoff.md`, `language.md`
- `workflow/PROJECT.md`, `workflow/learnings/gotchas.md`
- `git diff {base_branch}...HEAD` on **`work_branch`**
- Code and tests on that branch

State in the review-report header: **"Fresh-eyes: artifacts and diff only."**

## Sequence (autonomous — complete in one run)

1. **Read issue**; checkout **`workflow/issue-{n}`**; pull latest.
2. Read `workflow/issues/{n}/` handoff files.
3. **Post session comment** — vary phrasing (handoff-format review start bank). Link session + PR.
4. **Commit handoff (start)** — update `state.json`: `phase: review`, `status: ai_running`, history `started`; push.
5. **Find PR** — `gh pr list --head workflow/issue-{n} --json number,url`.
6. **Review pass** — scenario verification + principles review (below).
7. **Verdict** — `APPROVE` | `APPROVE WITH NOTES` | `REQUEST CHANGES`.
8. **Write `review-report.md`** to `workflow/issues/{n}/`. No code fixes during review.
9. **Post one PR comment** with verdict — `gh pr comment` only. See below. **Never** `gh pr review`.
10. **Update `state.json`** — `review_verdict`, `status: done`, history; commit + push with `review-report.md`.
11. Post **short issue comment** — varied verdict line + PR comment link (handoff-format review complete bank).
12. **Swap labels last** — **`workflow:human-review`**. **Stop.**

## Review pass

### When to run tests or build

**Only if the PR diff includes application code changes** — source files, tests, or build/config manifests (e.g. `package.json`, `go.mod`, `Makefile`, CI config).

**Do not run** tests or build when the diff is limited to:

- `workflow/issues/{n}/` handoff files
- `workflow/PROJECT.md` / `docs/adr/` only (language merge, ADRs)
- Markdown or workflow metadata with no executable impact

Before running anything, inspect:

```bash
git diff {base_branch}...HEAD --stat
git diff {base_branch}...HEAD -- ':!workflow/issues/'
```

If implement-handoff already records test results and **no code changed since implement**, cite those results in the report — do not re-run.

If code **did** change (or this is the first review with code in the diff), run tests per PROJECT.md and build if the project normally builds in CI.

### 1. Scenario verification

1. Read artifacts and diff — built vs required.
2. Derive **scenario tests** from requirements and implement-handoff "Suggested review scenarios":
   - Happy path
   - Edge cases from requirements
   - Error / failure paths
   - Regression risks (PROJECT.md domain)
3. **Execute** (only when code changed — see above):
   - Unit tests (PROJECT.md commands)
   - Targeted tests for changed areas
   - Integration/e2e if contracts or cross-module flows touched
   - Build/lint if PROJECT.md or CI expects it
4. When **no code changes** — verify scenarios by **reading code and diff** (manual trace); note in report: `Tests/build skipped — no application code in diff.`
5. Record results for the report.

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
| **APPROVE** | Requirements met, no meaningful issues (tests pass if code changed and were run) |
| **APPROVE WITH NOTES** | Shippable; minor suggestions or non-blocking gaps |
| **REQUEST CHANGES** | Must-fix bugs, failed tests (when run), missing AC, security/design blockers |

## PR comment (one comment only)

Post **exactly one** comment on the PR. **Vary the wording** — use the review example bank or write fresh copy; include verdict in the opening line. **`gh pr comment` only.**

Full detail stays in `workflow/issues/{n}/review-report.md` on the branch.

**Template (adapt, stay concise — one comment, no follow-ups):**

```markdown
**AI review: {APPROVE | APPROVE WITH NOTES | REQUEST CHANGES}**

{One short paragraph: what was checked and overall outcome.}

{If REQUEST CHANGES: bullet list of must-fix items, max 3.}
{If APPROVE WITH NOTES: bullet list of non-blocking notes, max 3.}

Full report: `workflow/issues/{n}/review-report.md` on branch.
```

**Post:**

```bash
gh pr comment {pr_number} --body "$(cat <<'EOF'
{comment body — include verdict in the opening line}
EOF
)"
```

Record `pr_comment_posted` in handoff history. **Do not** post a second comment explaining review API failures.

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

### Test/build execution
- **Run:** yes / no — {reason, e.g. no application code in diff | code changed per diff stat}
- If skipped: relied on implement-handoff test results / manual trace only

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
| Branch `workflow/issues/{n}/` | `state.json` start + complete; `review-report.md` at complete |
| GitHub PR | **One** comment via `gh pr comment` — never `gh pr review` |
| GitHub issue | Short session/complete comments only |

**Do not** commit fixes to `work_branch` during review — report only. Author addresses REQUEST CHANGES in a follow-up.

## Hard rules

- Fresh-eyes only — do not cite implementation-chat reasoning in the report.
- **Autonomous** — complete review and **one** PR comment in a single run.
- **One PR comment only** — `gh pr comment`. **Never** `gh pr review`. **Vary wording** — do not reuse the same review comment across PRs.
- **Do not fix code** during review — verdict and findings only.
- Do not expand scope beyond requirements + review findings.
- Reference specific files and lines in findings.
- **PR comment must be short** — details on branch in `review-report.md`.
- **Commit handoff at start and complete** on branch.
- If push fails, post short issue comment and **stop**; do not advance labels.
- **Never put artifacts in issue comments.**
- **Label swap is always last** — see label-rules.md.
- **Do not run tests or build** unless the diff includes application code changes — see **When to run tests or build**.

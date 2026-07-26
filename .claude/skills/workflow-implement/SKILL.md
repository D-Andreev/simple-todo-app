---
name: workflow-implement
description: >-
  Implementation phase for GitHub-issue workflows. Reads clarify handoff from
  a secret gist, merges language into PROJECT.md, creates a work branch,
  implements with TDD red-green cycles, updates the gist, and sets
  workflow:review. Use when a routine fires on workflow:implement or for issue $0.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Implement

Build per approved handoff `requirements.md`. **Bugfix mode** (`state.mode: bugfix`) follows the bugfix process below instead of feature TDD slices.

Triggered by GitHub label **`workflow:implement`**. Reads the handoff gist. See [handoff-format.md](../workflow-routines/handoff-format.md), [state-schema.md](../workflow-routines/state-schema.md), [label-rules.md](../workflow-routines/label-rules.md).

## Preconditions

1. Issue has label **`workflow:implement`** (and only one workflow label).
2. Handoff gist exists (`handoff_gist_id` in state or pointer marker on issue).
3. Gist `state.json` has `requirements_approved: true`.
4. Gist `requirements.md` exists and approval is checked.
5. If gist already has `implement-handoff.md` and `state.phase` past implement — stop; review routine should run instead.

If preconditions fail, post a short issue comment explaining what is missing. Do not create a branch.

## Start sequence

1. **Read the issue** — number, title, URL, labels (`gh issue view` or webhook).
2. **Read handoff gist** — resolve gist id; `gh gist view {id} -f …` per handoff-format Read protocol.
3. **Verify init** — `workflow/PROJECT.md` must exist.
4. **Record** `issue_number`, `handoff_gist_id`, `base_branch` and `mode` from gist `state.json`.
5. **Post session comment** (short) — e.g. `**Implement** — [session]({url}) · branch \`workflow/issue-{n}\``.
6. **EDIT gist (start)** — update `state.json`: `phase: implement`, `status: ai_running`, `last_session_url`, append history `started`.
7. **Prepare repo on work branch** (steps below).
8. Run **feature** or **bugfix** process.
9. **Complete sequence** (end).

## Prepare repo (before coding)

1. Fetch and checkout `base_branch` from handoff state.
2. Create and checkout work branch `workflow/issue-{issue_number}`. Do not commit to `main` directly.
3. **Merge gist `language.md`** into `workflow/PROJECT.md` `## Language`.
4. **Commit ADRs** from gist `adrs.md` if present → `docs/adr/`.
5. Commit: `workflow(issue-{n}): merge clarify handoff into PROJECT.md and ADRs` (if changed). Push.

## Feature process (`mode: feature`)

1. Read gist `requirements.md`, `workflow/PROJECT.md`, skim `workflow/learnings/gotchas.md`.
2. Plan — match existing patterns. If no test infrastructure, skip TDD cycle; note in handoff.
3. **TDD red-green** per acceptance criterion or behavior slice.
4. Run full test suite per PROJECT.md.
5. Push work branch to origin.

## Bugfix process (`mode: bugfix`)

1. Read gist `requirements.md`, PROJECT.md, gotchas.
2. **Reproduce** — failing test or clear repro. If not reproducible, stop and comment on issue.
3. **Root cause** — fix cause, not symptom.
4. **TDD red-green** for regression.
5. Run tests; push branch.

## implement-handoff.md

Build in memory, then upload to gist at complete.

### Feature template

```markdown
# Implement Handoff

## Summary
{1-2 sentences}

## Branch
workflow/issue-{n}

## PR
Draft — remains draft until the author marks ready after local testing.

## Changes
| File | What changed |
|------|--------------|
| ... | ... |

## TDD red-green cycles
| Behavior / criterion | Test(s) | Red (fail reason) | Green |
|----------------------|---------|-------------------|-------|
| ... | {path} | confirmed fail | pass |

## Test results
- {command}: PASS/FAIL

## Acceptance criteria status
- [x] or [ ] each from requirements.md

## Suggested review scenarios
1. ...
```

Use `git diff {base_branch}...HEAD` when filling Changes.

## Complete sequence (end of implement)

1. Write `implement-handoff.md` (in memory).
2. Update gist `state.json` — `phase: implement`, `status: done`, `workflow_label: workflow:review`, `work_branch`, history, `updated_at`.
3. **EDIT handoff gist** — upload `state.json` + `implement-handoff.md`. Never create a new gist.
4. **Open draft PR**:

   ```bash
   gh pr create --draft --head workflow/issue-{n} --base {base_branch} \
     --title "{issue title}" --body "Closes #{n}

   ## Summary
   {from implement-handoff}

   **Draft** — author will mark ready after local testing."
   ```

5. Post **short issue comment** — e.g. `**Implement complete** — draft PR #{pr}`.
6. **Swap labels last** — **`workflow:review`**. **Stop.**

## Writable locations

| Location | Files |
|----------|-------|
| Repo (work branch) | application code, tests, `workflow/PROJECT.md`, `docs/adr/` |
| Handoff gist (EDIT) | `state.json` at start + complete; `implement-handoff.md` at complete |
| GitHub issue | short session/complete comments only |

## Hard rules

- Do not expand scope beyond gist `requirements.md`.
- When test infrastructure exists, use TDD red-green.
- **EDIT gist at start and complete** — never create a new handoff gist.
- **Never put artifacts in issue comments.**
- **Handoff via `gh gist` / `gh api` only** — if gist edit fails, post short issue comment and **stop**; do not advance labels.
- **Label swap is always last** — see label-rules.md.
- **Always create PR as draft**.
- **Never run review** in this session.

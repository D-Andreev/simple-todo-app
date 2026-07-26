---
name: workflow-implement
description: >-
  Implementation phase for GitHub-issue workflows. Reads clarify handoff from
  the issue comment, merges language into PROJECT.md, creates a work branch,
  implements with TDD red-green cycles per requirements, PATCHes handoff, and
  sets workflow:review. Use when a routine fires on workflow:implement or for
  issue $0.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Implement

Build per approved handoff `requirements.md`. **Bugfix mode** (`state.mode: bugfix`) follows the bugfix process below instead of feature TDD slices.

Triggered by GitHub label **`workflow:implement`**. Reads the handoff comment clarify posted. See [handoff-format.md](../workflow-routines/handoff-format.md), [state-schema.md](../workflow-routines/state-schema.md), [label-rules.md](../workflow-routines/label-rules.md).

## Preconditions

1. Issue has label **`workflow:implement`** (and only one workflow label).
2. Handoff comment exists with marker `<!-- ai-workflow:handoff v1 issue={n} -->`.
3. Handoff `state.json` has `requirements_approved: true`.
4. Handoff `requirements.md` exists and approval is checked.
5. If handoff already has `implement-handoff.md` and `state.phase` past implement — stop; review routine should run instead.

If preconditions fail, post a short issue comment explaining what is missing. Do not create a branch.

## Start sequence

1. **Read the issue** — number, title, URL, labels (`gh issue view` or webhook).
2. **Read handoff** — parse all sections per handoff-format Read protocol.
3. **Verify init** — `workflow/PROJECT.md` must exist.
4. **Record** `issue_number`, `handoff_comment_id`, `base_branch` and `mode` from handoff `state.json`.
5. **Post session comment** — separate issue comment with a link to this Claude Code session URL and planned branch `workflow/issue-{n}`. Do not PATCH the handoff yet.
6. **Prepare repo on work branch** (steps below).
7. Run **feature** or **bugfix** process.
8. **Complete sequence** (end).

## Prepare repo (before coding)

1. Fetch and checkout `base_branch` from handoff state.
2. Create and checkout work branch:

   ```
   workflow/issue-{issue_number}
   ```

   Example: `workflow/issue-42`. Do not commit to `main` directly.

3. **Merge `language.md`** into `workflow/PROJECT.md`:
   - Replace or update the `## Language` section with handoff `language.md` content.
   - Preserve all other PROJECT.md sections unless facts were wrong (only fix if requirements explicitly correct them).
4. **Commit ADRs** from handoff `adrs.md` if present:
   - Parse `## NNNN-slug` headings; write `docs/adr/NNNN-slug.md` (create `docs/adr/` lazily).
   - One file per ADR draft.
5. Commit: `workflow(issue-{n}): merge clarify handoff into PROJECT.md and ADRs` (if those files changed).

## Feature process (`mode: feature`)

1. Read handoff `requirements.md`, `workflow/PROJECT.md`, skim `workflow/learnings/gotchas.md`.
2. Plan — match existing patterns (PROJECT.md layout, nearby code). If no test infrastructure, skip TDD cycle; note in handoff.
3. **TDD red-green** per acceptance criterion or behavior slice:
   - **Red** — failing test; confirm fail for the **right reason**.
   - **Green** — minimal code to pass.
   - **Refactor** (optional) — keep tests green.
4. Run full test suite per PROJECT.md (unit required; lint if many files touched).
5. Fix failures before completing.
6. Push work branch to origin.

## Bugfix process (`mode: bugfix`)

1. Read handoff `requirements.md`, `workflow/PROJECT.md`, `workflow/learnings/gotchas.md`.
2. **Reproduce** — failing test or clear repro. If not reproducible, stop and comment on issue.
3. **Root cause** — fix cause, not symptom.
4. **TDD red-green** for regression: red (proves bug) → green (minimal fix).
5. Run tests per PROJECT.md; push work branch.

## implement-handoff.md

Build in memory, then include in handoff PATCH at complete.

### Feature template

```markdown
# Implement Handoff

## Summary
{1-2 sentences}

## Branch
workflow/issue-{n}

## PR
Draft — remains draft until the author marks ready after local testing (see comprehension / human review).

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
- Lint/format: PASS/SKIP/FAIL

## Acceptance criteria status
- [x] or [ ] each from requirements.md

## Open questions / risks
- ...

## Suggested review scenarios
1. ...
```

### Bugfix template

Same structure; add **Reproduction** and **Root cause** sections (see ai-workflow `workflow-bugfix`).

Use `git diff {base_branch}...HEAD` when filling Changes.

## Complete sequence (end of implement)

1. Write `implement-handoff.md` (in memory).
2. Update handoff `state.json`:
   - `phase`: `implement`
   - `status`: `awaiting_human`
   - `workflow_label`: `workflow:review`
   - `work_branch`: `workflow/issue-{n}`
   - `last_session_url`: this session URL
   - Append history: `phase_started` (if not recorded), `phase_completed`, `labels_updated`
   - Set `updated_at`
3. **PATCH handoff comment** — full snapshot: all clarify sections plus `implement-handoff.md` and updated `state.json`.
4. **Open draft PR** (recommended):

   ```bash
   gh pr create --draft --head workflow/issue-{n} --base {base_branch} \
     --title "{issue title}" --body "Closes #{n}

   ## Summary
   {from implement-handoff}

   **Draft** — author will mark ready after local testing. Handoff on issue comment."
   ```

   PR stays **draft** so teammates are not notified to review until the author has tested locally and optionally run comprehension.

5. Post **short issue comment** — implement complete, draft PR link. Do not duplicate full handoff.
6. **Swap labels last** — remove `workflow:implement`, add **`workflow:review`** (triggers review routine). **Nothing else on GitHub after this.**
7. **Stop** — do not run review in this session.

## Writable locations

| Location | Files |
|----------|-------|
| Repo (work branch) | application code, tests, `workflow/PROJECT.md`, `docs/adr/` |
| Issue handoff (PATCH) | updated `state.json`, `implement-handoff.md` |
| GitHub | labels, session/complete comments, PR |

Preserve existing handoff sections when PATCHing — include full snapshot every time.

## Hard rules

- Do not expand scope beyond handoff `requirements.md`.
- When test infrastructure exists, use TDD red-green — no behavior before failing test.
- Follow PROJECT.md and existing code conventions.
- Prefer focused diffs; no drive-by refactors.
- Never skip handoff read or `requirements_approved` check.
- **Post session comment at start** — link to this session before repo/branch work.
- Never leave two `workflow:*` labels on an issue.
- **Label swap is always last** when advancing phases — see label-rules.md.
- **Always create PR as draft** (`gh pr create --draft`).
- **Never run review** — only set `workflow:review` and stop.

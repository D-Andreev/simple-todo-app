---
name: workflow-clarify
description: >-
  Clarification phase for GitHub-issue workflows. Grills requirements one
  question at a time, builds shared language in session memory, posts handoff
  to the issue only when clarify completes, and sets workflow:implement. Use when
  a routine fires on workflow:start or for issue $0.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Clarify

Grill the plan before implementation — like a relentless interview that also builds shared language. **No application code changes. No test runs. No repo writes. No branch creation. No GitHub handoff comment until clarify completes.**

During the session, artifacts live **in this conversation only**. On **`approve requirements`**, post **one handoff comment** on the issue, swap to `workflow:implement`, stop. The implement routine reads that comment.

See [handoff-format.md](../workflow-routines/handoff-format.md), [state-schema.md](../workflow-routines/state-schema.md), [label-rules.md](../workflow-routines/label-rules.md).

## Read-only repo inputs

| File | Use |
|------|-----|
| `workflow/PROJECT.md` | Existing facts + `## Language` — read only |
| `workflow/learnings/gotchas.md` | Skim |
| Application code | Read-only |

Do not edit or commit any repo file during clarify.

## In-session artifacts (memory only until approve)

Maintain these across turns **in the session** — do not post to GitHub until approve:

| Artifact | Purpose |
|----------|---------|
| `state.json` | Machine state |
| `task.md` | From issue title + body |
| `language.md` | Mutual understanding / glossary |
| `requirements.md` | Living spec |
| `adrs.md` | Optional ADR drafts |

## Trigger modes

### A — Routine start (issue labeled `workflow:start`)

Run **Start sequence**, then grilling loop.

### B — Session continuation (`workflow:clarify` active, same session)

Continue from in-session artifacts and conversation history. **Do not** expect a handoff comment — it does not exist until approve.

### C — Manual (`/workflow-clarify {issue_number}`)

Same as A/B.

## Start sequence (mode A only)

1. **Swap labels first** — from webhook / trigger context, remove `workflow:start`, add `workflow:clarify`. **Nothing else on GitHub before this.** (`workflow:clarify` triggers no routine; do this immediately so the `issues.labeled` webhook fires before the rest of start.)
2. **Read the issue** — number, title, body, labels, URL.
3. **Verify init** — if `workflow/PROJECT.md` is missing, stop; tell user to run `/workflow-init`.
4. **Initialize in-session artifacts**:
   - `task.md` from issue title + body
   - `language.md` — copy existing `## Language` from `PROJECT.md` if any; else placeholder
   - `state.json` per [fixtures/state-example-clarify-start.json](../workflow-routines/fixtures/state-example-clarify-start.json)
5. **Post session comment** (separate) — Claude Code session URL. Record `session_linked` in in-session state.
6. Ask the **first** grilling question. **Nothing else on GitHub after this.**

**Do not post the handoff comment yet.**

## Grilling loop

**One question at a time**, with a **recommended answer**. Stop and wait after each question.

Explore the codebase instead of asking when the answer is there.

Cover: scope, behavior, acceptance criteria, implementation shape, tests, constraints.

## Domain modeling (in-session `language.md`)

Sharpen shared language. Update in-session **`language.md`** immediately when terms resolve — same format as `PROJECT.md` `## Language`:

```markdown
## Language

**Order**:
A customer request for goods or services, tracked from placement through fulfillment.
_Avoid_: Purchase, transaction
```

Rules:

- Glossary only; one canonical term per concept; `_Avoid_` for alternatives
- Challenge new terms against read-only `PROJECT.md`
- Reference terms from in-session `language.md` in `requirements.md`

### ADR drafts (in-session only)

Append to in-session **`adrs.md`** when warranted. Implement commits to `docs/adr/` later.

## Resume / pass tracking

- If in-session `requirements.md` has clarifications and approval unchecked, summarize — do not re-ask answered questions.
- Increment `clarify_rounds` when a pass ends. No cap.
- **New session mid-clarify** (no handoff comment yet): use the session comment link to return to the original session, or restart clarify on the issue.

## On human answers

Each turn after an answer:

1. Merge into in-session `requirements.md`.
2. Update in-session `language.md` if terms resolved.
3. Uncheck requirements approval.
4. Update in-session `state.json`: `status` → `awaiting_human`, append history.
5. Ask next question, **or** summary + ask for `approve requirements`.

**Do not post or edit the handoff comment.**

## On `approve requirements` (end of clarify — post handoff once)

1. Verify in-session `requirements.md` is complete enough to implement.
2. Finalize in-session `state.json`:
   - `requirements_approved`: true
   - `workflow_label`: `workflow:implement`
   - `status`: `done` (clarify complete)
   - Append `human_approved`, `labels_updated` (intended next label)
3. Check approval box in `requirements.md`.
4. **POST handoff comment** — single comment with marker `<!-- ai-workflow:handoff v1 issue={n} -->` and all sections: `state.json`, `task.md`, `language.md`, `requirements.md`, `adrs.md` if any. See handoff-format.
5. **PATCH same comment immediately** — read comment `id` from POST response; set `handoff_comment_id` in `state.json`, append history `handoff_created`. Re-send full snapshot.
6. Post **short** approval comment (separate from handoff).
7. **Swap labels last** — remove `workflow:clarify`, add **`workflow:implement`** (triggers implement routine). **Nothing else on GitHub after this.**
8. **Stop.**

## requirements.md template

```markdown
# Requirements: issue-{number}

## Original ask
{from task.md}

## Clarifications

| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | ... | ... | ... |

## Acceptance criteria
- [ ] ...

## Out of scope
- ...

## Test expectations
- ...

## Implementation approach (high level)
- ... (terms from language.md)

## Files / areas likely involved
- ...

## Assumptions
- ...

## Approved by human
- [ ] Pending — reply `approve requirements` when ready
```

## GitHub writes (clarify)

| When | Action |
|------|--------|
| Start | **Label swap first** → session comment → first question |
| Each Q&A turn | **Nothing on GitHub** |
| Approve | POST handoff → PATCH `handoff_comment_id` → approval comment → **label swap last** |

## Hard rules

- Never write application source code.
- **Never write or commit any repo file.**
- **Never create a branch.**
- **Never post the handoff comment before `approve requirements`.**
- **POST handoff at approve, then PATCH** same comment with `handoff_comment_id` from API response.
- Never run tests, lint, migrations, or deploys.
- Never create `CONTEXT.md`.
- Never leave two `workflow:*` labels on an issue.
- **Label swap first** at start — `workflow:clarify` before any other GitHub write or Q1. **Label swap last** when advancing to implement — see label-rules.md.
- **Never start implement** — only set `workflow:implement` and stop.

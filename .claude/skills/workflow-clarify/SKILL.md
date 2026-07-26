---
name: workflow-clarify
description: >-
  Clarification phase for GitHub-issue workflows. Grills requirements one
  question at a time, builds shared language in session memory, creates a secret
  handoff gist on approve, posts short human comments on the issue, and sets
  workflow:implement. Use when a routine fires on workflow:start or for issue $0.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Clarify

Grill the plan before implementation — like a relentless interview that also builds shared language. **No application code changes. No test runs. No repo writes. No branch creation. No handoff gist until clarify completes.**

During the session, artifacts live **in this conversation only**. On **`approve requirements`**, create a **secret handoff gist**, post a **short comment** on the issue, swap to `workflow:implement`, stop. The implement routine reads the gist.

See [handoff-format.md](../workflow-routines/handoff-format.md), [state-schema.md](../workflow-routines/state-schema.md), [label-rules.md](../workflow-routines/label-rules.md).

## Read-only repo inputs

| File | Use |
|------|-----|
| `workflow/PROJECT.md` | Existing facts + `## Language` — read only |
| `workflow/learnings/gotchas.md` | Skim |
| Application code | Read-only |

Do not edit or commit any repo file during clarify.

## In-session artifacts (memory only until approve)

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

Continue from in-session artifacts. **Do not** expect a handoff gist — it does not exist until approve.

### C — Manual (`/workflow-clarify {issue_number}`)

Same as A/B.

## Start sequence (mode A only)

1. **Swap labels first** — remove `workflow:start`, add `workflow:clarify`. **Nothing else on GitHub before this.**
2. **Read the issue** — number, title, body, labels, URL.
3. **Verify init** — if `workflow/PROJECT.md` is missing, stop; tell user to run `/workflow-init`.
4. **Initialize in-session artifacts**:
   - `task.md` from issue title + body
   - `language.md` — copy existing `## Language` from `PROJECT.md` if any; else placeholder
   - `state.json` per [fixtures/state-example-clarify-start.json](../workflow-routines/fixtures/state-example-clarify-start.json)
5. **Post session comment** (short) — e.g. `**Clarify** — [session]({url})`.
6. Ask the **first** grilling question.

**Do not create the handoff gist yet.**

## Grilling loop

**One question at a time**, with a **recommended answer**. Stop and wait after each question.

Explore the codebase instead of asking when the answer is there.

## Domain modeling (in-session `language.md`)

Update in-session **`language.md`** when terms resolve — same format as `PROJECT.md` `## Language`. Implement merges into PROJECT.md later.

### ADR drafts (in-session only)

Append to in-session **`adrs.md`** when warranted.

## Resume / pass tracking

- Summarize prior clarifications — do not re-ask answered questions.
- **New session mid-clarify** (no gist yet): use the session comment link, or restart clarify.

## On human answers

1. Merge into in-session `requirements.md`.
2. Update in-session `language.md` if terms resolved.
3. Update in-session `state.json`: `status` → `awaiting_human`, append history.
4. Ask next question, **or** summary + ask for `approve requirements`.

**Do not create or edit the handoff gist. Do not post artifacts to the issue.**

## On `approve requirements` (end of clarify)

1. Verify in-session `requirements.md` is complete enough to implement.
2. Finalize in-session `state.json` — `requirements_approved: true`, `status: done`, history.
3. Check approval box in `requirements.md`.
4. **CREATE secret handoff gist** — temp files → `gh gist create … --secret`. See handoff-format.
5. **EDIT gist** — set `handoff_gist_id`, `handoff_gist_url`; append history `handoff_created`; re-upload `state.json`.
6. Post **short** comment — e.g. `**Clarify complete** — requirements approved.` Optional pointer marker with gist id.
7. **Swap labels last** — add **`workflow:implement`**. **Stop.**

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

| When | Gist | Issue comment |
|------|------|---------------|
| Start | — | Short session comment |
| Each Q&A turn | — | **None** |
| Approve | CREATE + EDIT | Short approval line → **label swap last** |

## Hard rules

- Never write application source code or commit repo files.
- **Never create the handoff gist before `approve requirements`.**
- **Never put JSON or artifacts in issue comments.**
- **Handoff via `gh gist` / `gh api` only** — if gist create/edit fails, post short issue comment and **stop**; do not swap to `workflow:implement`.
- **Label swap first** at start; **label swap last** at approve — see label-rules.md.
- **Never start implement** — only set `workflow:implement` and stop.

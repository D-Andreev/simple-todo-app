---
name: workflow-clarify
description: >-
  Clarification phase for GitHub-issue workflows. Grills requirements one
  question at a time, updates PROJECT.md glossary, persists handoff artifacts
  in an issue comment, manages workflow labels, and posts session links. Use
  when a routine fires on workflow:start, when workflow:clarify is active, or
  when gathering requirements for issue $0.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Clarify

Grill the plan before implementation — like a relentless interview that also builds shared language. **No application code changes. No test runs.**

Adapted for **Claude Code Routines + GitHub issues**. Per-issue state and artifacts persist in a **handoff issue comment** (not repo files). See [handoff-format.md](../workflow-routines/handoff-format.md), [state-schema.md](../workflow-routines/state-schema.md), [label-rules.md](../workflow-routines/label-rules.md).

`PROJECT.md` is the single durable context file in git: project facts from init **plus** domain glossary (`## Language`). Do not create `CONTEXT.md`.

## Trigger modes

### A — Routine start (issue labeled `workflow:start`)

Run the full **Start sequence** once, then enter the grilling loop.

### B — Session continuation (same issue, `workflow:clarify` active)

**Read handoff** from the issue comment (handoff-format Read protocol). Resume grilling — do not re-run Start unless handoff is missing.

### C — Manual (`/workflow-clarify {issue_number}`)

Same as A/B. Fetch issue via `gh issue view {n}` if needed.

## Start sequence (mode A only)

1. **Read the triggering issue** — number, title, body, labels, URL.
2. **Verify init** — if `.claude/workflows/PROJECT.md` is missing, stop; tell user to run `/workflow-init`.
3. **Build in-memory artifacts** (not repo files):
   - `task.md` from issue title + body
   - `state.json` per [fixtures/state-example-clarify-start.json](../workflow-routines/fixtures/state-example-clarify-start.json)
4. **Swap labels** — remove `workflow:start`, add `workflow:clarify`.
5. **Post handoff comment** — create comment with marker `<!-- ai-workflow:handoff v1 issue={n} -->` and sections `state.json`, `task.md` (requirements omitted until first answer). Set `handoff_comment_id` in state; append `handoff_updated` to history.
6. **Post session comment** (separate) — link to this Claude Code session. Append `session_linked`; set `last_session_url`. Update handoff if state changed.
7. Enter **grilling loop** — ask the **first** question.

## Handoff write (every turn that changes state or artifacts)

1. Update in-memory `state.json`, `task.md`, and/or `requirements.md`.
2. Rebuild full handoff comment body per handoff-format (all sections, full snapshot).
3. **PATCH** existing handoff comment if `handoff_comment_id` set or marker found; else **POST** new comment.
4. Append `handoff_updated` to history; set `updated_at`.

Do **not** commit per-issue files to the repo.

## Handoff read (resume or implement)

1. List issue comments; find `<!-- ai-workflow:handoff v1 issue={n} -->`
2. Parse `### state.json`, `### task.md`, `### requirements.md` sections
3. Cache `handoff_comment_id` from the API response when writing

## Inputs (every turn)

1. Handoff `task.md` (from issue comment)
2. Handoff `requirements.md` (from issue comment; create on first answer)
3. Handoff `state.json` (from issue comment)
4. `.claude/workflows/PROJECT.md` — read every turn; update `## Language` inline
5. `.claude/workflows/learnings/gotchas.md` (skim)
6. Relevant application code (read-only)

## Grilling loop

**One question at a time**, with a **recommended answer**. Stop and wait for the human after each question.

If a question can be answered by exploring the codebase, explore instead of asking.

Cover: scope, behavior, acceptance criteria, implementation shape, tests, constraints.

## Domain modeling

Same as ai-workflow clarify — challenge glossary, sharpen terms, scenarios, cross-reference code. Update `## Language` in `PROJECT.md` immediately when terms resolve; **commit PROJECT.md** to git (durable team context, not per-issue).

### Offer ADRs sparingly

Create `docs/adr/NNNN-slug.md` when warranted; commit to git.

## Resume / pass tracking

- If handoff `requirements.md` has clarifications and approval unchecked, summarize progress — do not re-ask answered questions.
- Increment `clarify_rounds` when a pass ends (summary + wait for approve). No cap.

## On human answers

Each turn after an answer:

1. Merge answer into handoff `requirements.md` (template below).
2. Update `## Language` in `PROJECT.md` if terms resolved; commit PROJECT.md if changed.
3. Uncheck requirements approval.
4. Update handoff `state.json`: `status` → `awaiting_human`, append history.
5. **Write handoff comment** (PATCH).
6. Ask next question, **or** present summary and ask for `approve requirements`.

## On `approve requirements`

1. Verify handoff `requirements.md` is complete enough to implement.
2. Update handoff `state.json`: `requirements_approved: true`, `workflow_label: workflow:implement`, append `human_approved`, `labels_updated`.
3. Check approval box in `requirements.md`; **write handoff comment** (final snapshot).
4. **Swap labels** — remove `workflow:clarify`, add `workflow:implement`.
5. Post **short** issue comment — requirements approved; implement routine will read the handoff comment; do not duplicate full `requirements.md`.
6. **Stop** — do not implement.

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
- ...

## Files / areas likely involved
- ...

## Assumptions
- ...

## Approved by human
- [ ] Pending — reply `approve requirements` when ready
```

## Writable locations

| Location | Files |
|----------|-------|
| Issue handoff comment | `state.json`, `task.md`, `requirements.md` |
| Repo (committed) | `.claude/workflows/PROJECT.md`, `docs/adr/*.md` |

## GitHub actions

- Create / edit handoff comment
- Post session comment and short approval comment
- Swap workflow labels

## Hard rules

- Never write application source code (PROJECT.md, ADRs allowed).
- Never run tests, lint, migrations, or deploys.
- **Never commit per-issue handoff files** — issue comment only.
- **Update handoff comment after every turn** that changes state or artifacts.
- Never create `CONTEXT.md`.
- Never leave two `workflow:*` labels on an issue.

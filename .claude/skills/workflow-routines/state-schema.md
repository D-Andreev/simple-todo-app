# State Schema (Branch Handoff + Human Issue Comments)

Ephemeral state and artifacts live on the long-lived branch **`workflow/state`** under `issues/{n}/`. Product code lives on **`workflow/issue-{n}`**. Issue comments are agent→human status only; clarify Q&A is **session-only**. See [handoff-format.md](handoff-format.md).

## Two-branch rule

| Phase | State branch (`workflow/state`) | Work branch (`workflow/issue-{n}`) |
|-------|----------------------------------|-------------------------------------|
| **Clarify start** | Ensure branch + init `issues/{n}/` | — (not created yet) |
| **Clarify Q&A** | COMMIT each answer | — |
| **Clarify approve** | COMMIT final handoff | — |
| **Implement start** | COMMIT `state.json` (`work_branch` set) | **CREATE** from `base_branch` |
| **Implement complete** | COMMIT `implement-handoff.md` + state | App code commits + draft PR |
| **Review start** | COMMIT `state.json` | Read-only (diff) |
| **Review complete** | COMMIT `review-report.md` + state | Read-only |

Never merge `workflow/state` into `main`. Implement creates the work branch once; review never creates a new work branch.

## Label routing

| Label | Phase | Trigger |
|-------|-------|---------|
| `workflow:start` | — | Clarify routine |
| `workflow:clarify` | clarify | in session |
| `workflow:implement` | — | Implement routine |
| `workflow:review` | — | AI Review routine |
| `workflow:human-review` | human review | **none** |
| _(no label)_ | comprehension | **none** — optional local `/workflow-comprehension` |

## Handoff files by writer

All paths below are on **`workflow/state`** under `issues/{n}/`.

| File | clarify | implement | review |
|------|---------|-----------|--------|
| `state.json` | start + Q&A + approve | commit start + complete | commit start + complete |
| `task.md`, `language.md`, `requirements.md`, `adrs.md` | start + Q&A + approve | read; merge language → PROJECT.md on **work** branch | read |
| `implement-handoff.md` | — | commit at complete | read |
| `review-report.md` | — | — | commit at complete |

## Key `state.json` fields

| Field | Set by |
|-------|--------|
| `state_branch` | clarify start — always `workflow/state` |
| `handoff_path` | clarify start — `issues/{n}` |
| `work_branch` | implement start — `workflow/issue-{n}` (null until then) |
| `base_branch` | clarify start |
| `workflow_label` | last phase to swap labels |
| `phase` | current or last-completed phase |
| `status` | `ai_running` / `awaiting_human` / `done` — during clarify, `awaiting_human` means waiting for a **session** reply, not an issue comment |
| `requirements_approved` | clarify approve |
| `review_verdict` | review complete |
| `last_session_url` | each phase start commit |
| `history[]` | append on start/complete/label swap |

### History events

| `event` | When |
|---------|------|
| `handoff_initialized` | First handoff commit on `workflow/state` at clarify start |
| `started` | Clarify start / phase start commit |
| `phase_completed` | Phase complete commit |
| `work_branch_created` | Implement start — work branch pushed |
| `labels_updated` | Intended next label |
| `human_approved` | clarify approve |
| `pr_comment_posted` | review complete — single PR comment with verdict |

## Issue comments (not state)

Short, **varied**, engaging issue comments (Claude Code voice) — see handoff-format example banks. Never repeat the same boilerplate.

## Implement policy

Handoff start on state → create work branch → code on work branch → draft PR → handoff complete on state → short comment → **`workflow:review` label last**.

## Review policy

Handoff start on state → review work-branch diff + code reading only (**no tests/build**) → **one** PR comment (`gh pr comment`, verdict in text) → handoff complete on state → short issue comment → **`workflow:human-review` label last**.

## Comprehension policy (optional, local)

No handoff commits. Dev checks out `work_branch` for code; reads handoff from `workflow/state` / `issues/{n}/`; runs **`/workflow-comprehension`**.

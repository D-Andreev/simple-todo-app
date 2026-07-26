# State Schema (Branch Handoff + Human Issue Comments)

Ephemeral state and artifacts live on **`workflow/issue-{n}`** under `workflow/issues/{n}/`. Issue comments are human-only. See [handoff-format.md](handoff-format.md).

## One branch rule

| Phase | Branch write | Updates `state.json` |
|-------|--------------|----------------------|
| **Clarify start** | CREATE branch + initial commit | Yes — `work_branch`, `handoff_path`, history |
| **Clarify Q&A** | COMMIT each answer | Yes — `status`, history as needed |
| **Clarify approve** | COMMIT final handoff | Yes — `requirements_approved`, clarify complete |
| **Implement** | COMMIT at phase start | Yes — `phase: implement`, `status: ai_running`, history |
| **Implement** | COMMIT at phase complete | Yes — `status: done`, history |
| **Review** | COMMIT at phase start | Yes — `phase: review`, `status: ai_running`, history |
| **Review** | COMMIT at phase complete | Yes — `status: done`, `review_verdict`, history |

All phases use the **same branch** clarify created. Implement and review **never create a new branch**.

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

| File | clarify | implement | review |
|------|---------|-----------|--------|
| `state.json` | start + Q&A + approve | commit start + complete | commit start + complete |
| `task.md`, `language.md`, `requirements.md`, `adrs.md` | start + Q&A + approve | read; merge language → PROJECT.md | read |
| `implement-handoff.md` | — | commit at complete | read |
| `review-report.md` | — | — | commit at complete |

## Key `state.json` fields

| Field | Set by |
|-------|--------|
| `work_branch` | clarify start — `workflow/issue-{n}` |
| `handoff_path` | clarify start — `workflow/issues/{n}` |
| `base_branch` | clarify start |
| `workflow_label` | last phase to swap labels |
| `phase` | current or last-completed phase |
| `status` | `ai_running` / `awaiting_human` / `done` |
| `requirements_approved` | clarify approve |
| `review_verdict` | review complete |
| `last_session_url` | each phase start commit |
| `history[]` | append on start/complete/label swap |

### History events

| `event` | When |
|---------|------|
| `handoff_initialized` | Branch + first commit at clarify start |
| `started` | Clarify start / phase start commit |
| `phase_completed` | Phase complete commit |
| `labels_updated` | Intended next label |
| `human_approved` | clarify approve |
| `pr_comment_posted` | review complete — single PR comment with verdict |

## Issue comments (not state)

Short, **varied**, engaging issue comments (Claude Code voice) — see handoff-format example banks. Never repeat the same boilerplate.

## Implement policy

Commit start → code on same branch → draft PR → commit complete → short comment → **`workflow:review` label last**.

## Review policy

Commit start → review → **one** PR comment (`gh pr comment`, verdict in text) → commit complete → short issue comment → **`workflow:human-review` label last**.

## Comprehension policy (optional, local)

No handoff commits. Dev checks out `work_branch`, reads `workflow/issues/{n}/`, runs **`/workflow-comprehension`**.

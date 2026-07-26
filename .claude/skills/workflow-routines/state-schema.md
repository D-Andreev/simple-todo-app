# State Schema (GitHub Issues + Routines)

State and artifacts live in **one handoff issue comment** per issue. See [handoff-format.md](handoff-format.md).

## One comment rule

| Phase | Handoff write | Updates `state.json` |
|-------|---------------|----------------------|
| **Clarify** | **POST** at `approve requirements` | Yes — clarify complete |
| **Clarify** | **PATCH** immediately after POST | Yes — set `handoff_comment_id` from API response |
| **Implement** | **PATCH** at phase start | Yes — `phase: implement`, `status: ai_running`, history |
| **Implement** | **PATCH** at phase complete | Yes — `phase: implement`, `status: done`, `work_branch`, history |
| **Review** | **PATCH** at phase start | Yes — `phase: review`, `status: ai_running`, history |
| **Review** | **PATCH** at phase complete | Yes — `phase: review`, `status: done`, `review_verdict`, history |

Implement and review **never POST a new handoff comment** — always **PATCH** the comment clarify created (`handoff_comment_id` in `state.json`, or find by marker).

## Label routing

| Label | Phase | Trigger |
|-------|-------|---------|
| `workflow:start` | — | Clarify routine |
| `workflow:clarify` | clarify | in session |
| `workflow:implement` | — | Implement routine |
| `workflow:review` | — | AI Review routine |
| `workflow:human-review` | human review | **none** — human reviews PR |
| _(no label)_ | comprehension | **none** — optional local `/workflow-comprehension` |

## Handoff sections by writer

| Section | clarify | implement | review |
|---------|---------|-----------|--------|
| `state.json` | POST + PATCH (comment id) | PATCH start + complete | PATCH start + complete |
| `task.md`, `language.md`, `requirements.md`, `adrs.md` | POST at approve | preserve in PATCH | preserve in PATCH |
| `implement-handoff.md` | — | PATCH at complete | preserve in PATCH |
| `review-report.md` | — | — | PATCH at complete |

Every PATCH sends a **full snapshot** — all sections, with `state.json` reflecting current phase state.

## Key `state.json` fields

| Field | Set by |
|-------|--------|
| `handoff_comment_id` | clarify (PATCH right after POST) |
| `base_branch` | clarify |
| `work_branch` | implement (complete) |
| `workflow_label` | last phase to swap labels |
| `phase` | current or last-completed phase |
| `status` | `ai_running` during phase; `done` at phase complete |
| `requirements_approved` | clarify (true at approve) |
| `review_verdict` | review complete — `approve` \| `approve_with_notes` \| `request_changes` |
| `last_session_url` | each phase start PATCH |
| `history[]` | append `{ phase, event, at, note? }` on start/complete/label swap |

### History events

| `event` | When |
|---------|------|
| `started` | Phase start PATCH |
| `phase_completed` | Phase complete PATCH |
| `labels_updated` | Intended or applied label (in complete PATCH) |
| `human_approved` | clarify approve |
| `pr_review_submitted` | review complete |

## Implement policy

PATCH start → branch → code → draft PR → PATCH complete → short comment → **`workflow:review` label last**.

## Review policy

PATCH start → checkout → review → PR comment + `gh pr review` → PATCH complete → short issue comment → **`workflow:human-review` label last**.

## Comprehension policy (optional, local)

No handoff PATCH. Dev checks out `work_branch`, tests/preview locally, runs **`/workflow-comprehension`**. Skip by merging and closing the issue.

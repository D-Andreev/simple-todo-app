# State Schema (Gist Handoff + Human Issue Comments)

State and artifacts live in a **secret handoff gist** per issue. Issue comments are human-only. See [handoff-format.md](handoff-format.md).

## One gist rule

| Phase | Gist write | Updates `state.json` |
|-------|------------|----------------------|
| **Clarify** | **CREATE** at `approve requirements` | Yes — clarify complete |
| **Clarify** | **EDIT** immediately after create | Yes — set `handoff_gist_id`, `handoff_gist_url` |
| **Implement** | **EDIT** at phase start | Yes — `phase: implement`, `status: ai_running`, history |
| **Implement** | **EDIT** at phase complete | Yes — `status: done`, `work_branch`, history |
| **Review** | **EDIT** at phase start | Yes — `phase: review`, `status: ai_running`, history |
| **Review** | **EDIT** at phase complete | Yes — `status: done`, `review_verdict`, history |

Implement and review **never create a new gist** — always **EDIT** the gist clarify created.

## Label routing

| Label | Phase | Trigger |
|-------|-------|---------|
| `workflow:start` | — | Clarify routine |
| `workflow:clarify` | clarify | in session |
| `workflow:implement` | — | Implement routine |
| `workflow:review` | — | AI Review routine |
| `workflow:human-review` | human review | **none** |
| _(no label)_ | comprehension | **none** — optional local `/workflow-comprehension` |

## Gist files by writer

| File | clarify | implement | review |
|------|---------|-----------|--------|
| `state.json` | CREATE + EDIT (gist ids) | EDIT start + complete | EDIT start + complete |
| `task.md`, `language.md`, `requirements.md`, `adrs.md` | CREATE at approve | preserve in EDIT | preserve in EDIT |
| `implement-handoff.md` | — | EDIT at complete | preserve in EDIT |
| `review-report.md` | — | — | EDIT at complete |

## Key `state.json` fields

| Field | Set by |
|-------|--------|
| `handoff_gist_id` | clarify (EDIT right after CREATE) |
| `handoff_gist_url` | clarify |
| `base_branch` | clarify |
| `work_branch` | implement (complete) |
| `workflow_label` | last phase to swap labels |
| `phase` | current or last-completed phase |
| `status` | `ai_running` / `awaiting_human` / `done` |
| `requirements_approved` | clarify (true at approve) |
| `review_verdict` | review complete |
| `last_session_url` | each phase start EDIT |
| `history[]` | append on start/complete/label swap |

### History events

| `event` | When |
|---------|------|
| `started` | Phase start gist EDIT |
| `phase_completed` | Phase complete gist EDIT |
| `labels_updated` | Intended next label |
| `human_approved` | clarify approve |
| `handoff_created` | Gist created + ids recorded |
| `pr_review_submitted` | review complete |

## Issue comments (not state)

Short human lines only — never JSON or artifact bodies.

## Implement policy

Gist EDIT start → create branch → code → draft PR → gist EDIT complete → short comment → **`workflow:review` label last**.

## Review policy

Gist EDIT start → checkout → review → short PR comment + `gh pr review` → gist EDIT complete → short issue comment → **`workflow:human-review` label last**.

## Comprehension policy (optional, local)

No gist EDIT. Dev checks out `work_branch`, reads gist for context, runs **`/workflow-comprehension`**.

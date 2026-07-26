# State Schema (GitHub Issues + Routines)

State and artifacts live in the **handoff issue comment**. See [handoff-format.md](handoff-format.md).

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
| `state.json`, `task.md`, `language.md`, `requirements.md`, `adrs.md` | POST at approve | | |
| `implement-handoff.md` | | PATCH at complete | |
| `review-report.md` | | | PATCH at `proceed to human review` |

## Session vs handoff (review)

| During AI review session | At `proceed to human review` |
|--------------------------|------------------------------|
| Findings, fix loop, in-memory report | PATCH handoff + `review-report.md` |
| Commits on `work_branch` | Label → `workflow:human-review` |

Review does **not** PATCH handoff during the fix loop — only when the user advances.

## Key state fields

| Field | Set by |
|-------|--------|
| `work_branch` | implement |
| `base_branch` | clarify |
| `workflow_label` | last phase to swap labels |

## Implement policy

Branch `workflow/issue-{n}` → code → **draft PR** → PATCH handoff → short comment → **`workflow:review` label last**.

## Review policy

Checkout `work_branch` → fresh-eyes pass → session findings → optional fixes → user **`proceed to human review`** → PATCH handoff → short comment → **`workflow:human-review` label last**.

## Comprehension policy (optional, local)

No label, no routine, no handoff PATCH. Dev checks out `work_branch`, tests/preview locally, runs **`/workflow-comprehension`** in Claude Code. Pass, fail+retake, or `skip-comprehension` — then merge PR and close issue. Skipping comprehension entirely (merge + close) is valid.

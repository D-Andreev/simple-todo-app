# State Schema (GitHub Issues + Routines)

Per-issue state lives inside the **handoff issue comment** as a `state.json` section — not as a repo file. See [handoff-format.md](handoff-format.md).

Example at clarify start: [fixtures/state-example-clarify-start.json](fixtures/state-example-clarify-start.json)

## Issue number as pipeline id

`id` is always `"issue-{number}"` (e.g. `"issue-42"`). The GitHub issue number is the canonical key for labels, comments, and handoff.

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | `"issue-{number}"` |
| `issue_number` | number | GitHub issue number |
| `issue_url` | string | Full issue URL |
| `mode` | string | `feature` or `bugfix` |
| `task` | string | Short task summary (usually issue title) |
| `phase` | string | Current phase (`clarify`, `implement`, …) |
| `status` | string | `ai_running`, `awaiting_human`, `done`, `cancelled` |
| `workflow_label` | string | Active routing label |
| `base_branch` | string | Git branch for diffs |
| `requirements_approved` | boolean | Must be true before implement routine |
| `clarify_rounds` | number | Clarify passes completed (default 0) |
| `created_at` | ISO string | First routine touch |
| `updated_at` | ISO string | Last state change |
| `history` | array | `{ phase, event, at, note? }` |
| `human_feedback` | array | `{ phase, text, at }` |
| `comprehension_attempt` | number | Reserved |
| `comprehension_passed` | boolean | Reserved |
| `comprehension_skipped` | boolean | Reserved |
| `artifacts` | object | Logical artifact names → section keys in handoff comment |
| `last_session_url` | string \| null | Last posted session link (informational) |
| `handoff_comment_id` | number \| null | GitHub comment id (optional cache; re-find by marker if missing) |

### `artifacts` keys

Values are **section filenames** in the handoff comment (not repo paths):

| Key | Handoff section |
|-----|-----------------|
| `task` | `task.md` |
| `requirements` | `requirements.md` |
| `implement_handoff` | `implement-handoff.md` |
| `review_report` | `review-report.md` |
| `comprehension_test` | `comprehension-test.md` |
| `retro` | `retro.md` |

Clarify writes `task`, `requirements`, and the embedded `state.json`. Later phases add their sections to the **same** handoff comment.

## GitHub labels

Single active workflow label per issue. Swap atomically — see [label-rules.md](label-rules.md).

## Base branch

1. Issue body line `base: branch-name` if present
2. Else `origin/main` if exists
3. Else `main`
4. Else current branch

## History events

`started`, `phase_started`, `phase_completed`, `human_approved`, `human_refine`, `human_reject`, `comprehension_skipped`, `cancelled`, `recovered`

Clarify-specific:

- `handoff_updated` — handoff comment created or edited
- `session_linked` — session comment posted
- `labels_updated` — workflow label swapped

## Handoff policy

After **every clarify turn** that changes state or artifacts:

1. Build full handoff comment body per [handoff-format.md](handoff-format.md)
2. Create or PATCH the handoff comment on the issue
3. Do **not** commit per-issue files to the repo

On **`approve requirements`**:

1. Final handoff update with `requirements_approved: true`, `workflow_label: workflow:implement`
2. Swap labels
3. Post a **short** human comment (summary only — full spec stays in handoff comment)

## Durable vs issue-persisted

| Repo (committed) | Issue handoff comment |
|------------------|----------------------|
| `PROJECT.md` | `state.json` |
| `learnings/gotchas.md` | `task.md` |
| `docs/adr/` | `requirements.md` (+ later phase sections) |

| Ephemeral |
|-----------|
| Session URL (separate session comment) |
| Label webhook payloads |

## Cleanup

Closing an issue does not delete comments. Optional future `/workflow-cleanup` may add a `workflow:cancelled` label. Handoff comment remains for audit.

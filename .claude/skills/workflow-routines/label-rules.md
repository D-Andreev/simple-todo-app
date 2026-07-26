# GitHub Label Rules

Workflow routing uses **exactly one** active workflow label per issue.

## Label swap

When changing phase, always:

1. Remove the previous workflow label (`workflow:start`, `workflow:clarify`, or `workflow:implement`).
2. Add the new label.
3. Append `labels_updated` to `state.history` (in the handoff comment).

```bash
gh issue edit 42 --remove-label "workflow:start" --add-label "workflow:clarify"
gh issue edit 42 --remove-label "workflow:clarify" --add-label "workflow:implement"
```

## Triggers

| Label present | Routine |
|---------------|---------|
| `workflow:start` | Clarify routine |
| `workflow:implement` | Implement routine (future) |

## Session comment (human-facing, separate from handoff)

Post when clarify starts — **not** the handoff comment:

```markdown
## Clarify session

Answer questions in the Claude Code session below. One question at a time.

**Session:** {session_url}

When requirements look complete, reply in the session with `approve requirements`.

---
_Handoff artifacts are in the workflow handoff comment on this issue (marker `ai-workflow:handoff`)._
```

On `approve requirements`, post a short comment only — full spec stays in the handoff comment.

## Bugfix mode

Issue has label `bug` or body contains `mode: bugfix` → `state.mode` is `bugfix`. Default `feature`.

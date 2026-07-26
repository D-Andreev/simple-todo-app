# GitHub Label Rules

Exactly **one** active workflow label per issue.

## Label swap

```bash
# Clarify start
gh issue edit 42 --remove-label "workflow:start" --add-label "workflow:clarify"

# Clarify end
gh issue edit 42 --remove-label "workflow:clarify" --add-label "workflow:implement"

# Implement end
gh issue edit 42 --remove-label "workflow:implement" --add-label "workflow:review"

# AI review end → human PR review
gh issue edit 42 --remove-label "workflow:review" --add-label "workflow:human-review"
```

Record `labels_updated` in handoff `state.json` when PATCHing.

## Triggers (routines)

| Label added | Routine |
|-------------|---------|
| `workflow:start` | Clarify |
| `workflow:implement` | Implement |
| `workflow:review` | AI Review |

`workflow:human-review` has **no routine** — humans review the PR on GitHub (approve, request changes, merge).

## Session comments

| Phase | Comment |
|-------|---------|
| Clarify start | Session URL; handoff posted only on approve |
| Implement start | Optional session URL + work branch |
| Implement complete | PR link; `workflow:review` set |
| Review start | Session URL + branch/PR |
| Review complete | Verdict one-liner; `workflow:human-review` set |

## Advance commands (in Claude Code session)

| Phase | User says | Effect |
|-------|-----------|--------|
| Clarify | `approve requirements` | POST handoff; `workflow:implement` |
| Review | `proceed to human review` / `approve review` | PATCH handoff; `workflow:human-review` |

## Bugfix mode

Handoff `state.mode: bugfix` — same review process on `work_branch`.

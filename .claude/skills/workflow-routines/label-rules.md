# GitHub Label Rules

Exactly **one** active workflow label per issue.

## Label swap order (race prevention)

When a phase **advances** to the next phase, the **label swap is always the last GitHub action** — after handoff POST/PATCH, PR creation, and short issue comments. This prevents the next routine from firing before artifacts are ready.

```bash
# Example: implement complete — order matters
# 1. PATCH handoff
# 2. gh pr create --draft ...
# 3. gh issue comment ... (short complete comment)
# 4. gh issue edit ... --remove-label ... --add-label ...  ← LAST
```

Record `labels_updated` in handoff `state.json` when PATCHing (intended next label); perform the physical swap immediately after all other writes in the same turn.

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

**Comprehension** has no label and no routine — optional local `/workflow-comprehension` after checkout and local testing; or skip by merging and closing the issue.

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
| Clarify | `approve requirements` | POST handoff → approval comment → **`workflow:implement` last** |
| Review | `proceed to human review` / `approve review` | PATCH handoff → complete comment → **`workflow:human-review` last** |

## Bugfix mode

Handoff `state.mode: bugfix` — same review process on `work_branch`.

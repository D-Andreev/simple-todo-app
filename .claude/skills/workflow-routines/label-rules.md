# GitHub Label Rules

Exactly **one** active workflow label per issue.

## Label swap order

When a phase **advances**, **label swap is usually last** — after handoff commit/push on branch, PR creation, and short issue comments.

**Exception — clarify start:** swap to `workflow:clarify` **first**.

**Clarify start order:** label swap → **create branch + init handoff commit** → session comment → Q1.

```bash
# implement complete
# 1. git commit + push workflow/issues/{n}/ …
# 2. gh pr create --draft …
# 3. gh issue comment … (short)
# 4. gh issue edit … ← LAST
```

Record `labels_updated` in `state.json` when committing; swap labels after all other writes.

**Handoff:** branch `workflow/issue-{n}`, files under `workflow/issues/{n}/`. Clarify **creates branch first**; all phases commit handoff there. Issue comments human-only — [handoff-format.md](handoff-format.md).

## Label swap

```bash
gh issue edit 42 --remove-label "workflow:start" --add-label "workflow:clarify"
gh issue edit 42 --remove-label "workflow:clarify" --add-label "workflow:implement"
gh issue edit 42 --remove-label "workflow:implement" --add-label "workflow:review"
gh issue edit 42 --remove-label "workflow:review" --add-label "workflow:human-review"
```

## Triggers

| Label | Routine |
|-------|---------|
| `workflow:start` | Clarify |
| `workflow:implement` | Implement |
| `workflow:review` | AI Review |

## Session comments (human-only)

| Phase | Example |
|-------|---------|
| Clarify start | `**Clarify** — [session](url) · branch workflow/issue-{n}` |
| Clarify approve | `**Clarify complete** — requirements approved.` |
| Implement start | `**Implement** — [session](url)` |
| Implement complete | `**Implement complete** — draft PR #…` |
| Review start | `**Review** — [session](url) · PR #…` |
| Review complete | `**Review complete** — {VERDICT}` |

## Advance commands

| Phase | User says | Effect |
|-------|-----------|--------|
| Clarify | `approve requirements` | Commit handoff → short comment → **`workflow:implement` last** |

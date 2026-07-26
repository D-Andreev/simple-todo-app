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

**Handoff:** branch `workflow/issue-{n}`, files under `workflow/issues/{n}/`. Issue comments: short, engaging, Claude Code voice — [handoff-format.md](handoff-format.md).

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

## Session comments (human-only voice)

Informative, short, engaging — Claude Code style (warm, direct, lightly playful, professional). See examples in [handoff-format.md](handoff-format.md#issue-comments-humans-only).

| Phase | Example |
|-------|---------|
| Clarify start | `**Clarify** — Let's sharpen the requirements. [Session](…) · specs on [\`workflow/issue-{n}\`](https://github.com/owner/repo/tree/…)` |
| Clarify approve | `**Requirements approved** — Spec locked; implement is next.` |
| Implement start | `**Implement** — Building on [\`workflow/issue-{n}\`](branch_url). [Session](session_url).` |
| Implement complete | `**Draft PR ready** — [#17](pr_url); still draft until you've tested locally.` |
| Review start | `**Review** — Fresh eyes on the diff. [Session](…) · [PR #17](…)` |
| Review complete | `**Review: APPROVE** — [Details](review_url). Ready after your local pass.` |

## Advance commands

| Phase | User says | Effect |
|-------|-----------|--------|
| Clarify | `approve requirements` | Commit handoff → short comment → **`workflow:implement` last** |

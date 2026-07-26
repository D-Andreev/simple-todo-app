# GitHub Label Rules

Exactly **one** active workflow label per issue.

## Label swap order

When a phase **advances**, **label swap is usually last** — after handoff commit/push on branch, PR creation, and issue comments.

**Exception — clarify start:** swap to `workflow:clarify` **first**.

**Clarify start order:** label swap → **create branch + init handoff commit** → session comment → Q1.

```bash
# implement complete
# 1. git commit + push workflow/issues/{n}/ …
# 2. gh pr create --draft …
# 3. gh issue comment … (varied human comment)
# 4. gh issue edit … ← LAST
```

Record `labels_updated` in `state.json` when committing; swap labels after all other writes.

**Handoff:** branch `workflow/issue-{n}`, files under `workflow/issues/{n}/`. Issue comments: engaging, varied — [handoff-format.md](handoff-format.md#issue-comments-humans-only).

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

Warm, lightly playful, professional — **vary wording every time**; never copy the same template. Reference something specific from the issue when you can. Example bank: [handoff-format.md#issue-comments-humans-only](handoff-format.md#issue-comments-humans-only).

| Phase | Must include |
|-------|----------------|
| Clarify start | Session link + branch link |
| Clarify approve | Varied header + `---` + full `requirements.md` |
| Implement start | Session link (+ branch if helpful) |
| Implement complete | Draft PR link |
| Review start | Session + PR links |
| Review complete | Verdict + link to the **one** PR comment |

## Advance commands

| Phase | User says | Effect |
|-------|-----------|--------|
| Clarify | `approve requirements` | Commit handoff → post requirements on issue → **`workflow:implement` last** |

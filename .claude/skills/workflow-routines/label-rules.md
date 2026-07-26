# GitHub Label Rules

Exactly **one** active workflow label per issue.

## Label swap order (race prevention)

When a phase **advances**, the **label swap is usually the last GitHub action** — after handoff gist EDIT, PR creation, and short issue comments.

**Exception — clarify start:** swap to `workflow:clarify` as the **first** action — before session comment, issue read, or Q1.

```bash
# Example: implement complete — order matters
# 1. gh gist edit … (handoff state + artifacts)
# 2. gh pr create --draft ...
# 3. gh issue comment ... (short complete comment)
# 4. gh issue edit ... --remove-label ... --add-label ...  ← LAST
```

Record `labels_updated` in gist `state.json` when editing; perform the physical swap after all other writes.

**Handoff:** one **secret gist** per issue. Clarify **creates** it at approve; implement and review **edit** it at phase start/complete. Issue comments are human-only — see [handoff-format.md](handoff-format.md).

## Label swap

```bash
gh issue edit 42 --remove-label "workflow:start" --add-label "workflow:clarify"
gh issue edit 42 --remove-label "workflow:clarify" --add-label "workflow:implement"
gh issue edit 42 --remove-label "workflow:implement" --add-label "workflow:review"
gh issue edit 42 --remove-label "workflow:review" --add-label "workflow:human-review"
```

## Triggers (routines)

| Label added | Routine |
|-------------|---------|
| `workflow:start` | Clarify |
| `workflow:implement` | Implement |
| `workflow:review` | AI Review |

## Session comments (human-only)

| Phase | Comment |
|-------|---------|
| Clarify start | `**Clarify** — [session](url)` |
| Clarify approve | `**Clarify complete** — requirements approved.` |
| Implement start | `**Implement** — [session](url) · branch …` |
| Implement complete | `**Implement complete** — draft PR #…` |
| Review start | `**Review** — [session](url) · PR #…` |
| Review complete | `**Review complete** — {VERDICT} · [PR review](url)` |

## Advance commands

| Phase | User says | Effect |
|-------|-----------|--------|
| Clarify | `approve requirements` | CREATE gist → EDIT ids → short comment → **`workflow:implement` last** |

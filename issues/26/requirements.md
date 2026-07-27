# Requirements: issue-26

## Original ask
done is one-way today. A pending (or reopen) command would round out the state model without adding new concepts.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | What should the new command be called — `todo reopen <id>` or `todo pending <id>`? | `reopen` | `reopen` |
| 2 | If `todo reopen <id>` is called on a todo that's already `pending`, should it no-op (success message) or error? | No-op | No-op |

## Acceptance criteria
- [ ] `todo reopen <id>` moves a `done` todo back to `pending` (id-or-prefix lookup, same as `done`/`delete`)
- [ ] Reopening an already-`pending` todo succeeds as a no-op (no error)

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

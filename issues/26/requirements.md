# Requirements: issue-26

## Original ask
done is one-way today. A pending (or reopen) command would round out the state model without adding new concepts.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | What should the new command be called — `todo reopen <id>` or `todo pending <id>`? | `reopen` | `reopen` |
| 2 | If `todo reopen <id>` is called on a todo that's already `pending`, should it no-op (success message) or error? | No-op | No-op |
| 3 | Should the success message differ for the no-op case, or say the same thing either way? | Same either way | Same either way |

## Acceptance criteria
- [ ] `todo reopen <id>` moves a `done` todo back to `pending` (id-or-prefix lookup, same as `done`/`delete`)
- [ ] Reopening an already-`pending` todo succeeds as a no-op (no error)
- [ ] Success output is `Reopened: <id> <title>` in both the transition and no-op cases
- [ ] Unknown id (no match / ambiguous prefix) errors the same way as `done`/`delete` today
- [ ] `reopen` is registered in interactive mode (`handlers` + `HELP_TEXT` in `src/interactive.ts`) and in the CLI (`src/index.ts`), mirroring the `done` command's wiring
- [ ] No new `Todo.state` values; `dueDate`, `title`, `createdAt`, and existing sort order are unaffected by reopening

## Approved by human
- [x] Approved

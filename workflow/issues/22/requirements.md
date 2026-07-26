# Requirements: issue-22

## Original ask
list always sorts by createdAt. Options like `--sort title` or `--sort state` would make longer lists usable. Grouped output (pending first, then done) is a nice UX win with minimal schema change.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should grouping (pending before done) be the new default for `todo list`, or an opt-in `--group` flag alongside `--sort title\|state\|createdAt`? | Group by state, then sort by title within each group. | Opt-in `--group` (declined — human wants this as the shape of the output) |

## Acceptance criteria
- [ ] `todo list` groups todos by state: `pending` group first, then `done` group
- [ ] Within each state group, todos are sorted by `title`
- [ ] ...

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

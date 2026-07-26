# Requirements: issue-22

## Original ask
list always sorts by createdAt. Options like `--sort title` or `--sort state` would make longer lists usable. Grouped output (pending first, then done) is a nice UX win with minimal schema change.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should grouping (pending before done) be the new default for `todo list`, or an opt-in `--group` flag alongside `--sort title\|state\|createdAt`? | Group by state, then sort by title within each group. | Opt-in `--group` (declined — human wants this as the shape of the output) |
| 2 | Should this be the unconditional new default (no flags, replaces createdAt order), or keep an escape hatch (`--sort createdAt` / `--no-group`) for the old flat order? | Unconditional default, no escape hatch. | Unconditional default, no escape hatch (agreed) |
| 3 | Does the new ordering apply only to `todo list`, or also to `todo filter <name>`, `interactive` mode's `list`, and `--json` output? | Apply everywhere, including `--json`. | Apply everywhere including `--json` (agreed) |

## Acceptance criteria
- [ ] `todo list` groups todos by state: `pending` group first, then `done` group
- [ ] Within each state group, todos are sorted by `title`
- [ ] No flag/escape hatch to restore the old flat `createdAt` order — this is the only supported order
- [ ] Same group-by-state/sort-by-title ordering applies to `todo filter <name>` results
- [ ] Same ordering applies to `list`/`filter` invoked from `interactive` mode
- [ ] `--json` output on `list`/`filter` is also ordered by state-group then title (no longer raw `createdAt` order)
- [ ] ...

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

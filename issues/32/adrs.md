# ADRs / Notes: issue-32

## Interactive-mode gap — fixed in this issue (revised scope)

Interactive mode (`src/interactive.ts`) has its own hand-rolled regex arg parser for `filter` (`parseFilterArgs`), separate from the commander-based one-shot CLI. It was missing:

- `--priority` wiring (added to the one-shot CLI in issue #30, never wired into interactive's `filter` handler — `commands.handleFilter(name, state, undefined, due, overdue)` omitted the priority argument entirely)
- `--json` support anywhere in interactive mode (not on `filter`, not on `list`)

This predates issue #32. Clarify Q5 initially scoped this out, then was revised: implement should fix both gaps alongside the three new date-range flags, since the human wants full `--json`/interactive parity.

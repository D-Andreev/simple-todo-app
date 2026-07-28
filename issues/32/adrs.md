# ADRs / Notes: issue-32

## Known gap (out of scope, flagged for follow-up)

Interactive mode (`src/interactive.ts`) has its own hand-rolled regex arg parser for `filter` (`parseFilterArgs`), separate from the commander-based one-shot CLI. It is currently missing:

- `--priority` wiring (added to the one-shot CLI in issue #30, never wired into interactive's `filter` handler — `commands.handleFilter(name, state, undefined, due, overdue)` omits the priority argument entirely)
- `--json` support anywhere in interactive mode (not on `filter`, not on `list`)

This predates issue #32 and is explicitly out of scope per clarify Q5 (human: keep this issue scoped to date-range filters). Worth its own follow-up issue.

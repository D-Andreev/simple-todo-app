# Implement Handoff: issue-32 — Date-range filters

## Summary
Added `--due-before <date>`, `--due-after <date>`, and `--due-today` to `todo filter`, AND-combining with every existing filter (`--due`, `--overdue`, `--state`, `--priority`, name search). Boundaries are exclusive; todos with no due date never match any of the three; contradictory ranges yield zero results rather than an error. Also fixed the pre-existing interactive-mode gap (per clarify's Q5 revision): `--json` is now wired into interactive `filter` and `list`, alongside the three new flags.

## Branch
`workflow/issue-32` (from `main`) — draft PR: https://github.com/D-Andreev/simple-todo-app/pull/33

## Changes
- `src/commands.ts` — `handleFilter` gains `dueBefore?`, `dueAfter?`, `dueToday?` params (positional, after `priority`, matching existing convention). Validates `dueBefore`/`dueAfter` via the existing `validateDueDate`. Each of the three satisfies the "at least one filter criterion" check alone. Matching: `dueBefore`/`dueAfter` compare against `todo.dueDate` only when non-null (string comparison on `YYYY-MM-DD` is lexicographically correct for date ordering); `dueToday` compares against `getTodayDateString()`. Added distinct no-match messages: `No todos due today.`, `No todos due after "X" and before "Y".`, `No todos due before "X".`, `No todos due after "X".`.
- `src/index.ts` — `filter` command gets `--due-before <date>`, `--due-after <date>`, `--due-today` options (commander auto-camelCases to `dueBefore`/`dueAfter`/`dueToday`); updated `.description()`.
- `src/interactive.ts` — `parseFilterArgs` extracts the three new flags (order-safe: `--due-before`/`--due-after` extracted before the bare `--due` regex, so `--due\s+` never accidentally matches inside `--due-before`/`--due-after`/`--due-today`) plus `--json` (this was the one genuinely pre-existing gap — `--priority` was already wired by issue #30/#31's PR by the time this issue reached implement). Added `parseListArgs` for `list --json`. Updated `HELP_TEXT`.
- `workflow/PROJECT.md` — merged the three new `## Language` entries (Due-before/Due-after/Due-today filter) from `issues/32/language.md`.
- `docs/adr/0032-interactive-mode-priority-json-gap.md` — new ADR documenting the interactive `--json` gap fix and why `--priority` needed no change.
- Tests — unit coverage added to `tests/commands.test.ts` (26 new cases under `handleFilter`); e2e coverage added to `tests/e2e/cli.e2e.test.ts` for both one-shot CLI and interactive mode (date-range filters, `--json` in interactive `filter`/`list`, updated `help` text).

## TDD cycles
1. **Red**: added `handleFilter` unit tests calling the new positional args — TypeScript compile failure (`Expected 0-6 arguments, but got 8/9`), confirming the tests exercise not-yet-existing behavior.
2. **Green**: implemented `dueBefore`/`dueAfter`/`dueToday` in `handleFilter` — all 108 `commands.test.ts` tests (82 pre-existing + 26 new) passed.
3. Wired one-shot CLI (`src/index.ts`) and interactive mode (`src/interactive.ts`); added e2e tests for both; ran full suite green.

## Test results
- `npm test` (unit): **134 passed**, 0 failed
- `npm run test:e2e`: **95 passed**, 0 failed
- `npm run build`: compiles cleanly, no type errors
- Manual smoke test: `filter --due-before`, `--due-after`, `--due-today`, and `filter --help` all behave as expected against a real `~/.simple-todo/todos.json`

## Acceptance criteria
- [x] `--due-before <date>` matches `dueDate < date` (strict)
- [x] `--due-after <date>` matches `dueDate > date` (strict)
- [x] `--due-today` matches `dueDate === today`
- [x] All three validate their date the same way `--due` does (`--due-today` takes no argument)
- [x] AND-combine with each other and with `--due`/`--overdue`/`--state`/`--priority`/name search; contradictory ranges yield zero matches, not an error
- [x] Each of the three alone satisfies the "at least one filter criterion" check
- [x] Match any `state`; combine with `--state` to narrow
- [x] `dueDate: null` never matches any of the three
- [x] `--json` output unaffected (no schema change)
- [x] `filter --help` / description mentions the new options
- [x] Distinct no-match message per new filter
- [x] Interactive `filter` parses and wires the three new flags
- [x] Interactive `filter` parses/wires `--priority` — already fixed by issue #30/#31; verified via existing e2e coverage, no change needed
- [x] Interactive `filter` and `list` parse/wire `--json`
- [x] Interactive `help` text lists `--priority`, `--json`, and the three date-range flags on `filter` (and `--json` on `list`)

## Suggested review scenarios
- `todo filter --due-before 2026-08-01 --due-after 2026-07-01` against a mix of in-range/out-of-range/null-due-date todos, one-shot and interactive
- `todo filter --due-today` at/near midnight boundary (relies on local-time `getTodayDateString`, same as existing `--overdue`)
- `todo interactive` → `filter --priority high --json` and `list --json` — confirm JSON parity with the one-shot CLI
- Contradictory range (`--due-after` later than `--due-before`) → zero results, exit code 0, no thrown error
- `filter --due-before nope` → same `Invalid due date. Expected format: YYYY-MM-DD` error as `--due`

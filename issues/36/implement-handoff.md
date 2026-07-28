# Implement Handoff: issue-36

## Summary
Replaced the CLI's bare-bones help output with a shared, grouped help renderer used consistently by the one-shot CLI and interactive mode, plus a compact ASCII "TODO" banner.

## Branch
`workflow/issue-36` (head `de6b17d042bcdf358528f4389f4ab44bb2602cdb`) — draft PR: https://github.com/D-Andreev/simple-todo-app/pull/37

## Changes
- **`src/help.ts`** (new) — generates the "TODO" ASCII banner from letter glyphs, defines the four command groups (Manage todos / Find & filter / Data / Session) with per-command usage examples and descriptions tagged by mode (`cli` / `interactive`), and exports `renderHelp(mode)`.
- **`src/index.ts`** — before Commander parses, checks `process.argv`: no args, `--help`, or `-h` now print `renderHelp('cli')` and exit 0. All other invocations (including `todo add --help`) fall through to Commander's normal per-subcommand help, unchanged.
- **`src/interactive.ts`** — removed the old hardcoded `HELP_TEXT` constant; the `help` command now prints `renderHelp('interactive')`.

## TDD cycles
1. Explored existing `src/index.ts` (Commander-based one-shot CLI) and `src/interactive.ts` (hardcoded `HELP_TEXT`) to find the two surfaces needing a shared renderer, and confirmed `tests/e2e/cli.e2e.test.ts` already asserts `add --help` excludes `--json` (must stay true) and interactive `help` includes `--json`/`--priority`/`--due-before`/`--due-after`/`--due-today`/`--tag` (must stay true).
2. Wrote `src/help.ts` with banner + grouped metadata, wired both surfaces to it, ran `npm run build` (caught missing `@types/node` — dependencies weren't installed yet; ran `npm install` to fix, unrelated to this change).
3. Ran `npm test` + `npm run test:e2e` — all 154/104 pre-existing tests passed unmodified, confirming the swap didn't break existing behavior (in particular the `--json`-exclusion and flag-presence checks above).
4. Manually inspected `todo --help`, bare `todo`, `todo add --help`, and interactive `help` output; found the "Find & filter" group's long `filter` example line broke column alignment against the very short `list --json` line — added an `ALIGN_CAP` so padding only aligns short examples and long ones just get a plain two-space gap.
5. Added `tests/help.test.ts` (banner shape, group headers, mode-specific inclusion/exclusion of `interactive`/`exit`/`quit`/`help`) and new cases in `tests/e2e/cli.e2e.test.ts` (`todo --help`, bare `todo`, `add --help` still has no banner/groups, interactive `help` shows banner/groups but not `interactive`).

## Test results
- `npm test`: 158 passed (154 pre-existing + 4 new in `tests/help.test.ts`)
- `npm run test:e2e`: 108 passed (104 pre-existing + 4 new in `tests/e2e/cli.e2e.test.ts`)

## Acceptance criteria
- [x] `todo --help`, bare `todo`, and interactive `help` all show the improved output; `todo add --help` (and other subcommand help) untouched
- [x] Compact "TODO" ASCII banner (plain text, no color codes) appears above help text on exactly those three surfaces
- [x] Four groups: Manage todos (`add`, `update`, `done`, `reopen`, `delete`, `clear`), Find & filter (`list`, `filter`), Data (`export`, `import`), Session (`interactive` one-shot only; `help`/`exit`/`quit` interactive only)
- [x] Each command line has a one-line usage example
- [x] One-shot CLI and interactive mode share the same grouping/description/example content
- [x] Existing `.toContain()` assertions in `tests/e2e/cli.e2e.test.ts` pass unmodified
- [x] New assertions for group headers, banner text, and example lines (both unit and e2e)
- [x] `add --help` still does not leak `--json`

## Suggested review scenarios
- `node dist/index.js --help`, `node dist/index.js` (bare), and `printf 'help\nexit\n' | node dist/index.js interactive` — confirm banner + grouping on all three, and check the "Find & filter" line's alignment reads acceptably given the long `filter` example.
- `node dist/index.js add --help` — confirm it's still Commander's plain per-flag output with no banner and no `--json`.
- Diff `src/help.ts`'s `GROUPS` against the approved requirements' four groups and command lists for completeness.

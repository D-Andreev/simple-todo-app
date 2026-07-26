# Implement handoff: issue-22 — List sorting and grouping

## Summary

`todo list` and `todo filter` no longer sort by raw `createdAt`. Results are now grouped by `state` (`pending` group first, `done` group second) and sorted by `title` (case-insensitive, ascending) within each group, with `createdAt` ascending as the tiebreaker for identical case-insensitive titles. This is the unconditional new default — no `--sort`/`--group` flag, no escape hatch back to flat `createdAt` order. Applies uniformly to text output, `--json` output, one-shot CLI, and `interactive` mode (which delegates to the same handlers).

## Branch

`workflow/issue-22`

## Changes

- `src/commands.ts`
  - Added `compareTodos(a, b)`: state group (pending < done) → title (lowercased) → `createdAt`.
  - `handleList` and `handleFilter` now `.sort(compareTodos)` instead of `.sort((a, b) => a.createdAt - b.createdAt)`. This sort runs before the `--json` branch, so JSON output gets the same order as text output.
  - `interactive.ts` and `index.ts` required no changes — both delegate straight to `commands.handleList`/`handleFilter`.
- `workflow/PROJECT.md` — merged new **List ordering** term into `## Language`.
- No changes to the `Todo` shape (`id`, `title`, `state`, `createdAt`) or to `storage.ts` — sorting stays a `commands.ts`-layer concern; `storage.getTodos()` still returns raw stored order.

## TDD cycles

1. **Red** — rewrote/added tests in `tests/commands.test.ts` for `handleList`/`handleFilter`: grouping overrides creation order, title sort within a group, case-insensitive tiebreak by `createdAt`, and that `--json` order matches text order. Ran `npm test`: 8 failing as expected (old `createdAt`-only sort).
2. **Green** — added `compareTodos` and swapped both `.sort()` calls in `src/commands.ts`. `npm test`: 62/62 passing.
3. **E2E** — updated `tests/e2e/cli.e2e.test.ts`: fixed the `list` ordering assertion in the happy-path test (pending now precedes done) and the `filter` case-insensitive test (alphabetical order flipped `Buy milk`/`Buy groceries`); added two new e2e tests covering grouped+title-sorted output for `list` and `filter` against the built CLI. `npm run build && npm run test:e2e`: 41/41 passing.

## Test results

- `npm test` — 62/62 passing
- `npm run build` — clean
- `npm run test:e2e` — 41/41 passing

## Acceptance criteria

- [x] `todo list` groups todos by state: `pending` group first, then `done` group
- [x] Within each state group, todos are sorted by `title`, case-insensitively, ascending
- [x] Todos with identical (case-insensitive) titles within a group are ordered by `createdAt` ascending
- [x] No flag/escape hatch to restore the old flat `createdAt` order
- [x] Same ordering applies to `todo filter <name>` results
- [x] Same ordering applies to `list`/`filter` invoked from `interactive` mode (verified via e2e interactive tests using the same handlers)
- [x] `--json` output on `list`/`filter` is also ordered by state-group then title
- [x] No changes to the `Todo` object shape — ordering only

## Suggested review scenarios

- `todo list` with a mix of pending/done todos and titles that differ only by case, to confirm grouping + case-insensitive sort.
- `todo filter <name> --json` with matches spanning both states, to confirm JSON order matches text order.
- Two todos with identical titles differing only in case, added at different times, to confirm the `createdAt` tiebreaker.
- `todo interactive` → `list` / `filter` to confirm the REPL sees the same ordering as the one-shot CLI.

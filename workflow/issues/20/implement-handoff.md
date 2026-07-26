# Implement Handoff: issue-20

## Summary

Added a `--json` flag to `list` and `filter` so output can be scripted (e.g. piped through `jq`), per the approved requirements. All other commands and `interactive.ts` are unchanged.

## Branch

`workflow/issue-20` → draft PR [#21](https://github.com/D-Andreev/simple-todo-app/pull/21) (base `main`)

## Changes

- `src/commands.ts`
  - `handleList(json?: boolean)` — when `json` is true, returns `JSON.stringify(sortedTodos, null, 2)` (raw `Todo[]`, `[]` when empty) instead of formatted human rows.
  - `handleFilter(searchTerm?: string, state?: string, json?: boolean)` — validation (invalid `--state`, empty search term) runs unchanged before the json branch; when `json` is true, returns `JSON.stringify(sortedMatches, null, 2)` (`[]` when no matches) instead of formatted rows / "no todos" text.
- `src/index.ts`
  - Added `.option('--json', 'Output as JSON')` to the `list` and `filter` commander commands; `options.json` is passed through to the handlers.
  - `add`, `done`, `update`, `delete`, `clear` untouched — no `--json` option.
- `src/interactive.ts` — untouched, per requirement #5 (JSON output is CLI-only).
- `workflow/PROJECT.md` — merged the `JSON output` language entry under `## Language`.

## TDD cycles

1. **Red** — added failing unit tests (`tests/commands.test.ts`) for `handleList(true)` / `handleFilter(..., true)` covering: raw-object shape, empty → `[]`, and that state validation still throws under `--json`. Confirmed compile failure (`Expected 0 arguments, but got 1`) before touching `src/`.
2. **Green** — implemented the `json` param on both handlers; unit suite passed (56/56).
3. **Red → Green (e2e)** — added `tests/e2e/cli.e2e.test.ts` cases for `list --json`, `filter --json` (match/no-match), `filter --state <invalid> --json` (still errors), and a guard that `add --help` has no `--json` option. Wired the CLI flags in `src/index.ts`; built and re-ran — one early assertion bug (comparing full uuid against the 8-char id shown in human `Added:` output) was fixed in the test, not the implementation. All 39 e2e tests passed after the fix.

## Test results

- `npm test` — **56/56 passed** (`tests/commands.test.ts`, `tests/storage.test.ts`)
- `npm run build && npm run test:e2e` — **39/39 passed** (`tests/e2e/cli.e2e.test.ts`, incl. interactive-mode suite)
- Manual smoke test: `todo list --json | jq '.[] | select(.state == "pending")'` behaves as described in the original issue; `todo filter --state bogus --json` still exits 1 with the plain-text error.

## Acceptance criteria

- [x] `todo list --json` and `todo filter [name] [--state <state>] --json` support a `--json` flag
- [x] `add`, `done`, `update`, `delete`, `clear` remain human-readable text output (no `--json`)
- [x] `--json` emits each todo as `{ id, title, state, createdAt }` with raw internal values — full uuid `id`, epoch-ms number `createdAt`
- [x] `--json` with no matching todos emits `[]`, not the human "no todos" sentence
- [x] Validation errors (e.g. invalid `--state`) still throw and print plain text to stderr with exit code 1, unchanged by `--json`
- [x] `--json` is not added to `interactive.ts` (`filter`/`list` handlers and help text unchanged there)
- [x] JSON output is pretty-printed with 2-space indentation (`JSON.stringify(data, null, 2)`)

## Suggested review scenarios

- `todo list --json` with 0, 1, and multiple todos (check sort order + `[]` for empty)
- `todo filter <name> --json` with matches and no matches
- `todo filter --state <state> --json` with and without a name term
- `todo filter --state bogus --json` — confirm plain-text stderr error, exit 1, no JSON error shape
- Diff `interactive.ts` and its e2e suite — confirm no `--json` wiring or behavior change
- `add`/`done`/`update`/`delete`/`clear` — confirm output format is byte-for-byte unchanged

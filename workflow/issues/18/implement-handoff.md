# Implement handoff: issue-18

## Summary

Added a `clear` command that deletes todos immediately, either all of them or only those matching a given `--state`, mirroring the existing `filter` command's `--state <state>` option shape.

## Branch

`workflow/issue-18`

## Changes

| File | Change |
|------|--------|
| `src/storage.ts` | `clearTodos(state?: 'pending' \| 'done'): number` — removes matching todos (all when `state` is omitted), persists, returns count removed. |
| `src/commands.ts` | `handleClear(state?: string): string` — validates state (`pending`/`done`), calls `storage.clearTodos`, formats the result message. |
| `src/index.ts` | New `clear` subcommand with `--state <state>` option, same error-handling shape as other commands. |
| `src/interactive.ts` | `clear` dispatch handler + `parseClearArgs`, help text entry. |
| `tests/storage.test.ts` | Unit tests for `clearTodos` (no state, state match, no match). |
| `tests/commands.test.ts` | Unit tests for `handleClear` (invalid state, no state, `--state done`, `--state pending`, no-match, empty store, no confirmation). |
| `tests/e2e/cli.e2e.test.ts` | One-shot CLI + interactive-mode e2e coverage for `clear`, `clear --state <state>`, invalid state, no-match, and updated `help` assertion. |

## TDD cycles

1. **Red** — added failing tests for `storage.clearTodos` and `commands.handleClear` (`npx jest` → 2 suites failed to compile: `clearTodos`/`handleClear` don't exist).
2. **Green** — implemented `clearTodos`, `handleClear`, CLI wiring, interactive wiring. `npx jest` → 51/51 unit tests pass.
3. **E2e** — built (`npm run build`) and ran `npx jest --config jest.e2e.config.js` → 33/33 pass, covering one-shot CLI and interactive-mode paths.

## Test results

- `npx jest` — 51 passed, 51 total (2 suites).
- `npm run build` — clean (`tsc`, no errors).
- `npx jest --config jest.e2e.config.js` — 33 passed, 33 total.

## Acceptance criteria

- [x] `todo clear --state <state>` deletes only todos in that state (validated to `pending`/`done`, same as `filter`)
- [x] `todo clear` with no flag deletes all todos
- [x] No confirmation prompt — executes immediately
- [x] Output: `Cleared N todo(s).` (no state) / `Cleared N done todo(s).` (with `--state done`); `No todos to clear.` when nothing matched
- [x] `clear` (with `--state` parsing) added to `interactive.ts` handlers and help text, mirroring `filter`

## Suggested review scenarios

1. `todo clear` on an empty store → `No todos to clear.`
2. `todo add ...` a few todos, `todo done <id>` one, then `todo clear --state done` → only the done one removed, message `Cleared 1 done todo(s).`
3. `todo clear --state bogus` → `Error: Invalid state. Valid values: pending, done`, exit code 1.
4. `todo interactive`, run `clear --state pending`, confirm remaining todos and help text list `clear`.

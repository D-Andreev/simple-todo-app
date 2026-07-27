# Implement Handoff: issue-26

## Summary
Added `todo reopen <id>`, the inverse of `done`: moves a `done` todo back to `pending`, id-or-prefix lookup, no-op (not an error) when the todo is already `pending`. No new `Todo.state` values were introduced.

## Branch
- Work branch: `workflow/issue-26` (from `main`)
- PR: #27 (draft) — https://github.com/D-Andreev/simple-todo-app/pull/27

## Changes
- `src/storage.ts` — `reopenTodo(idOrPrefix)`: mirrors `markTodoDone`, sets `state = 'pending'`, throws `Todo with id {id} not found` when missing (via `findTodoByIdOrPrefix`, so ambiguous-prefix errors are inherited for free).
- `src/commands.ts` — `handleReopen(id)`: calls `storage.reopenTodo`, returns `Reopened: <id-8> <title>` — same message whether it was a real transition or a no-op.
- `src/index.ts` — `reopen <id>` CLI command, wired identically to `done <id>` (try/catch → `console.log`/`console.error` + `process.exit(1)`).
- `src/interactive.ts` — `reopen` added to `handlers` (same shape as `done`) and to `HELP_TEXT`.
- `workflow/PROJECT.md` — merged `Reopen` term from `language.md` into `## Language`.
- `README.md` — documented `todo reopen <id>` under Commands.

## TDD cycles
1. **Red**: added failing tests first —
   - `tests/storage.test.ts`: `reopenTodo` transitions done→pending, no-ops on pending, throws on not-found.
   - `tests/commands.test.ts`: `handleReopen` message format for transition + no-op, throws on not-found.
   - `tests/e2e/cli.e2e.test.ts`: CLI happy path, no-op, not-found error, and an interactive-mode `done`→`reopen`→`list` scenario.
2. **Green**: implemented `reopenTodo` / `handleReopen` / CLI + interactive wiring exactly mirroring the existing `done` command's pattern (confirmed by re-reading `src/commands.ts:79`, `src/storage.ts:78`, `src/index.ts:42-53`, `src/interactive.ts` handlers/HELP_TEXT before writing).

## Test results
This session's network is sandboxed — `npm install` is blocked (`registry.npmjs.org` not in the environment's allowlist, 403), so `npm test` / `npm run test:e2e` could not be executed locally. Ran `npx tsc --noEmit` against the changed files: it reports only pre-existing missing-dependency errors (`uuid`, `commander`, `@types/node` not installed) with **no errors localized to the new `reopen` code**. The repo's CI (`.github/workflows/ci.yml`: `npm ci && npm run build && npm test && npm run test:e2e`) will run the full suite on the PR.

## Acceptance criteria
- [x] `todo reopen <id>` moves a `done` todo back to `pending` (id-or-prefix lookup, same as `done`/`delete`)
- [x] Reopening an already-`pending` todo succeeds as a no-op (no error)
- [x] Success output is `Reopened: <id> <title>` in both the transition and no-op cases
- [x] Unknown id (no match / ambiguous prefix) errors the same way as `done`/`delete` today
- [x] `reopen` is registered in interactive mode (`handlers` + `HELP_TEXT` in `src/interactive.ts`) and in the CLI (`src/index.ts`), mirroring the `done` command's wiring
- [x] No new `Todo.state` values; `dueDate`, `title`, `createdAt`, and existing sort order are unaffected by reopening

## Suggested review scenarios
- `todo add "X" && todo done <id> && todo reopen <id> && todo list` — todo should show back in the `pending` group, sorted by title as before.
- `todo reopen <id>` on a todo that's already `pending` — same `Reopened: ...` message, no error, no state change side effects.
- `todo reopen nonexistent-id` and an ambiguous-prefix case — confirm identical error text/format to `done`/`delete`.
- `todo interactive` → `done <id>` → `reopen <id>` → `list` → confirm `help` lists the new command.
- Diff review: confirm `reopenTodo` is a straight mirror of `markTodoDone` and doesn't touch `dueDate`/`createdAt`/sort logic.

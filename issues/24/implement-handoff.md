# Implement handoff: issue-24

## Summary
Added an optional due date to todos: `todo add --due YYYY-MM-DD` sets it, `todo filter --due` / `--overdue` filter by it, and both `list`/`filter` text and `--json` output surface it. Sort order is unchanged.

## Branch
`workflow/issue-24` (from `main`) — PR: https://github.com/D-Andreev/simple-todo-app/pull/25 (draft)

## Changes
- `src/storage.ts`: `Todo.dueDate: string | null`; `addTodo(title, id, dueDate?)` stores it, defaulting to `null`.
- `src/commands.ts`:
  - `isValidDueDate` / `validateDueDate`: strict `YYYY-MM-DD` format + real-calendar-date check (rejects e.g. `2026-13-40`).
  - `getTodayDateString` / `isOverdue`: local-date comparison for `--overdue` (pending + `dueDate < today`).
  - `formatTodoRow`: appends ` due: YYYY-MM-DD` when set, omitted otherwise.
  - `handleAdd(title, dueDate?)`: validates `dueDate` before creating; invalid value throws and nothing is persisted.
  - `handleFilter(searchTerm?, state?, json?, due?, overdue?)`: validates `due`; matches exact `dueDate` and/or overdue pending todos; combinable with name/`--state`; can be used standalone (no name/state required); new no-match messages for due-only/overdue-only cases (existing name/state messages untouched).
- `src/index.ts`: `add` gets `--due <date>`; `filter` gets `--due <date>` and `--overdue`.
- `src/interactive.ts`: `parseAddArgs` extracts `--due` from the add line; `parseFilterArgs` extended to also extract `--due`/`--overdue` (any order); help text updated.
- `workflow/PROJECT.md`: merged `Due date` / `Overdue` language terms.

## TDD cycles
- Red: added failing unit tests for `storage.addTodo` due-date storage/default, then implemented the field.
- Red: added failing unit tests for `handleAdd` validation (invalid format, invalid calendar date, past dates allowed), then implemented `validateDueDate`/wiring.
- Red: added failing unit tests for `handleList`/`handleFilter` text row + `--json` `dueDate` exposure and unchanged sort order, then implemented `formatTodoRow` change.
- Red: added failing unit tests for `--due` exact match and `--overdue` filtering (standalone and combined with name/state), then implemented the filter logic and no-match messages.
- Red: added failing e2e tests (CLI flags + interactive-mode flag parsing), then implemented CLI/interactive wiring.
- Green: all cycles closed; existing tests required only additive updates (new `dueDate: null` field in prior fixtures/assertions), no existing behavior changed.

## Test results
- `npm test` — 82/82 unit tests pass (21 new)
- `npm run test:e2e` — 53/53 e2e tests pass (12 new)
- `npm run build` — compiles cleanly

## Acceptance criteria
- [x] `todo add <title> --due YYYY-MM-DD` sets an optional due date; `todo add <title>` unchanged
- [x] `todo add <title> --due <invalid>` throws `Invalid due date. Expected format: YYYY-MM-DD`, todo not created
- [x] Past due dates allowed at creation
- [x] `todo filter --due YYYY-MM-DD` exact match, combinable with name/`--state`
- [x] `todo filter --overdue` matches pending todos with due date before today
- [x] `list`/`filter` text rows show `due: YYYY-MM-DD` when set, omitted otherwise
- [x] `list`/`filter` `--json` includes `dueDate` (`YYYY-MM-DD` string or `null`)
- [x] Sort order unchanged (state → title → `createdAt`); due date not a sort key

## Suggested review scenarios
1. `todo add "Pay rent" --due 2026-08-01`, `todo list` → row shows `due: 2026-08-01`; `todo list --json` shows `"dueDate": "2026-08-01"`.
2. `todo add "Bad date" --due 2026-02-30` → errors, exit code 1, nothing persisted.
3. `todo add "Old" --due 2020-01-01` → succeeds (past dates allowed).
4. `todo filter --overdue` with a mix of overdue-pending, overdue-done, future-pending, and no-due todos → only the overdue-pending one shows.
5. `todo filter "pay" --state pending --due 2026-08-01` → combined filters.
6. Interactive mode: `add Pay rent --due 2026-08-01` then `filter --overdue` / `filter --due 2026-08-01`.

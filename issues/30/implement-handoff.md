# Implement Handoff: issue-30

## Summary

Added a `priority` field (`low` | `mid` | `high`) to `Todo`. Optional on `todo add --priority <low|mid|high>`, defaulting to `mid`. Shown in `list`/`filter` text rows and `--json` output without affecting the existing `state → title → createdAt` sort order. `todo filter --priority <low|mid|high>` filters standalone or AND'd with `--state`/`--due`/`--overdue`/name, with the same invalid-value error pattern as `--state`. A stored or imported todo with no `priority` field is treated as `mid` (normalized at read time, not `null`/unset). `todo export`/`todo import` round-trip priority; import rejects an invalid priority value as a counted invalid entry but accepts a missing one. No `--priority` on `update` — out of scope per approved requirements.

## Branch

`workflow/issue-30` — draft PR: [#31](https://github.com/D-Andreev/simple-todo-app/pull/31)

## Changes

| File | What changed |
|------|--------------|
| `src/storage.ts` | `Priority` type; `Todo.priority` (required); `normalizePriority` applied in `getTodos()` so any stored entry missing `priority` reads back as `mid`; `addTodo` takes an optional `priority`, defaulting to `mid` |
| `src/commands.ts` | `VALID_PRIORITIES`, `isValidPriority`/`validatePriority` (mirrors `validateDueDate`); `handleAdd` validates + passes `priority` through; `formatTodoRow` appends `priority: <value>`; `handleFilter` takes an optional `priority`, validates it, ANDs it into the filter predicate, adds it to the "must provide a criterion" check and a priority-specific no-match message; `isValidImportEntry` accepts a missing `priority` but rejects an invalid one; `handleImport` defaults a missing `priority` to `mid` on the entries it stores |
| `src/index.ts` | `--priority <priority>` option wired onto the `add` and `filter` commander commands |
| `src/interactive.ts` | `parseAddArgs`/`parseFilterArgs` parse `--priority <value>` out of the raw REPL line; help text updated |
| `workflow/PROJECT.md` | Merged **Priority** language entry |
| `README.md` | Documented `--priority` on `add`, priority in `list` output, storage format, and import validation notes |
| `tests/storage.test.ts` | Unit tests: `addTodo` default/explicit priority, `getTodos` normalizing a legacy entry with no `priority` field |
| `tests/commands.test.ts` | Unit tests: `handleAdd` default/valid/invalid priority; `formatTodoRow` priority suffix + sort-order independence; `handleFilter` standalone/combined/invalid/no-match/json priority coverage; `handleExport` normalizing legacy entries; `handleImport` valid/missing/invalid priority + round-trip |
| `tests/e2e/cli.e2e.test.ts` | e2e coverage: `add --priority` (CLI + interactive), `filter --priority` (CLI + interactive), legacy-data defaulting via a hand-written `todos.json`, export/import round-trip and invalid-priority-on-import scenarios |

## TDD cycles

| Behavior / criterion | Test(s) | Red (fail reason) | Green |
|---|---|---|---|
| `add --priority` sets priority, defaults to `mid` | `storage.test.ts` / `commands.test.ts` `handleAdd` | `Todo.priority` / `addTodo` priority param didn't exist | Added `Priority` type, `Todo.priority`, `addTodo(..., priority?)` defaulting to `mid` |
| Invalid `--priority` on `add` errors like `--state` | `commands.test.ts` `handleAdd` | `validatePriority` didn't exist | Added `isValidPriority`/`validatePriority`, wired into `handleAdd` |
| Priority shown in text rows and `--json`, sort order unaffected | `commands.test.ts` `handleList` | `formatTodoRow` had no priority suffix | Appended `priority: <value>` to `formatTodoRow`; `compareTodos` untouched |
| `filter --priority` standalone + AND'd + invalid-value validation | `commands.test.ts` / e2e `handleFilter` | `handleFilter` had no `priority` param | Added `priority` param, validation, AND'd predicate, criterion check, no-match message |
| Legacy stored/imported todo with no `priority` treated as `mid` | `storage.test.ts` `getTodos`, `commands.test.ts`/e2e `handleImport`, `handleExport` | Missing field surfaced as `undefined` | `normalizePriority` in `getTodos`; `isValidImportEntry` allows missing `priority`; `handleImport` defaults it to `mid` before storing |
| `export`/`import` round-trip priority | e2e `export / import` | N/A — `getTodos()` already flows through `handleExport` | Verified round-trip via export → clear → import |

## Test results

- `npm test` — 119/119 passing
- `npm run test:e2e` — 81/81 passing
- `npm run build` — clean
- Manual CLI verification: `add --priority high`, default `mid`, invalid-value error (exit 1), `filter --priority`, `list --json` all behave as expected

## Acceptance criteria

- [x] `todo add <title> --priority <low|mid|high>` sets the todo's priority; `--priority` is optional and defaults to `mid` when omitted
- [x] An invalid `--priority` value on `add` errors with a message listing the valid values (`low`, `mid`, `high`), matching the `--state` validation pattern
- [x] `list`/`filter` sort order remains `state → title → createdAt`, unaffected by priority
- [x] Text rows for `list`/`filter` show the todo's priority (alongside the existing `due:` suffix style)
- [x] `--json` output for `list`/`filter` includes a `priority` field on each todo object
- [x] `todo filter --priority <low|mid|high>` filters todos by priority; standalone and AND'd with `--state`, `--due`, `--overdue`, and name search
- [x] An invalid `--priority` value on `filter` errors the same way an invalid `--state` value does today
- [x] There is no way to change a todo's priority after creation in this issue (no `--priority` on `update`)
- [x] A stored todo (existing `todos.json` entry, or an `import`ed entry) with no `priority` field is treated as `mid` — not an import validation failure, not `null`/unset
- [x] `todo export` includes the `priority` field for every todo; export/import round-trips priority

## Suggested review scenarios

1. `todo add "Task" --priority high` → `todo list` / `todo list --json` show `priority: high` / `"priority": "high"`
2. `todo add "Task" --priority nope` → errors, exit 1, no todo created
3. `todo filter --priority mid` standalone, and combined with `--state done`, `--due <date>`, `--overdue`, and a name term
4. `todo filter --priority nope` → same error shape as `todo filter --state nope`
5. Hand-edit `~/.simple-todo/todos.json` to remove a `priority` field, then `todo list` / `todo export` — should show/export `mid`
6. `todo export | todo import` with a mix of priorities — round-trips exactly; an entry with `priority: "urgent"` in the import payload is skipped and counted as invalid, not aborting the whole import

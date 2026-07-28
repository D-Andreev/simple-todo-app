# Task: issue-32 — Date-range filters

## Source
https://github.com/D-Andreev/simple-todo-app/issues/32

## Original ask
Add:
  • filter --due-before 2026-08-01
  • filter --due-after 2026-07-01
  • filter --due-today

## Relevant existing behavior (from codebase)
- `todo filter` already supports `--due <date>` (exact match), `--overdue` (pending + dueDate < today), `--state`, `--priority`, and name search, all AND-combined; requires at least one filter criterion.
- `handleFilter` in `src/commands.ts` validates dates via `validateDueDate` (regex `YYYY-MM-DD` + real-calendar-date check), same pattern used by `add --due` and `--priority`.
- `isOverdue`/`getTodayDateString` already give us a "today" helper for `--due-today`.
- Todos with `dueDate: null` are excluded from `--due` matches today (`todo.dueDate === due`); date-range filters likely follow the same precedent.

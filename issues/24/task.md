# Task: issue-24

## Title
Add due date for todo items

## Original ask
> We can set a due date when creating actions and filter by due date.

## Source
https://github.com/D-Andreev/simple-todo-app/issues/24

## Context (from PROJECT.md / codebase)
- CLI app (`todo <command> <args>`), Node.js + `commander`.
- `Todo` currently: `{ id, title, state, createdAt }`, stored in `~/.simple-todo/todos.json`.
- `handleAdd(title)` creates a todo — no optional args today.
- `handleFilter(searchTerm?, state?, json?)` filters by title substring and/or `state`; will need a due-date dimension.
- `List ordering` (PROJECT.md) currently groups by `state`, then title, then `createdAt` — due date's effect on ordering is open.

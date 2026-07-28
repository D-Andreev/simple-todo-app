# Task: issue-34

## Title
Tags for todos

## Original ask (from issue body)
> I want to be able to add tags for todos.

## Context
- Repo: `simple-todo-app` — Node.js/TypeScript CLI todo manager (`todo <command> <args>`).
- `Todo` model currently: `id`, `title`, `state`, `createdAt`, `dueDate`, `priority` (`src/storage.ts`).
- Existing filter flags (`src/commands.ts`): `--state`, `--due`, `--overdue`, `--priority`, `--due-before`, `--due-after`, `--due-today`.
- No tagging concept exists yet in `workflow/PROJECT.md` `## Language` or in the codebase.

## Notes
This file tracks the raw ask; `requirements.md` holds the clarified, agreed spec.

# Task: issue-18

## Source

[#18 — Add clear command](https://github.com/D-Andreev/simple-todo-app/issues/18)

## Original ask

> Add clear command. If no params passed delete all. If state passed (i.e.) done, clears all done todos.

## Notes

- Mirrors the existing `filter` command's `--state <state>` option shape (see `src/commands.ts` `handleFilter`, `src/index.ts`, `src/interactive.ts`).
- Needs a CLI subcommand (`src/index.ts`), a `commands.ts` handler, a `storage.ts` bulk-delete primitive, and an interactive-mode dispatch entry + help text (`src/interactive.ts`).

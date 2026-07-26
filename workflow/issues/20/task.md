# Task: issue-20

## Source

[#20 — add --json mode to output in json](https://github.com/D-Andreev/simple-todo-app/issues/20)

## Original ask

> 8. --json output flag
>
> Makes the CLI scriptable:
>
> todo list --json | jq '.[] | select(.state == "pending")'

## Notes

- Existing read commands are `list` (`src/commands.ts` `handleList`) and `filter` (`handleFilter`), both currently returning pre-formatted human-readable strings (`formatTodoRow`).
- Mutating commands (`add`, `done`, `update`, `delete`, `clear`) also print human-readable one-line confirmations today.
- `Todo` shape (`src/storage.ts`): `{ id: string; title: string; state: 'pending' | 'done'; createdAt: number }`. Human output truncates `id` to 8 chars and formats `createdAt` as ISO.
- Need to decide: which commands get `--json`, exact JSON shape (full vs truncated id, raw vs ISO timestamp), empty-result shape, error shape, and interactive-mode scope.

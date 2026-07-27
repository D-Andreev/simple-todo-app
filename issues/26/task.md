# Task: issue-26

## Title
Reopen / undo done

## Original ask
> done is one-way today. A pending (or reopen) command would round out the state model without adding new concepts.

## Source
https://github.com/D-Andreev/simple-todo-app/issues/26

## Context (from PROJECT.md / codebase)
- CLI app (`todo <command> <args>`), Node.js + `commander`.
- `Todo.state` is `'pending' | 'done'` (`src/storage.ts`); no existing transition moves a todo back from `done` to `pending`.
- `handleDone(id)` (`src/commands.ts:79`) calls `storage.markTodoDone(idOrPrefix)` (`src/storage.ts:78`), which sets `state = 'done'` and saves.
- `index.ts` wires `done <id>` as a top-level command (`src/index.ts:42-53`); same pattern (`<command> <id>` → `handleX` → `storage.xTodo`) is used for `delete` and could be mirrored for the new command.
- `findTodoByIdOrPrefix` already handles id-or-prefix lookup and ambiguous-prefix errors — the new path should reuse it.
- Interactive mode (`src/interactive.ts`) dispatches to the same command handlers, so a new command needs no separate interactive wiring beyond registration.
- PROJECT.md's `## Language` defines `State` as `pending` or `done` — issue explicitly wants to avoid adding new state values, just a transition back to `pending`.

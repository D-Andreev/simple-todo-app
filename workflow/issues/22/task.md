# Task: issue-22 — List sorting and grouping

## Source

https://github.com/D-Andreev/simple-todo-app/issues/22

## Original ask

> list always sorts by createdAt. Options like `--sort title` or `--sort state` would make longer lists usable. Grouped output (pending first, then done) is a nice UX win with minimal schema change.

## Notes

- Applies to the `list` command (per `workflow/PROJECT.md` Language: **CLI**, **Todo**, **State**).
- Two related but distinct asks: (1) a `--sort` option, (2) grouped output (pending before done).
- Need to clarify interaction with existing `--json` flag and default behavior.

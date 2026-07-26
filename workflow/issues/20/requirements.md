# Requirements: issue-20

## Original ask
add --json mode to output in json

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Which commands get `--json`? | `list` and `filter` only. | `list` and `filter` only |
| 2 | JSON object shape per todo? | Raw internal fields: full `id`, `title`, `state`, `createdAt` as epoch-ms number (no truncation/ISO formatting). | Same |

## Acceptance criteria
- [ ] `todo list --json` and `todo filter [name] [--state <state>] --json` support a `--json` flag
- [ ] `add`, `done`, `update`, `delete`, `clear` remain human-readable text output (no `--json`)
- [ ] `--json` emits each todo as `{ id, title, state, createdAt }` with raw internal values — full uuid `id`, epoch-ms number `createdAt` (no truncation, no ISO formatting)

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

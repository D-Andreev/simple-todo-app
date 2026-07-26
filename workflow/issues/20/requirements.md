# Requirements: issue-20

## Original ask
add --json mode to output in json

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Which commands get `--json`? | `list` and `filter` only. | `list` and `filter` only |

## Acceptance criteria
- [ ] `todo list --json` and `todo filter [name] [--state <state>] --json` support a `--json` flag
- [ ] `add`, `done`, `update`, `delete`, `clear` remain human-readable text output (no `--json`)

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

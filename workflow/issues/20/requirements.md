# Requirements: issue-20

## Original ask
add --json mode to output in json

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Which commands get `--json`? | `list` and `filter` only. | `list` and `filter` only |
| 2 | JSON object shape per todo? | Raw internal fields: full `id`, `title`, `state`, `createdAt` as epoch-ms number (no truncation/ISO formatting). | Same |
| 3 | Empty-result shape with `--json`? | Empty JSON array `[]` (instead of "No todos." / "No todos match..." text). | Same |
| 4 | Error handling under `--json`? | Unchanged — plain-text error to stderr, exit code 1 (no JSON error schema). | Same |
| 5 | Interactive mode + JSON formatting? | `--json` is CLI-only (not wired into `interactive.ts`). Output is pretty-printed with 2-space indent. | Same |

## Acceptance criteria
- [ ] `todo list --json` and `todo filter [name] [--state <state>] --json` support a `--json` flag
- [ ] `add`, `done`, `update`, `delete`, `clear` remain human-readable text output (no `--json`)
- [ ] `--json` emits each todo as `{ id, title, state, createdAt }` with raw internal values — full uuid `id`, epoch-ms number `createdAt` (no truncation, no ISO formatting)
- [ ] `--json` with no matching todos emits `[]`, not the human "no todos" sentence
- [ ] Validation errors (e.g. invalid `--state`) still throw and print plain text to stderr with exit code 1, unchanged by `--json`
- [ ] `--json` is not added to `interactive.ts` (`filter`/`list` handlers and help text unchanged there)
- [ ] JSON output is pretty-printed with 2-space indentation (`JSON.stringify(data, null, 2)`)

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

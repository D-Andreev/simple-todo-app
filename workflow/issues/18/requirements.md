# Requirements: issue-18

## Original ask
Add clear command. If no params passed delete all. If state passed (i.e.) done, clears all done todos.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should `clear` take state as a flag (`--state <state>`), matching `filter`, rather than a positional arg? | Yes — `--state done` clears done todos; no flag deletes everything else. | Yes |
| 2 | Should `clear` (no flag, deletes everything) prompt for confirmation, or delete immediately like `delete` does today? | No confirmation. | No confirmation |
| 3 | Success message format? | Use recommended format. | `Cleared N todo(s).` / `Cleared N done todo(s).`; `No todos to clear.` when count is zero |
| 4 | Should `clear` also be added to interactive mode, matching every other command? | Yes. | Yes |

## Acceptance criteria
- [ ] `todo clear --state <state>` deletes only todos in that state (validated to `pending`/`done`, same as `filter`)
- [ ] `todo clear` with no flag deletes all todos
- [ ] No confirmation prompt — executes immediately
- [ ] Output: `Cleared N todo(s).` (no state) / `Cleared N done todo(s).` (with `--state done`); `No todos to clear.` when nothing matched
- [ ] `clear` (with `--state` parsing) added to `interactive.ts` handlers and help text, mirroring `filter`

## Approved by human
- [x] Approved

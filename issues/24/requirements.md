# Requirements: issue-24

## Original ask
We can set a due date when creating actions and filter by due date.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should `--due <date>` be an optional flag on `todo add` (todos without one stay valid), using a date-only format like `YYYY-MM-DD`? | Yes — optional flag, `YYYY-MM-DD` | Yes |

## Acceptance criteria
- [ ] `todo add <title> --due YYYY-MM-DD` sets an optional due date on the new todo; `todo add <title>` (no flag) creates a todo with no due date, unchanged from today
- [ ] ...

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

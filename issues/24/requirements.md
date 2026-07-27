# Requirements: issue-24

## Original ask
We can set a due date when creating actions and filter by due date.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should `--due <date>` be an optional flag on `todo add` (todos without one stay valid), using a date-only format like `YYYY-MM-DD`? | Yes — optional flag, `YYYY-MM-DD` | Yes |
| 2 | For `todo filter --due <date>`, should it match the exact due date only, or should there also be a dedicated `--overdue` flag for pending todos whose due date has passed? | Yes to both — exact match via `--due`, plus a separate `--overdue` flag | Yes |

## Acceptance criteria
- [ ] `todo add <title> --due YYYY-MM-DD` sets an optional due date on the new todo; `todo add <title>` (no flag) creates a todo with no due date, unchanged from today
- [ ] `todo filter --due YYYY-MM-DD` matches todos whose due date equals that exact date (combinable with existing name/`--state` filters)
- [ ] `todo filter --overdue` matches pending todos whose due date is before today
- [ ] ...

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

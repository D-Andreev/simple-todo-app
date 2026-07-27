# Requirements: issue-24

## Original ask
We can set a due date when creating actions and filter by due date.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should `--due <date>` be an optional flag on `todo add` (todos without one stay valid), using a date-only format like `YYYY-MM-DD`? | Yes — optional flag, `YYYY-MM-DD` | Yes |
| 2 | For `todo filter --due <date>`, should it match the exact due date only, or should there also be a dedicated `--overdue` flag for pending todos whose due date has passed? | Yes to both — exact match via `--due`, plus a separate `--overdue` flag | Yes |
| 3 | Should due date show in `list`/`filter` output (text rows and JSON), and should it change the existing sort order (state → title → createdAt)? | Show in both; do not change sort order | Show in both; do not change sort order |
| 4 | Should `todo update` also support changing or clearing a due date after creation, or is that out of scope for this issue? | Out of scope for now | Out of scope for now |
| 5 | What should happen on a malformed/invalid `--due` value, and should past dates be allowed at creation? | Reject invalid dates with an error; allow past dates | Reject invalid dates with an error; allow past dates |

## Acceptance criteria
- [ ] `todo add <title> --due YYYY-MM-DD` sets an optional due date on the new todo; `todo add <title>` (no flag) creates a todo with no due date, unchanged from today
- [ ] `todo add <title> --due <invalid>` (wrong format or an invalid calendar date, e.g. `2026-13-40`) throws an error consistent with existing validation style (e.g. `Invalid due date. Expected format: YYYY-MM-DD`) and does not create the todo
- [ ] Due dates in the past are allowed at creation (no restriction)
- [ ] `todo filter --due YYYY-MM-DD` matches todos whose due date equals that exact date (combinable with existing name/`--state` filters)
- [ ] `todo filter --overdue` matches pending todos whose due date is before today
- [ ] `list`/`filter` text rows include the due date when set (e.g. `due: YYYY-MM-DD`), omitted when not set
- [ ] `list`/`filter` `--json` output includes a `dueDate` field (`YYYY-MM-DD` string or `null`) on each `Todo`
- [ ] Sort order is unchanged: state (pending, then done) → title case-insensitive → `createdAt`; due date is not a sort key

## Out of scope
- Changing or clearing a due date via `todo update` (may be a follow-up issue)

## Approved by human
- [ ] Pending — reply `approve requirements` when ready

# Language (issue-24, draft)

Terms below are proposed during clarify and merged into `workflow/PROJECT.md` `## Language` at implement. None are final until resolved with the human.

**Due date**: An optional `YYYY-MM-DD` date-only value on a `Todo`, set via `--due` on `todo add`, shown in `list`/`filter` text rows and as `dueDate` in `--json` output. Does not affect the existing state → title → `createdAt` sort order.
_Avoid_: Deadline, expiry, target date

**Overdue**: A pending todo whose due date is earlier than today, matched via `todo filter --overdue`.
_Avoid_: Late, expired

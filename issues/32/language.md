## Language

**Due-before filter**: `todo filter --due-before <date>` — matches todos whose `dueDate` is strictly earlier than `<date>` (exclusive boundary), regardless of `state`. Todos with no `dueDate` never match.
_Avoid_: `--before`, inclusive-of-boundary reading

**Due-after filter**: `todo filter --due-after <date>` — matches todos whose `dueDate` is strictly later than `<date>` (exclusive boundary), regardless of `state`. Todos with no `dueDate` never match.
_Avoid_: `--after`, inclusive-of-boundary reading

**Due-today filter**: `todo filter --due-today` — matches todos whose `dueDate` equals today's date, regardless of `state`. Todos with no `dueDate` never match. Combines (AND) with all other `filter` flags, including `--due-before`/`--due-after`, to form a range.
_Avoid_: `--today`, pending-only semantics (that's `--overdue`)

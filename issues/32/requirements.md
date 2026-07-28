# Requirements: issue-32

## Original ask
Add:
  • filter --due-before 2026-08-01
  • filter --due-after 2026-07-01
  • filter --due-today

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should `--due-before`/`--due-after` boundaries be exclusive or inclusive of the given date? | Exclusive — `--due-before <date>` means `dueDate < date`; `--due-after <date>` means `dueDate > date` | Exclusive (matches existing `isOverdue` strict `<` precedent) |

## Acceptance criteria
- [ ] `todo filter --due-before <date>` matches todos with `dueDate < date` (strict, exclusive)
- [ ] `todo filter --due-after <date>` matches todos with `dueDate > date` (strict, exclusive)

## Approved by human
- [ ] Pending — say `approve requirements` in the session when ready

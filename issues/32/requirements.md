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
| 2 | Do `--due-before`/`--due-after` combine with each other and with `--due`/`--overdue`/`--state`/`--priority`/name search, or should some combinations be rejected? | AND-combine with everything, no special-case rejection — nonsensical combos (e.g. `--due-after` later than `--due-before`) just return zero results | AND-combine with everything, matching existing precedent (no mutual-exclusivity checks anywhere today) |
| 3 | Should `--due-before`/`--due-after`/`--due-today` match regardless of `state`, or only `pending` todos (like `--overdue`)? | Regardless of state — same as `--due` today; `--state pending` can be AND'd on top if only pending is wanted | Match regardless of state, matching `--due` precedent |

## Acceptance criteria
- [ ] `todo filter --due-before <date>` matches todos with `dueDate < date` (strict, exclusive)
- [ ] `todo filter --due-after <date>` matches todos with `dueDate > date` (strict, exclusive)
- [ ] `--due-before`/`--due-after` AND-combine with each other (expressing a range) and with `--due`, `--overdue`, `--state`, `--priority`, and name search; no combination is rejected as invalid — contradictory ranges simply yield zero matches
- [ ] `--due-before`/`--due-after`/`--due-today` match todos of any `state` (not pending-only); combine with `--state pending`/`--state done` to narrow further

## Approved by human
- [ ] Pending — say `approve requirements` in the session when ready

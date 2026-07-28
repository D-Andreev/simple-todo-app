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
| 4 | Should todos with no due date (`dueDate: null`) be excluded from all three new filters? | Yes | Yes — mirrors existing `--due` behavior (`null` never matches) |
| 5 | Interactive mode's `filter` has its own regex arg parser that's missing `--priority` and `--json` wiring already (pre-existing gap, predates this issue). Add the three new flags to interactive only, or also fix the pre-existing gap? | Revised: also fix `--priority` and `--json` in interactive mode while adding the three new flags | Add the three new flags to interactive only; leave the pre-existing gap out of scope |

## Acceptance criteria
- [ ] `todo filter --due-before <date>` matches todos with `dueDate < date` (strict, exclusive)
- [ ] `todo filter --due-after <date>` matches todos with `dueDate > date` (strict, exclusive)
- [ ] `todo filter --due-today` matches todos with `dueDate` equal to today's date (same "today" as `--overdue` uses)
- [ ] `--due-before`/`--due-after`/`--due-today` each validate their date argument the same way `--due` does today (`YYYY-MM-DD`, real calendar date; same error message/pattern as existing `validateDueDate`) — `--due-today` takes no argument
- [ ] `--due-before`/`--due-after`/`--due-today` AND-combine with each other (expressing a range), and with `--due`, `--overdue`, `--state`, `--priority`, and name search; no combination is rejected as invalid — contradictory ranges simply yield zero matches
- [ ] Each of `--due-before`, `--due-after`, `--due-today` alone satisfies the "must provide at least one filter criterion" check on `filter`, same as `--due`/`--overdue`/`--priority`/`--state` do today
- [ ] `--due-before`/`--due-after`/`--due-today` match todos of any `state` (not pending-only); combine with `--state pending`/`--state done` to narrow further
- [ ] Todos with `dueDate: null` never match `--due-before`, `--due-after`, or `--due-today`
- [ ] `--json` output is unaffected (already returns full todo objects, no schema change needed)
- [ ] `filter`'s `--help` / command description mentions the new date-range options alongside the existing ones
- [ ] No-results messages for the new filters follow the existing per-condition style (e.g. distinct message when a date-range/`--due-today` filter yields zero matches)
- [ ] Interactive mode's `filter` command parses `--due-before <date>`, `--due-after <date>`, and `--due-today` (mirroring the existing `--due`/`--overdue`/`--state` regex parsing in `parseFilterArgs`) and passes them through to `handleFilter`, behaving identically to the one-shot CLI
- [ ] Interactive mode's `filter` command also parses `--priority <priority>` and wires it into `handleFilter` (fixes the pre-existing gap where priority filtering was never wired into interactive)
- [ ] Interactive mode's `filter` and `list` commands both parse a `--json` flag and pass it through to `handleFilter`/`handleList` (fixes the pre-existing gap where interactive had no `--json` support at all)
- [ ] Interactive mode's `help` text is updated to list `--priority`, `--json`, and the three new date-range flags on `filter` (and `--json` on `list`)

## Approved by human
- [x] Approved in session on 2026-07-28

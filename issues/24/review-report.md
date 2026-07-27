# Review Report

**Fresh-eyes:** judgments based on artifacts and diff only (`main...HEAD` on `workflow/issue-24`).

## Verdict
APPROVE WITH NOTES

## Scenario verification

### Scenarios verified

| # | Scenario | Method | Result | Notes |
|---|----------|--------|--------|-------|
| 1 | `todo add "Pay rent" --due 2026-08-01`, then `list` / `list --json` shows the date | code trace | pass | `handleAdd` validates then passes through to `storage.addTodo`; `formatTodoRow` appends ` due: ...`; `JSON.stringify(todos)` includes `dueDate` since it's now a `Todo` field. |
| 2 | `todo add "Bad date" --due 2026-02-30` errors, nothing persisted | code trace | pass | `isValidDueDate` re-derives the date via `Date.UTC` and checks the components round-trip, so `2026-02-30` (rolls to March) is correctly rejected; `handleAdd` validates before calling `storage.addTodo`. |
| 3 | `todo add "Old" --due 2020-01-01` succeeds | code trace | pass | No lower-bound check exists anywhere in `validateDueDate`/`isValidDueDate`. |
| 4 | `todo filter --overdue` returns only overdue-pending, excluding overdue-done, future-pending, no-due | code trace | pass | `isOverdue` requires `state === 'pending' && dueDate !== null && dueDate < today`; string comparison on `YYYY-MM-DD` is lexicographically correct for date ordering. |
| 5 | `todo filter "pay" --state pending --due 2026-08-01` combines filters | code trace | pass | `matches` filter combines `nameMatches && stateMatches && dueMatches && overdueMatches` — all four are independent, non-interfering predicates. |
| 6 | Interactive `add ... --due ...` / `filter --overdue` / `filter --due ...` | code trace | pass | `parseAddArgs`/`parseFilterArgs` strip each recognized flag from the raw line via regex + slice before taking the remainder as the name; traced through several orderings (flag-only, flag+name, multiple flags) without leftover fragments. |

### Requirements coverage
- [x] `--due` optional on `add`, no-flag path unchanged
- [x] Invalid `--due` throws `Invalid due date. Expected format: YYYY-MM-DD`, no todo created
- [x] Past due dates allowed
- [x] `filter --due` exact match, combinable with name/`--state`
- [x] `filter --overdue` — pending + due date before today
- [x] Due date in `list`/`filter` text rows when set, omitted otherwise
- [x] `--json` includes `dueDate` (string or `null`)
- [x] Sort order unchanged (due date not a sort key — `compareTodos` untouched)

### Issues found (from review)
- 🟡 Minor: `src/storage.ts` `getTodos()` does a raw `JSON.parse` with no per-record defaulting. A `todos.json` written by a pre-upgrade CLI (no `dueDate` key) will load with `dueDate: undefined`, not `null`. `formatTodoRow`/`isOverdue`/exact-match filtering all still behave correctly by coincidence (`undefined` is falsy / not `=== due`), but `--json` output for those legacy rows will omit the `dueDate` key entirely rather than emit `"dueDate": null` as the AC specifies. Not reachable in a fresh install or in any test fixture (all use the new shape), so it only affects upgraders with existing data on disk.
- 🟡 Minor: `handleFilter`'s no-match message picks one reason in priority order (name → state → overdue → due) via `if`/`else if`. A query combining `--state` with `--due`/`--overdue` that has zero matches always reports `No todos with state "X".`, silently dropping the due-date context from the message. Cosmetic only — matching logic itself is unaffected.

### Implement test results (cited, not re-run)
- `npm test` — 82/82 unit tests pass (21 new)
- `npm run test:e2e` — 53/53 e2e tests pass (12 new)
- `npm run build` — compiles cleanly (per implement-handoff.md)

### Gaps in test coverage
- No test exercises `--overdue` or `--due` combined with `--state` simultaneously returning zero matches (would have surfaced the message-priority note above).
- No test for a `todos.json` predating this change (missing `dueDate` key) to pin down the legacy-load behavior noted above.

### Tests/build in review
- **Not run** — review is diff + code reading only; implement phase owns execution.

## Principles review

### Summary
Change is scoped tightly to the approved requirements: a nullable `dueDate` field, format/calendar validation shared between `add` and `filter`, `--overdue` computed off a UTC-day string comparison, and output/interactive wiring mirrored from the existing `--state` pattern. No sort-order or unrelated-behavior changes. Style and structure match the rest of `commands.ts`/`interactive.ts` (regex-strip-and-slice arg parsing, `Invalid X. Expected format: ...` error convention).

### Critical (must fix)
- None.

### Suggestions (should consider)
- `src/storage.ts:24` (`getTodos`) — consider defaulting `dueDate: todo.dueDate ?? null` on load so legacy records without the key serialize as explicit `null` in `--json`, matching the AC literally rather than by accident.
- `src/commands.ts` `handleFilter` no-match branch — consider composing the message from all active filters (or a generic "No todos match the given filters.") instead of first-match priority, so combined `--state`+`--due`/`--overdue` failures aren't misreported as state-only.

### Nice to have
- `isOverdue`'s `dueDate !== null` guard works only because the later `<` comparison against `undefined` happens to be falsy; `!todo.dueDate` would express "no due date" more directly and not depend on that coincidence.

### Scenario overlap avoided
- Did not re-run or re-verify the pre-existing `--state`/name filter, `--json`, or sort-order behaviors beyond confirming due-date logic composes with them via independent boolean predicates — implement's test suite already covers those paths and this diff doesn't touch `compareTodos` or the pre-existing filter predicates.

### Principles applied
- Security: no new I/O, network, or shell surface; date parsing is local and bounded (fixed regex + `Date.UTC` round-trip, no external date libraries or eval-like parsing).
- Design/maintainability: validation and "what counts as overdue" logic centralized in two small functions (`validateDueDate`, `isOverdue`) rather than duplicated at each call site.
- Conventions: follows existing error-message convention (`Invalid X. Expected format: ...`), existing arg-parsing convention in `interactive.ts` (regex match + slice remainder), and updates `workflow/PROJECT.md` language per repo convention.

## Recommendation
Shippable as-is. Two non-blocking notes (legacy-data `--json` null vs. missing key; combined-filter no-match message wording) worth a follow-up but neither blocks merge nor risks data loss or incorrect matching for any tested path.

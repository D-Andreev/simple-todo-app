# Review Report

**Fresh-eyes:** judgments based on artifacts and diff only (`main...HEAD` on `workflow/issue-30`, PR [#31](https://github.com/D-Andreev/simple-todo-app/pull/31)).

## Verdict
APPROVE WITH NOTES

## Scenario verification

### Scenarios verified

| # | Scenario | Method | Result | Notes |
|---|----------|--------|--------|-------|
| 1 | `add --priority high` → shown in `list` text and `--json` | code trace | pass | `formatTodoRow` appends `priority: <value>` unconditionally; JSON path returns full `Todo` including `priority` |
| 2 | `add --priority nope` → errors, exit 1, no todo created | code trace | pass | `validatePriority` throws before `storage.addTodo` is called in `handleAdd` |
| 3 | `filter --priority mid` standalone, and AND'd with `--state`/`--due`/`--overdue`/name | code trace | pass | `priority` added to the "must provide a criterion" check and ANDed into the filter predicate alongside the existing criteria |
| 4 | `filter --priority nope` → same error shape as `--state nope` | code trace | pass | `validatePriority` reuses the same message pattern (`Invalid priority. Valid values: ...`) as `validateDueDate`/state check |
| 5 | Legacy `todos.json` entry with no `priority` → `list`/`export` show/export `mid` | code trace | pass | `normalizePriority` runs inside `storage.getTodos()`, so every read path (list, filter, export, findTodoById) picks it up |
| 6 | `export \| import` round-trip with mixed priorities; invalid import priority skipped, not full-import abort | code trace | pass | `isValidImportEntry` rejects only an explicitly-invalid `priority`, not a missing one; `handleImport` defaults a missing one to `mid` before storing |

### Requirements coverage
- [x] `add --priority <low|mid|high>` optional, defaults to `mid`
- [x] Invalid `--priority` on `add` errors with valid-values list, `--state`-like pattern
- [x] `list`/`filter` sort order (`state → title → createdAt`) unaffected — `compareTodos` untouched by this diff
- [x] Priority shown in text rows and `--json`
- [x] `filter --priority` standalone + AND'd with `--state`/`--due`/`--overdue`/name
- [x] Invalid `--priority` on `filter` errors like `--state`
- [x] No `--priority` on `update` — confirmed, `handleUpdate`/`updateTodoTitle` untouched
- [x] Legacy/imported todo with no `priority` treated as `mid`, not an import failure, not null/unset
- [x] `export` includes `priority`; export/import round-trips it

### Implement test results (cited, not re-run)
- `npm test` — 119/119 passing
- `npm run test:e2e` — 81/81 passing
- `npm run build` — clean
- (per `implement-handoff.md`; not re-executed during this review)

### Gaps in test coverage
- No test for an import entry with an explicit `priority: null` (as opposed to a missing field or an invalid string). Behavior by code trace: `isValidImportEntry` treats `null !== undefined` as true, then `isValidPriority(null)` is false, so the entry is rejected as invalid — a defensible reading of "not null/unset" from AC #9, but untested and worth a one-line test if it matters.
- No combined `interactive` mode test for `add`/`filter` with `--due` and `--priority` given together (only individually), though the `parseAddArgs`/`parseFilterArgs` extraction logic (index-based slice per flag) is order-independent by code trace.

### Tests/build in review
- **Not run** — review is diff + code reading only; implement phase owns execution.

## Principles review

### Summary
Implementation is a clean, minimal extension of the existing `dueDate`/`state` patterns — validation, formatting, filtering, and import handling for `priority` all mirror an established sibling feature rather than inventing new shapes. All ten acceptance criteria are met and covered by both unit and e2e tests. One small, pre-existing-pattern UX nit in the filter "no match" message ordering; nothing blocking.

### Critical (must fix)
- None.

### Suggestions (should consider)
- `src/commands.ts:159-176` (`handleFilter` no-match messages): when both `--state` and `--priority` are given with no matches, the state-specific message wins over the priority one (state check comes first in the `if` chain) — the priority message is currently unreachable in a combined `--state`+`--priority` no-match case. This mirrors a pre-existing gap for `--state`+`--due` (the code already had this shape before this diff), so it's not a regression this PR needs to fix, but it's a chance to note for a future cleanup of that cascade.
- `src/storage.ts:21-23` (`normalizePriority`): uses a truthy check (`todo.priority ? todo : ...`) rather than `=== undefined`. Functionally fine for real-world legacy data (missing field), but an explicit falsy-but-present value (e.g. `priority: ''`) would also silently become `mid` rather than surfacing as corrupt data. Low risk given `Priority` is a closed string union and nothing else in the codebase writes an empty string here.

### Nice to have
- Could add a unit test for `priority: null` on import, matching the explicit-null edge case called out above.

### Scenario overlap avoided
- Did not re-run `npm test`/`npm run test:e2e`/`npm run build` — cited implement-handoff results (119/119 unit, 81/81 e2e, clean build) instead of re-verifying by execution, per review policy.

### Principles applied
- Consistency: new `priority` validation/formatting/filtering code follows the exact shape of the existing `dueDate`/`state` handling (same validator style, same error message format, same AND-composition in the filter predicate).
- Backward compatibility: `normalizePriority` at the `getTodos()` read boundary means every downstream consumer (list, filter, export, find-by-id) gets a normalized `Todo` for free — no scattered `?? 'mid'` checks needed elsewhere.
- Scope discipline: no `--priority` on `update`, matching the approved requirements' explicit "out of scope" answer; no sort-order changes.

## Recommendation
Shippable as-is. The two notes above are non-blocking (one is a pre-existing pattern this PR didn't introduce, the other a low-risk edge case); merge readiness is high.

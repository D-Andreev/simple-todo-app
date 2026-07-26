# Review Report

**Fresh-eyes:** judgments based on artifacts and diff only (`main...HEAD` on `workflow/issue-22`).

## Verdict
APPROVE WITH NOTES

## Scenario verification

### Scenarios verified

| # | Scenario | Method | Result | Notes |
|---|----------|--------|--------|-------|
| 1 | `todo list` with mixed pending/done and titles differing only by case | code trace | pass | `compareTodos` in `src/commands.ts` groups by `state` (pending < done) first, then compares lowercased titles; covered by `tests/commands.test.ts` ("groups pending todos before done todos", "sorts by title within a state group") |
| 2 | `todo filter <name> --json` with matches spanning both states | code trace | pass | `handleFilter` sorts with the same `compareTodos` before the `--json` branch, so JSON and text share one order; covered by "with json=true, matches are grouped and sorted the same as the text output" |
| 3 | Two todos with identical case-insensitive titles, different `createdAt` | code trace | pass | `compareTodos` falls through to `a.createdAt - b.createdAt` only when lowercased titles are equal; covered by "breaks ties between identical case-insensitive titles by createdAt ascending" using `storage.saveTodos` to control exact `createdAt` values |
| 4 | `todo interactive` → `list`/`filter` sees the same ordering | code trace | pass | `src/interactive.ts` and `src/index.ts` are unchanged in this diff and call `commands.handleList`/`commands.handleFilter` directly with no intermediate sort — same code path as one-shot CLI, so ordering is structurally identical |

### Requirements coverage
- [x] Groups by state, pending first, then done
- [x] Title sort case-insensitive ascending within group
- [x] `createdAt` ascending tiebreaker for identical case-insensitive titles
- [x] No `--sort`/`--group` flag or escape hatch (confirmed: no new CLI options added, `index.ts` untouched)
- [x] Applies to `todo filter`
- [x] Applies to `interactive` mode (via shared handler, no interactive-specific test added — see gap below)
- [x] Applies to `--json` output on both `list` and `filter`
- [x] `Todo` shape unchanged (`storage.ts` untouched, confirmed via diff)

### Issues found (from review)
- None critical.

### Implement test results (cited, not re-run)
- `npm test` — 62/62 passing
- `npm run build` — clean
- `npm run test:e2e` — 41/41 passing

### Gaps in test coverage
- 🟡 No interactive-mode e2e test exercises the new grouping/sort with multiple todos across states — the existing `interactive mode` e2e tests (unchanged in this diff) use single-todo or already-sorted fixtures, so the ordering there is verified structurally (identical delegation to `commands.handleList`/`handleFilter`), not by an interactive-specific assertion. Low risk given the delegation is a one-line call with no wrapper logic, but the implement-handoff's "verified via e2e interactive tests" slightly overstates what's actually asserted.

### Tests/build in review
- **Not run** — review is diff + code reading only; implement phase owns execution.

## Principles review

### Summary
The change is a small, well-contained comparator (`compareTodos`) reused identically by `handleList` and `handleFilter`, placed ahead of the `--json` branch so both output modes share one order. No changes to storage, the `Todo` shape, or the CLI surface, matching the "unconditional default, no escape hatch" requirement. Tests were rewritten (not just appended) where the old `createdAt`-only assumption no longer held, which is the right move for an unconditional default.

### Critical (must fix)
- None.

### Suggestions (should consider)
- Consider adding one interactive-mode e2e test with mixed pending/done + varied titles, purely to close the coverage gap noted above (`tests/e2e/cli.e2e.test.ts:351` describe block) — not blocking given the direct delegation.

### Nice to have
- README's `list` example output (`README.md:40-49`) already happens to match the new ordering (pending alphabetical, then done) but was not updated to describe *why* — a one-line mention of the grouping/sort rule would help future readers, though it's outside this issue's AC.

### Scenario overlap avoided
- Did not re-run `npm test`/`npm run build`/`npm run test:e2e`; cited implement-handoff's 62 unit + 41 e2e results above instead of re-verifying pass/fail by execution.

### Principles applied
- Security: no new I/O, parsing, or external input surface; comparator only reads existing `Todo` fields.
- Design/maintainability: single comparator function eliminates duplicate sort logic between `handleList` and `handleFilter`; no new flags/branches added, consistent with "no escape hatch."
- Conventions: matches existing style in `src/commands.ts` (small exported handler functions, no classes); test naming/structure matches surrounding `tests/commands.test.ts` conventions.

## Recommendation
Shippable as-is; the one coverage gap (interactive-mode ordering asserted structurally rather than by a dedicated e2e test) is low-risk and non-blocking.

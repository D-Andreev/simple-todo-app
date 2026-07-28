# Review Report

**Fresh-eyes:** judgments based on artifacts and diff only (`origin/main...HEAD` on `workflow/issue-32`).

## Verdict
APPROVE WITH NOTES

## Scenario verification

### Scenarios verified

| # | Scenario | Method | Result | Notes |
|---|----------|--------|--------|-------|
| 1 | `filter --due-before X --due-after Y` range, mixed in/out-of-range/null-due-date todos, one-shot + interactive | code trace | pass | `handleFilter` ANDs `dueBeforeMatches`/`dueAfterMatches`, both guard `todo.dueDate !== null`; interactive `parseFilterArgs` extracts `--due-before`/`--due-after` before the bare `--due` regex so there's no substring collision |
| 2 | `--due-today` boundary, same "today" as `--overdue` | code trace | pass | Both use the same local-time `getTodayDateString()` helper — no divergence introduced |
| 3 | `interactive filter --priority high --json` / `list --json` parity with one-shot CLI | code trace | pass | `handleFilter`/`handleList` positional/param order matches exactly between `src/index.ts` and `src/interactive.ts`; `--priority` was already wired pre-existing (confirmed via `origin/main` diff of `interactive.ts`), this PR only adds `--json` wiring, matching the ADR's stated scope |
| 4 | Contradictory range (`--due-after` later than `--due-before`) → zero results, no error | code trace | pass | Only a name/comparison mismatch, never throws; distinct message `No todos due after "X" and before "Y".` |
| 5 | `filter --due-before nope` → same invalid-date error as `--due` | code trace | pass | Reuses `validateDueDate`, identical error string |

### Requirements coverage
- [x] All 14 acceptance criteria in `requirements.md` map to a corresponding diff hunk in `commands.ts`/`index.ts`/`interactive.ts`; no gaps found by inspection.
- [x] `dueDate: null` exclusion verified for all three new filters (`todo.dueDate !== null &&` guard on each).
- [x] "At least one filter criterion" check extended to include the three new flags.

### Issues found (from review)
- 🟡 Minor: see Principles review below (zero-result message precedence).

### Implement test results (cited, not re-run)
- `npm test`: 134 passed, 0 failed (108 pre-existing/adjacent + 26 new `handleFilter` cases)
- `npm run test:e2e`: 95 passed, 0 failed
- `npm run build`: clean, no type errors
- Manual smoke test against a real `~/.simple-todo/todos.json` per implement-handoff

### Gaps in test coverage
- None blocking. The "combine with existing filters" test only exercises `--state`/`--priority` alongside the new range flags, not `--overdue` alongside them — low risk since `overdueMatches` is a simple boolean AND with no new interaction surface.

### Tests/build in review
- **Not run** — review is diff + code reading only; implement phase owns execution.

## Principles review

### Summary
Clean, minimal diff that follows every existing convention in the file: same validation helper (`validateDueDate`), same null-exclusion precedent as `--due`, same AND-combination style, same positional-parameter pattern threaded consistently through `commands.ts` → `index.ts` → `interactive.ts`. The interactive regex parser correctly orders `--due-before`/`--due-after`/`--due-today` extraction before the bare `--due` pattern, avoiding an easy substring-collision bug. Scope creep (interactive `--json`) was deliberately re-scoped in by clarify's Q5 revision and is documented in a new ADR rather than snuck in silently.

### Critical (must fix)
- None.

### Suggestions (should consider)
- `src/commands.ts:191-219` — the zero-match message cascade picks one hard-coded reason in a fixed priority order (name+state → name → state → priority → overdue → due-today → before+after → before → after → due). Adding three more filters to this chain means a query like `--priority high --due-today` with zero matches reports `No todos with priority "high".`, silently omitting that `--due-today` also mattered. This is an extension of a pre-existing pattern (not a new defect class), but it's now one flag more likely to mislead — worth a follow-up to compose the reasons instead of picking one.

### Nice to have
- `tests/commands.test.ts` — the test titled `"with json=true, --due-before/--due-after/--due-today filter and include dueDate field"` (around line 830) only actually exercises `dueToday`; title implies all three are covered by that one case.

### Scenario overlap avoided
- Did not re-run `npm test`/`npm run test:e2e`/`npm run build` — cited implement-handoff's 134/95 passing counts and build status directly per review policy.

### Principles applied
- Reused existing `validateDueDate`/`getTodayDateString`/null-exclusion precedent instead of introducing parallel logic.
- Checked interactive/one-shot parameter-order parity by hand (a common source of "works in one mode, silently misparses in the other" bugs) — found no mismatch.
- Verified the ADR's factual claim ("`--priority` already wired by #30/#31") against `origin/main`'s actual `interactive.ts`, rather than taking the handoff's word for it.

## Recommendation
Shippable as-is. One non-blocking message-precedence note for a future cleanup; no must-fix issues found in the diff.

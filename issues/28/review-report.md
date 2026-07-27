# Review Report

**Fresh-eyes:** judgments based on artifacts and diff only (`main...HEAD` on `workflow/issue-28`).

## Verdict
APPROVE WITH NOTES

## Scenario verification

### Scenarios verified

| # | Scenario | Method | Result | Notes |
|---|----------|--------|--------|-------|
| 1 | `todo export` (no flags) prints full todos array as JSON to stdout | code trace | pass | `handleExport` returns `JSON.stringify(todos, null, 2)` when no `filePath`; wired straight to `console.log` in `index.ts`. |
| 2 | `todo export --file <path>` writes JSON to path instead of stdout | code trace | pass | `writeTodosToFile` (`storage.ts`) via `fs.writeFileSync`; confirmation message includes count + path. |
| 3 | `todo import` merges by default; `id`-collision skips existing-wins | code trace | pass | `existingIds` Set seeded from current storage; collision → skip, no overwrite; also correctly dedupes collisions *within* the same import batch since `existingIds` is updated per accepted entry. |
| 4 | `todo import --replace` wholesale replaces | code trace | pass | Bypasses merge branch entirely; `storage.saveTodos(valid)`; collision count hardcoded to 0 as designed. |
| 5 | `todo import` (no flags) reads stdin; `--file <path>` reads file | code trace | pass | `readStdinText` (`fs.readFileSync(0)`) vs `readTextFile`, selected by presence of `filePath`. |
| 6 | `todo export \| todo import` round-trips without flags | code trace + e2e cited | pass | Re-imported entries collide on `id` with themselves → all reported as collision-skips, no duplication. Matches e2e `round-trips` test. |
| 7 | Non-array top-level payload aborts entirely, no partial writes | code trace | pass | `Array.isArray` check happens before any `saveTodos` call, in both merge and replace paths — no todos written on abort. |
| 8 | Per-entry validation (fields/types/`state`/`dueDate`), invalid entries skipped + counted separately from collisions | code trace | pass | `isValidImportEntry` checks `id`/`title` (string, non-empty), `state` enum, `createdAt` (finite number), `dueDate` (`null` or valid calendar date via existing `isValidDueDate`). Separate `skippedInvalid` counter, independent of `skippedCollision`. |
| 9 | Missing/malformed `id` never auto-generated — always invalid | code trace | pass | `isValidImportEntry` rejects non-string/empty `id` before any id-based logic runs; no `uuidv4()` call anywhere in the import path. |
| 10 | Import reports imported / collision-skipped / invalid-skipped counts | code trace | pass | Single consistent message format built in both merge and replace branches. |
| 11 | `export`/`import` intentionally absent from `interactive` mode | code trace | pass | `interactive.ts`'s `handlers` map and `HELP_TEXT` are untouched by this diff (confirmed via `git diff --stat`) — no `export`/`import` entries added; avoids stdin contention with the REPL's own `readline` reader, as called out in implement-handoff design notes. |

### Requirements coverage
- [x] All 12 acceptance criteria in `requirements.md` map 1:1 to the scenarios above — verified against diff, none gapped.

### Issues found (from review)
- 🟡 Minor: import doesn't `.trim()` the `title` field the way `handleAdd` does (`storage.ts:48`, `addTodo` trims; `commands.ts` `isValidImportEntry`/`handleImport` does not) — an imported todo with leading/trailing whitespace in its title is stored as-is. Not covered by any acceptance criterion; only affects display/sort spacing, not correctness of any AC.

### Implement test results (cited, not re-run)
- `npm test` — 100/100 passing (per `implement-handoff.md`)
- `npm run test:e2e` — 67/67 passing, including 10 new export/import scenarios
- `npm run build` — clean, no type errors

### Gaps in test coverage
- No test exercises `import --file <path>` pointed at a non-existent file (uncaught `ENOENT` bubbles up through the existing try/catch in `index.ts` → `process.exit(1)` with a Node-style stack-free error message rather than a friendly one). Behavior is correct (non-zero exit, no partial write) but the error text isn't the domain-specific "Invalid import data" wording used elsewhere — cosmetic only, not a blocker.
- No test covers whitespace-only or leading/trailing-whitespace titles on import (relates to the minor finding above).

### Tests/build in review
- **Not run** — review is diff + code reading only; implement phase owns execution.

## Principles review

### Summary
Small, focused diff that does exactly what the approved spec asks: `export`/`import` follow the same handler → CLI-wiring → try/catch/exit(1) pattern as every other command, storage helpers stay thin and trusting (validation lives in `commands.ts`, mirroring the existing `--due` pattern), and the decision to leave `interactive` mode alone is sound and explicitly justified. Test coverage (unit + e2e) closely tracks the acceptance criteria, including the trickier edge cases (non-array top-level, malformed JSON, mixed valid/invalid/colliding entries).

### Critical (must fix)
- None.

### Suggestions (should consider)
- Trim `title` on import the same way `addTodo` does, for consistency with the rest of the app's todo-creation path (`src/commands.ts` `isValidImportEntry`/`handleImport`).

### Nice to have
- A friendlier error message for a missing `--file` path on import (currently a raw `ENOENT`-derived message rather than the `Invalid import data: ...` phrasing used for the other import failure modes).

### Scenario overlap avoided
- Did not re-derive or re-run the 10 e2e / 7 unit export-import test cases already enumerated in `implement-handoff.md`; cited their pass/fail status directly and traced the same code paths by reading rather than executing.

### Principles applied
- Security: `--file` is a locally-supplied CLI flag read/written with the invoking user's own privileges — same trust boundary as the shell itself, not a boundary-crossing input; no injection surface (JSON.parse, no `eval`/exec).
- Design/maintainability: import validation logic co-located with the one existing due-date validator it reuses (`isValidDueDate`), avoiding duplicate date-parsing logic.
- Conventions: new commands match existing command shape (`handleX` in `commands.ts`, thin `index.ts` wiring, try/catch → `process.exit(1)`), no deviation from established patterns in this codebase.

## Recommendation
Shippable as-is; the two notes above are cosmetic/consistency polish, not corrections — merge whenever the human is happy with a local smoke test.

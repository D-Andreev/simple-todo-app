# Review Report

**Fresh-eyes:** judgments based on artifacts and diff only (`main...HEAD` on `workflow/issue-34`).

## Verdict
REQUEST CHANGES

## Scenario verification

### Scenarios verified

| # | Scenario | Method | Result | Notes |
|---|----------|--------|--------|-------|
| 1 | `todo add "Fix bug" --tag "backend" --tag Backend --tag "  urgent  "` (one-shot CLI) → stored `['backend', 'urgent']` | code trace | pass | `normalizeTag`/`normalizeTags` trims, lowercases, dedupes via `Set` (order-preserving); commander passes each `--tag` value through unmodified from argv, so shell-quoted multi-word values reach `handleAdd` intact. |
| 2 | `todo add "No tags"` then `todo list` → no `tags:` suffix | code trace | pass | `formatTodoRow` only appends the suffix when `tags.length > 0`. |
| 3 | `todo filter --tag backend` combined with `--state done` → AND logic | code trace | pass | `tagMatches` is ANDed with all other filter predicates identically to existing filters. |
| 4 | Import payload with one entry `tags: "oops"` (string, not array) → whole import throws, nothing written | code trace + manual regex/logic check | pass | `validateImportTags` runs before `isValidImportEntry` for every entry and throws synchronously, before the `valid[]` array is ever passed to `storage.saveTodos`. |
| 5 | Import payload with an entry missing `tags` entirely → imported with `tags: []` | code trace | pass | `entry.tags ?? []` on the valid-entry push path. |
| 6 | `todo add "Bad" --tag "   "` → validation error, no todo created | code trace | pass | `normalizeTag` throws `Tag cannot be empty` before `storage.addTodo` is called. |
| 7 (added) | Interactive REPL: `add Buy milk --tag in progress` (tag value has an internal space) | manual trace, confirmed with a standalone regex check | **fail** | See Critical finding F1 — `parseAddArgs`'s `--tag` regex only captures a single whitespace-delimited token, silently truncating the tag and leaking the remainder into the title. |

### Requirements coverage
- [x] Free-form tags, no registry — met
- [x] `tags: string[]`, zero or more — met
- [x] Repeatable `--tag` on `add` — met for one-shot CLI; **not fully met for interactive mode** (F1)
- [x] `filter --tag`, case-insensitive, AND-combined — met
- [x] `tags:` suffix in text rows, omitted when empty, no `--json` special-casing — met
- [x] Tag mutation on existing todos out of scope — correctly not implemented
- [x] Empty/whitespace-only tag rejected — met (`add`); import rejects non-string/empty array elements too
- [x] Case-insensitive dedup on `add` — met
- [x] `getTodos()` normalizes missing `tags` to `[]` — met
- [x] Malformed `tags` on import aborts the whole call (deviation) — met, matches ADR-0034
- [x] No charset restriction, incl. internal spaces — met for one-shot CLI and direct `handleAdd` calls; **not met for the interactive REPL** (F1)

### Issues found (from review)
- 🔴 Critical: Interactive REPL cannot accept a tag value containing an internal space — see F1.
- 🟡 Minor: broken ADR cross-reference in `workflow/PROJECT.md` — see F2.

### Implement test results (cited, not re-run)
- `npx tsc --noEmit` — clean (per implement-handoff).
- `npx jest` — 154/154 passed (per implement-handoff).
- `npm run build && npx jest --config jest.e2e.config.js` — 102/102 passed (per implement-handoff).

### Gaps in test coverage
- No e2e/unit test exercises the interactive REPL's `add`/`filter` `--tag` parsing with a multi-word tag value — the only "internal spaces" test (`tests/commands.test.ts`) calls `handleAdd` directly, bypassing `parseAddArgs`'s regex entirely, so the interactive-mode regression (F1) went undetected.
- Imported tags are stored exactly as provided (untrimmed/uncased) — intentional per the `imports a valid tags array as-is` test name, but worth a note (see Nice to have).

### Tests/build in review
- **Not run** — review is diff + code reading only; implement phase owns execution.

## Principles review

### Summary
The one-shot CLI, filter, storage-normalization, and import-abort-deviation pieces are all solid and match the approved requirements and ADR-0034 closely. The interactive REPL's `--tag` argument parsing, however, reuses a single-token regex (`\S+`) that cannot represent the "no charset restriction, including internal spaces" requirement — a silent correctness bug rather than a rejected/validated input, in a mode the app documents and tests elsewhere.

### Critical (must fix)
- `src/interactive.ts:24-26` (`parseAddArgs`) and `src/interactive.ts:82-86` (`parseFilterArgs`): `--tag` values are captured via `/--tag\s+(\S+)/g`, which stops at the first whitespace. Confirmed with a standalone trace: `"Buy milk --tag in progress"` → tag `"in"`, with `"progress"` silently merged back into the title (`"Buy milk  progress"`). This contradicts the approved AC that tag values allow internal spaces, and fails silently (no error) rather than rejecting the input — a user has no way to know their tag or title is wrong. Needs a parser that captures up to the next recognized `--flag` token (or a quote-aware tokenizer), matching what the one-shot CLI already gets for free from `commander`/argv.

### Suggestions (should consider)
- `workflow/PROJECT.md`'s new "Malformed tags (import)" entry (F2) links to `docs/adr/0001-tags-import-abort.md`; the actual file created by this PR is `docs/adr/0034-tags-import-abort.md`. Fix the reference so the doc link resolves.

### Nice to have
- Imported `tags` are stored exactly as given (no trim/lowercase), unlike tags added via `--tag`, which are always normalized. This is intentionally tested (`imports a valid tags array as-is`) and not contradicted by any approved AC, but it means an imported tag like `" Work "` will never match `filter --tag work` (comparison lowercases but doesn't trim). Worth a follow-up decision on whether import should normalize for consistency with the "Tag" language definition ("lowercased and trimmed for consistency").

### Scenario overlap avoided
- Did not re-verify one-shot CLI `--tag` repeatability/dedup/empty-rejection or the `filter --tag` match/no-match paths beyond a single trace each — implement-handoff's 154+102 test results are accepted for those paths (scenarios 1-6 above).

### Principles applied
- Security: no new attack surface (local CLI, no network/PII); import validation still runs before any write, consistent with existing `isValidImportEntry` gating.
- Design/maintainability: `normalizeTag`/`normalizeTags` mirror the existing `normalizePriority` pattern; `isValidTagsArray`/`validateImportTags` are appropriately scoped, single-purpose functions.
- Conventions: naming, option wiring in `index.ts`, and `formatTodoRow` suffix ordering (due before tags) all follow established patterns in the file.

## Recommendation
Not yet mergeable as-is: the interactive-mode tag parsing bug (F1) silently corrupts user input in a supported, tested mode and directly contradicts an approved acceptance criterion. Low risk otherwise — the one-shot CLI, filter, storage, and import-abort behavior all check out. Fix F1 (and ideally F2's dead link) and this should be a quick re-review.

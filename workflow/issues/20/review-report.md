# Review Report

**Fresh-eyes:** judgments based on artifacts and diff only (`origin/main...HEAD` on `workflow/issue-20`).

## Verdict
APPROVE

## Scenario verification

### Scenarios tested

| # | Scenario | Method | Result | Notes |
|---|----------|--------|--------|-------|
| 1 | `list --json` with 0, 1, 2 todos | test + manual | pass | Sort order preserved; `[]` for empty; raw uuid + epoch-ms `createdAt` |
| 2 | `filter <name> --json` with matches / no matches | test + manual | pass | `[]` on no match, raw objects on match |
| 3 | `filter --state <state> --json` with/without name | test + manual | pass | Combines correctly with existing filter logic |
| 4 | `filter --state bogus --json` | test + manual | pass | Still throws `Invalid state...`, plain text to stderr, exit 1, no JSON error shape |
| 5 | `interactive.ts` diff + e2e suite | manual (read diff) | pass | Zero changes to `interactive.ts`; no `--json` wiring; help text unchanged |
| 6 | `add`/`done`/`update`/`delete`/`clear` output unchanged | manual (read diff + `--help`) | pass | No `--json` option added; handler bodies untouched |
| 7 | `list --json \| jq '...'` scripting use case from the issue | manual | pass | Works as described in the original ask |

### Requirements coverage
- [x] `list`/`filter` support `--json`
- [x] `add`/`done`/`update`/`delete`/`clear` remain human-readable, no `--json`
- [x] Raw internal fields — full uuid `id`, epoch-ms `createdAt`, no truncation/ISO
- [x] Empty/no-match `--json` → `[]`
- [x] Validation errors unchanged — plain text, exit 1
- [x] `interactive.ts` untouched
- [x] Pretty-printed with 2-space indent (`JSON.stringify(data, null, 2)`)

### Issues found (from testing)
None.

### Gaps in test coverage
None material — unit + e2e cover shape, empty case, error-under-json, and the negative check that other commands lack `--json`.

### Test/build execution
- **Run:** yes — diff includes application code (`src/commands.ts`, `src/index.ts`) and tests.
- `npm test`: **56/56 passed**
- `npm run build && npm run test:e2e`: **39/39 passed**
- Manual smoke test (fresh `HOME`): `list --json`, `list --json | jq`, `filter --json` (match/no-match), `filter --state bogus --json` (exit 1, plain text), `add --help` (no `--json`), interactive `help` (unchanged) — all matched expected behavior.

## Principles review

### Summary
Small, well-scoped change. The `json` param is threaded through cleanly, sorting was consolidated to run once before the json/text branch (a minor simplification over the prior duplicate `.sort()` calls), and the PR correctly leaves `interactive.ts` and all other commands untouched per the approved requirements.

### Critical (must fix)
None.

### Suggestions (should consider)
None.

### Nice to have
None.

### Scenario overlap avoided
Did not re-run passed scenarios beyond confirming the reported counts (56 unit / 39 e2e) still hold after a fresh `npm ci`; added one round of manual CLI smoke testing on top of the existing suite rather than duplicating it.

### Principles applied
- Security: no user-controlled input reaches `JSON.stringify`/eval paths differently than the existing text-formatting path; no new attack surface.
- Design/maintainability: `json` boolean param mirrors the existing `state` optional-param style in the same functions; no new abstraction introduced for a two-command feature.
- Conventions: matches existing commander `.option()` / try-catch-exit(1) pattern in `src/index.ts`.

## Recommendation
Ready to merge — requirements fully met, tests pass, no blocking or non-blocking issues found.

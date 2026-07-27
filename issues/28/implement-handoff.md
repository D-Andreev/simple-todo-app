# Implement Handoff: issue-28

## Summary

Added `todo export` and `todo import` per the approved requirements — export prints/writes the stored todos as JSON, import reads a JSON array from stdin/file and merges (default, skip on `id` collision) or replaces (`--replace`) the existing list, with per-entry validation and a hard abort when the top-level payload isn't an array.

## Branch

`workflow/issue-28` (from `main`) — draft PR: https://github.com/D-Andreev/simple-todo-app/pull/29

## Changes

- `src/storage.ts` — added `writeTodosToFile(filePath, todos)`, `readTextFile(filePath)`, `readStdinText()` file-I/O helpers (fd-0 synchronous stdin read).
- `src/commands.ts` — added `handleExport(filePath?)` and `handleImport(filePath?, replace?)`, plus an internal `isValidImportEntry` validator reusing the existing `isValidDueDate` check.
- `src/index.ts` — added `export` (`--file`) and `import` (`--file`, `--replace`) CLI commands, following the existing try/catch + `process.exit(1)` pattern.
- `README.md` — documented both commands.
- `workflow/PROJECT.md` — merged `language.md` entries (Export, Import, Merge, Replace, Invalid entry) into `## Language`.
- No `docs/adr/` — no ADR was produced for this issue.

### Design notes / decisions

- **Not wired into `interactive` mode.** Reading stdin for `import` while the REPL is itself reading commands from stdin via `readline` doesn't compose — running `import` inside `interactive` would consume/contend for the same stream. The approved requirements and clarify Q&A never mention interactive mode for this feature, so it was intentionally left CLI-only.
- **`readStdinText` uses `fs.readFileSync(0, 'utf-8')`** (synchronous fd-0 read) rather than an async readline collector, to keep `handleImport` synchronous and consistent with every other command handler in `commands.ts`.
- **Validation lives in `commands.ts`**, not `storage.ts`, mirroring how `--due` validation already works — `storage.ts` stays a thin, trusting persistence layer.
- **Import counts are always reported as `imported / skipped (id collision) / skipped (invalid)`**, even in `--replace` mode (collision count is always 0 there), for a single consistent output format.

## TDD cycles

1. **Red** — added unit tests for `storage.writeTodosToFile` / `readTextFile` (`tests/storage.test.ts`) and for `commands.handleExport` / `handleImport` (`tests/commands.test.ts`); confirmed compile failures (`TS2339: Property 'handleExport' does not exist`, etc.) with `npx jest tests/commands.test.ts tests/storage.test.ts`.
2. **Green** — implemented the storage helpers and command handlers; re-ran the same suites to green (100/100).
3. **Red → Green (CLI wiring)** — added e2e tests in `tests/e2e/cli.e2e.test.ts` (stdout/stdin defaults, `--file`, `--replace`, round-trip, abort-on-non-array, abort-on-malformed-JSON, invalid-entry counting) before wiring `export`/`import` into `src/index.ts`; wired the commands, ran `npm run build && npm run test:e2e` to green (67/67).
4. Updated `README.md` and `workflow/PROJECT.md`; full re-run of `npm run build`, `npm test`, `npm run test:e2e` — all green.

## Test results

- `npm test` — 100/100 passing (2 suites)
- `npm run test:e2e` — 67/67 passing (1 suite, includes 10 new export/import scenarios)
- `npm run build` — clean, no type errors

## Acceptance criteria

- [x] `todo export` with no flags prints the full todos array as JSON to stdout
- [x] `todo export --file <path>` writes the JSON to `<path>` instead of stdout
- [x] `todo import` merges imported todos into the existing list by default
- [x] `todo import --replace` replaces the existing list wholesale
- [x] On merge, an imported todo whose `id` already exists locally is skipped (existing todo wins); reports imported vs. skipped counts
- [x] `todo import` with no flags reads JSON from stdin
- [x] `todo import --file <path>` reads JSON from `<path>` instead of stdin
- [x] `todo export | todo import` round-trips without any flags
- [x] Non-array parsed payload aborts the import entirely, no todos added
- [x] Per-entry validation (required fields, types, `state`, `dueDate`); invalid entries skipped and counted separately from id-collision skips
- [x] `id` is never auto-generated during import — missing/malformed `id` always counts as invalid
- [x] Import reports counts: imported, skipped (id collision), skipped (invalid)

## Suggested review scenarios

- `todo export | todo import` round-trip on a non-empty list — verify nothing duplicates and the report shows all as id-collision skips.
- `todo import --replace --file <path>` against a payload mixing valid, id-colliding (irrelevant in replace mode), and invalid entries (bad `state`, missing `id`, malformed `dueDate`) — verify only valid entries survive and counts are right.
- Piping `{"not":"an array"}` or truncated/malformed JSON into `todo import` — verify it aborts with an error and the stored file is untouched (no partial writes).
- Confirm `import`/`export` are absent from `interactive` mode's `help` output and command dispatch — intentional, see Design notes above.

# Implement Handoff: issue-34

## Summary
Added free-form tags to todos per approved `requirements.md`. A `Todo` now carries `tags: string[]`, settable via a repeatable `--tag <name>` flag on `todo add`, filterable via `todo filter --tag <name>`, and shown in `list`/`filter` text rows. Editing tags on an existing todo is out of scope (deferred). Import validates the `tags` shape independently and aborts the whole import on a malformed value, unlike other malformed fields.

## Branch
`workflow/issue-34` (from `main`) → draft PR [#35](https://github.com/D-Andreev/simple-todo-app/pull/35)

## Changes
- `src/storage.ts`: `Todo.tags: string[]`; `addTodo()` accepts an optional `tags` array (defaults `[]`); `getTodos()` normalizes stored/legacy todos with no `tags` field to `[]` (same pattern as `normalizePriority`).
- `src/commands.ts`:
  - `normalizeTag`/`normalizeTags` — trims, lowercases, rejects empty/whitespace-only tags, dedupes case-insensitively (order-preserving).
  - `handleAdd(title, dueDate?, priority?, tags?)` — normalizes and attaches tags.
  - `handleFilter(...)` gains a trailing `tag?: string` param — case-insensitive exact match against a todo's `tags`, AND-combined with all other active filters; dedicated `No todos with tag "<name>".` message when it's the only miss.
  - `formatTodoRow` appends ` tags: <comma-separated>` when non-empty (mirrors the `dueDate` suffix pattern).
  - `isValidTagsArray` / `validateImportTags` — for each import entry, throws `Invalid import data: malformed tags field` before any todos are written if `tags` is present but not an array of non-empty strings (see ADR-0034). Missing `tags` on import defaults to `[]`.
- `src/index.ts`: `add` gets a repeatable `--tag <name>` option (commander's accumulator pattern); `filter` gets a single `--tag <name>` option.
- `src/interactive.ts`: `parseAddArgs` collects repeated `--tag <name>` tokens into an array; `parseFilterArgs` parses a single `--tag <name>`; `HELP_TEXT` updated.
- `workflow/PROJECT.md` `## Language`: added **Tag**, **Tag filter**, **Malformed tags (import)** definitions.
- `docs/adr/0034-tags-import-abort.md`: records the deliberate deviation — malformed `tags` aborts import instead of being skipped as an invalid entry.

## TDD cycles
Existing suite (134 tests) was green before this change. Added/updated in the same red→green rhythm per area:
1. **storage** — `addTodo` tags defaulting/storage, `getTodos` legacy normalization (3 new tests).
2. **commands: handleAdd** — empty-tags default, single/multiple/repeated tags, internal-space tags, empty-tag rejection, case-insensitive dedup (6 new tests).
3. **commands: handleList** — tags suffix present/absent in text rows (2 new tests).
4. **commands: handleFilter** — tag match, AND-combination, no-match message, standalone use (4 new tests).
5. **commands: handleImport** — missing→`[]`, valid array imported as-is, non-array abort, invalid-element abort, export/import round-trip (5 new tests).
6. Updated pre-existing raw `Todo` object literals/`toEqual` assertions in `tests/commands.test.ts` and `tests/storage.test.ts` that now require the `tags` field (compile-time and runtime fixes, no behavior change).
7. **e2e** (`tests/e2e/cli.e2e.test.ts`) — one-shot CLI (`add --tag` repeatable/empty/dedup, `filter --tag` match/no-match) and interactive mode (`add --tag` repeatable, `filter --tag`), plus `help` text assertion.

## Test results
- `npx tsc --noEmit` — clean.
- `npx jest` — **154/154** passed (storage: +5, commands: +20 over the prior 134).
- `npm run build && npx jest --config jest.e2e.config.js` — **102/102** passed (+7 new tag e2e tests over the prior 95).

## Acceptance criteria
- [x] Tags are free-form strings (no predefined/managed registry, no `tag create`/`tag list` admin commands)
- [x] A todo can have zero or more tags, stored as `tags: string[]`
- [x] `todo add` accepts a repeatable `--tag <name>` flag to attach multiple tags at creation
- [x] `todo filter --tag <name>` matches todos containing that tag (case-insensitive), AND-combined with other active filters
- [x] `list`/`filter` text rows append `tags: <comma-separated>` when a todo has tags (omitted when empty); `--json` needs no special handling
- [x] Out of scope: editing tags on an already-created todo — not implemented
- [x] `todo add --tag <name>` rejects an empty/whitespace-only tag with a validation error
- [x] Duplicate tags in the same `add` invocation are silently deduplicated (case-insensitive)
- [x] `getTodos()` normalizes todos with no `tags` field to `tags: []`
- [x] Malformed `tags` on import aborts the whole `handleImport` call (deviation, see ADR-0034)
- [x] No charset restriction on tag values, including internal spaces

## Suggested review scenarios
1. `todo add "Fix bug" --tag "backend" --tag Backend --tag "  urgent  "` → stored tags `['backend', 'urgent']` (dedup + normalize).
2. `todo add "No tags"` then `todo list` → no `tags:` suffix on that row.
3. `todo filter --tag backend` against a mix of tagged/untagged/other-tagged todos → only tag matches returned; combine with `--state done` to confirm AND logic.
4. Import a payload with one entry having `tags: "oops"` (string, not array) → whole import throws, nothing written, even if other entries in the same payload were otherwise valid.
5. Import a payload with an entry missing `tags` entirely → imported with `tags: []`, not rejected.
6. `todo add "Bad" --tag "   "` → validation error, no todo created.

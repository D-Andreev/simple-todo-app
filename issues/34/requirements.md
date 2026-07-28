# Requirements: issue-34

## Original ask
I want to be able to add tags for todos.

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should tags be free-form text or a managed/closed set (like `priority`)? | Free-form strings | Free-form, lowercased/trimmed |
| 2 | Can a todo have multiple tags, and how does the CLI accept them? | Multiple tags, repeatable `--tag` flag | Multiple tags via `tags: string[]`; repeatable `--tag <name>` flag |
| 3 | Should `filter` support matching by tag, and should tags show in the human-readable row? | Yes to both | `--tag <name>` filter (case-insensitive, AND-combined); append `tags: ...` to row when present |
| 4 | Is tag mutation on existing todos (add/remove after creation) in scope for this issue? | Not in scope | In scope — dedicated `todo tag`/`todo untag` commands |
| 5 | Should empty/whitespace-only tags be rejected, and should duplicate tags in one `add` be deduped or errored? | Reject empty, dedupe duplicates | Same |
| 6 | Should missing `tags` on read/import default to `[]`, and how should malformed `tags` in import be handled? | Default missing to `[]`; malformed `tags` should **crash import with an error** (not silently skip the entry) | Both defaulted/skip-as-invalid, matching existing patterns |
| 7 | Should tags be restricted to a charset, or is any non-empty trimmed string allowed (incl. internal spaces)? | No charset restriction | Same |

## Acceptance criteria
- [x] Tags are free-form strings (no predefined/managed registry, no `tag create`/`tag list` admin commands)
- [x] A todo can have zero or more tags, stored as `tags: string[]`
- [x] `todo add` accepts a repeatable `--tag <name>` flag to attach multiple tags at creation
- [x] `todo filter --tag <name>` matches todos containing that tag (case-insensitive), AND-combined with other active filters
- [x] `list`/`filter` text rows append `tags: <comma-separated>` when a todo has tags (omitted when empty, like `dueDate`); `--json` output needs no special handling
- [x] Out of scope: editing tags on an already-created todo (no `todo tag`/`todo untag`, no `--tag` on `todo update`) — deferred to a future issue
- [x] `todo add --tag <name>` rejects an empty/whitespace-only tag with a validation error (same style as `title`)
- [x] Duplicate tags passed to the same `add` invocation are silently deduplicated (case-insensitive), not an error
- [x] `getTodos()` normalizes stored todos with no `tags` field to `tags: []` (same pattern as `normalizePriority`)
- [x] **Deviation from existing import behavior**: an import entry with a malformed `tags` field (present but not an array of non-empty strings) aborts the whole `handleImport` call with a thrown error — unlike other malformed fields (`dueDate`, `priority`), which are silently skipped as invalid entries and never abort the import. See `adrs.md`.
- [x] Tag values have no charset restriction — any non-empty trimmed string is valid, including internal spaces

## Approved by human
- [x] Approved — `approve requirements` said in the session on 2026-07-28

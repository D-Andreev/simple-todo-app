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

## Acceptance criteria
- [ ] Tags are free-form strings (no predefined/managed registry, no `tag create`/`tag list` admin commands)
- [ ] A todo can have zero or more tags, stored as `tags: string[]`
- [ ] `todo add` accepts a repeatable `--tag <name>` flag to attach multiple tags at creation
- [ ] `todo filter --tag <name>` matches todos containing that tag (case-insensitive), AND-combined with other active filters
- [ ] `list`/`filter` text rows append `tags: <comma-separated>` when a todo has tags (omitted when empty, like `dueDate`); `--json` output needs no special handling
- [ ] Out of scope: editing tags on an already-created todo (no `todo tag`/`todo untag`, no `--tag` on `todo update`) — deferred to a future issue
- [ ] `todo add --tag <name>` rejects an empty/whitespace-only tag with a validation error (same style as `title`)
- [ ] Duplicate tags passed to the same `add` invocation are silently deduplicated (case-insensitive), not an error

## Approved by human
- [ ] Pending — say `approve requirements` in the session when ready

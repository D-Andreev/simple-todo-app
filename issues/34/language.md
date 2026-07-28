# Language: issue-34

Domain terms resolved during clarify. Merged into `workflow/PROJECT.md` `## Language` at implement.

**Tag**: A free-form, user-typed string label attached to a `Todo`, lowercased and trimmed for consistency, with no charset restriction (internal spaces allowed). No predefined/managed registry — no `tag create`/`tag list` admin commands. A todo may carry zero or more tags, stored as `tags: string[]`, added via a repeatable `--tag <name>` CLI flag.
_Avoid_: Label (as the field name — reserved for GitHub labels in this project's vocabulary), category

**Tag filter**: `todo filter --tag <name>` — matches todos whose `tags` list contains `<name>` (case-insensitive exact match), AND-combined with any other active `filter` flags.
_Avoid_: `--has-tag`, partial/substring tag matching

**Malformed tags (import)**: An import entry whose `tags` field is present but not an array of non-empty strings — throws and aborts the whole `handleImport` call. Deliberately different from the existing *Invalid entry (import)* behavior, which skips-and-continues for other malformed fields. See `adrs.md` ADR-1.
_Avoid_: Treating this the same as "invalid entry" (skip-and-continue)

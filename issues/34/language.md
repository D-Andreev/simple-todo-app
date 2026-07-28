# Language: issue-34

Domain terms resolved during clarify. Merged into `workflow/PROJECT.md` `## Language` at implement.

**Tag**: A free-form, user-typed string label attached to a `Todo`, lowercased and trimmed for consistency. No predefined/managed registry — no `tag create`/`tag list` admin commands. A todo may carry zero or more tags, stored as `tags: string[]`, added via a repeatable `--tag <name>` CLI flag.
_Avoid_: Label (as the field name — reserved for GitHub labels in this project's vocabulary), category

# Language additions: issue-20

**JSON output**: A `--json` flag on `list` and `filter` that emits todos as a JSON array of raw internal `Todo` objects (`{ id, title, state, createdAt }`, full uuid, epoch-ms) instead of the human-readable formatted rows, for scripting (e.g. piping through `jq`).
_Avoid_: `--format json`, `-j`, pretty-printed-only output

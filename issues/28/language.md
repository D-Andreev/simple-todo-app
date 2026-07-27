## Language

**Export**: `todo export` — prints the full stored todos array as JSON to stdout by default, or to a file path via `--file <path>`.
_Avoid_: Backup, dump, serialize

**Import**: `todo import` — reads a JSON todos array from stdin by default, or from a file path via `--file <path>`, and merges it into the existing stored todos.
_Avoid_: Restore, load, deserialize

**Merge (import mode)**: The default import mode — imported todos are added to the existing list; an imported todo whose `id` already exists locally is skipped (existing todo wins).
_Avoid_: Sync, upsert, append-only

**Replace (import mode)**: `todo import --replace` — the imported list wholesale replaces the existing stored todos.
_Avoid_: Overwrite-all, reset, wipe-and-load

**Invalid entry (import)**: An array entry in the import payload that fails validation (missing/wrong-typed required field, non-string or missing `id`, bad `state`, malformed `dueDate`) — skipped and counted separately from id-collision skips. Never causes the whole import to abort.
_Avoid_: Corrupt entry, bad record

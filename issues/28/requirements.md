# Requirements: issue-28

## Original ask
Since storage is already JSON, this is a natural fit:

  • export todos.json (or stdout)
  • import todos.json (merge or replace)

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Export destination — stdout by default, or a fixed default file path? | stdout by default, with a `--file` flag to write to a path instead | stdout by default, with a `--file` flag |
| 2 | Import default mode (merge vs replace) and `id`-collision handling on merge | Merge by default; skip imported todo on `id` collision | Merge by default; skip on collision |
| 3 | Import source — stdin by default, or always require a path/flag? | stdin by default, with a `--file` flag to read from a path instead | stdin by default, with a `--file` flag |
| 4 | Validation strategy for malformed import data | Abort the whole import if the top-level payload isn't a valid JSON array; validate per-entry otherwise, skipping and counting invalid entries | Abort on invalid top-level, skip + count bad entries |
| 5 | Missing/malformed `id` on an imported entry — invalid (skip) or auto-generate a new uuid? | Skip and count it as invalid | Skip and count as invalid |

## Acceptance criteria
- [ ] `todo export` with no flags prints the full todos array as JSON to stdout
- [ ] `todo export --file <path>` writes the JSON to `<path>` instead of stdout
- [ ] `todo import` merges imported todos into the existing list by default
- [ ] `todo import --replace` replaces the existing list wholesale
- [ ] On merge, an imported todo whose `id` already exists locally is skipped (existing todo wins); the command reports how many were imported vs. skipped
- [ ] `todo import` with no flags reads JSON from stdin
- [ ] `todo import --file <path>` reads JSON from `<path>` instead of stdin
- [ ] `todo export | todo import` round-trips without any flags
- [ ] If the parsed import payload is not a JSON array, the import aborts entirely with an error and no todos are added
- [ ] Each array entry is validated (required fields present including a string `id`, correct types, `state` is `pending`/`done`, `dueDate` is `null` or matches `YYYY-MM-DD` and is a real calendar date); invalid entries (including missing/non-string `id`) are skipped and counted separately from id-collision skips
- [ ] `id` is never auto-generated during import — a missing/malformed `id` always counts as an invalid entry
- [ ] Import reports counts: imported, skipped (id collision), skipped (invalid)

## Approved by human
- [ ] Pending — say `approve requirements` in the session when ready

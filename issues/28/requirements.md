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

## Acceptance criteria
- [ ] `todo export` with no flags prints the full todos array as JSON to stdout
- [ ] `todo export --file <path>` writes the JSON to `<path>` instead of stdout
- [ ] `todo import` merges imported todos into the existing list by default
- [ ] `todo import --replace` replaces the existing list wholesale
- [ ] On merge, an imported todo whose `id` already exists locally is skipped (existing todo wins); the command reports how many were imported vs. skipped

## Approved by human
- [ ] Pending — say `approve requirements` in the session when ready

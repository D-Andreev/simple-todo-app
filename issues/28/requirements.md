# Requirements: issue-28

## Original ask
Since storage is already JSON, this is a natural fit:

  • export todos.json (or stdout)
  • import todos.json (merge or replace)

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Export destination — stdout by default, or a fixed default file path? | stdout by default, with a `--file` flag to write to a path instead | stdout by default, with a `--file` flag |

## Acceptance criteria
- [ ] `todo export` with no flags prints the full todos array as JSON to stdout
- [ ] `todo export --file <path>` writes the JSON to `<path>` instead of stdout

## Approved by human
- [ ] Pending — say `approve requirements` in the session when ready

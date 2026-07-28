# Requirements: issue-30

## Original ask
I want to be able to add a priority for todods when creating them and later to be able to filter by priority. Priority is predifined values of Low, Mid, High

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Is priority required on `add`, or optional with a default? | Optional; defaults to `mid` when omitted | Optional `--priority <low\|mid\|high>`, default `mid` |
| 2 | Should priority affect `list`/`filter` sort order? | No — keep existing `state → title → createdAt` order unchanged | Leave sort order unchanged |
| 3 | Show priority in text rows (like `due: ...`) and in `--json` output? | Yes to both | Yes to both |
| 4 | `--priority` on `filter`: standalone + AND'd with other filters, and invalid value errors like `--state` does? | Yes to all three | Yes to all three |
| 5 | Editable after creation (e.g. `--priority` on `update`)? | Out of scope for now | Out of scope, matches `dueDate` precedent |
| 6 | Legacy todos/exports with no `priority` field — treat as `mid`, or unset/invalid? | Treat missing priority as `mid` everywhere (read path and import) | Treat as `mid` everywhere |

## Acceptance criteria
- [ ] `todo add <title> --priority <low\|mid\|high>` sets the todo's priority; `--priority` is optional and defaults to `mid` when omitted
- [ ] An invalid `--priority` value on `add` errors with a message listing the valid values (`low`, `mid`, `high`), matching the `--state` validation pattern
- [ ] `list`/`filter` sort order remains `state → title → createdAt`, unaffected by priority
- [ ] Text rows for `list`/`filter` show the todo's priority (alongside the existing `due:` suffix style)
- [ ] `--json` output for `list`/`filter` includes a `priority` field on each todo object
- [ ] `todo filter --priority <low|mid|high>` filters todos by priority; it can be used standalone (satisfies the "must provide at least one filter criterion" check) and combines with `--state`, `--due`, `--overdue`, and name search using AND logic
- [ ] An invalid `--priority` value on `filter` errors the same way an invalid `--state` value does today
- [ ] There is no way to change a todo's priority after creation in this issue (no `--priority` on `update`)
- [ ] A stored todo (existing `todos.json` entry, or an `import`ed entry) with no `priority` field is treated as `mid` — not an import validation failure, not `null`/unset
- [ ] `todo export` includes the `priority` field for every todo; export/import round-trips priority

## Approved by human
- [x] Approved in session on 2026-07-28

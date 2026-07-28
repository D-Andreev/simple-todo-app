# Requirements: issue-30

## Original ask
I want to be able to add a priority for todods when creating them and later to be able to filter by priority. Priority is predifined values of Low, Mid, High

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Is priority required on `add`, or optional with a default? | Optional; defaults to `mid` when omitted | Optional `--priority <low\|mid\|high>`, default `mid` |
| 2 | Should priority affect `list`/`filter` sort order? | No — keep existing `state → title → createdAt` order unchanged | Leave sort order unchanged |

## Acceptance criteria
- [ ] ...

## Approved by human
- [ ] Pending — say `approve requirements` in the session when ready

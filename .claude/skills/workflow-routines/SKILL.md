---
name: workflow-routines
description: >-
  Shared rules for GitHub-issue workflow routines — handoff format, state
  schema, label triggers. Use when reading issue handoff or wiring routine
  webhooks.
disable-model-invocation: true
---

# Workflow Routines (shared reference)

## Label flow

```
workflow:start → clarify → workflow:implement → implement → workflow:review
  → AI review (autonomous, one PR comment) → workflow:human-review
  → [optional local comprehension] → merge PR · close issue
```

No routine for `workflow:human-review` or comprehension. Comprehension is an optional local skill — skip by merging and closing the issue.

Docs: [handoff-format.md](handoff-format.md) · [state-schema.md](state-schema.md) · [label-rules.md](label-rules.md)

**Label swap is always the last GitHub write** when a phase advances. Handoff lives on long-lived **`workflow/state`**. Clarify writes only there; implement **creates the work branch**. Implement opens PRs as **draft**.

## Phase skills

| Phase | Skill | Routine |
|-------|-------|---------|
| init | workflow-init | — |
| clarify | workflow-clarify | `workflow:start` |
| implement | workflow-implement | `workflow:implement` |
| AI review | workflow-review | `workflow:review` |
| human review | — | — (GitHub PR) |
| comprehension | workflow-comprehension | — (local session, optional) |

Prompts: repo `routines/`.

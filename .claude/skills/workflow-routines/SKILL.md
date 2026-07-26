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
  → AI review (session + fix loop) → workflow:human-review → human PR review
```

Only `workflow:human-review` has no routine.

Docs: [handoff-format.md](handoff-format.md) · [state-schema.md](state-schema.md) · [label-rules.md](label-rules.md)

## Phase skills

| Phase | Skill | Routine |
|-------|-------|---------|
| init | workflow-init | — |
| clarify | workflow-clarify | `workflow:start` |
| implement | workflow-implement | `workflow:implement` |
| AI review | workflow-review | `workflow:review` |
| human review | — | — (GitHub PR) |

Prompts: repo `routines/`.

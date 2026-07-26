---
name: workflow-routines
description: >-
  Shared rules for GitHub-issue workflow routines — handoff comment format,
  state schema, label swaps. Use when configuring routines, reading issue
  handoff, or debugging stuck labels.
disable-model-invocation: true
---

# Workflow Routines (shared reference)

Phase skills do the work; this skill holds **shared contracts**.

## Where state lives

| Location | What |
|----------|------|
| **Issue handoff comment** | `state.json`, `task.md`, `requirements.md`, later phase artifacts |
| **Repo** | `PROJECT.md`, `gotchas.md`, `docs/adr/` |
| **Issue labels** | Routing between routines |
| **Session comment** | Human link to Claude Code session |

Handoff format: [handoff-format.md](handoff-format.md)  
State fields: [state-schema.md](state-schema.md)  
Labels: [label-rules.md](label-rules.md)

## Read handoff (implement and later phases)

1. Open GitHub issue `{n}`
2. Find comment with `<!-- ai-workflow:handoff v1 issue={n} -->`
3. Parse fenced sections — see handoff-format **Read protocol**

## Label flow

```
workflow:start → workflow:clarify → workflow:implement
```

## Phase skills

| Phase | Skill |
|-------|-------|
| init | workflow-init |
| clarify | workflow-clarify |
| implement | (future) |

Routine prompts: repo `routines/`.

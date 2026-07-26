---
name: workflow-init
description: >-
  Initialize the AI workflow for a project — scaffold .claude/workflows
  directories, seed gotchas.md, and generate PROJECT.md. Use when setting up
  a new repo, when PROJECT.md is missing, or when the user runs /workflow-init.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Init

One-time setup. Writes durable **project facts** to the repo. Clarify builds specs in **session memory**, posts an **issue handoff comment once** on approve; implement merges `language.md` into `PROJECT.md`.

**No application code changes.**

## Process

1. Scaffold `.claude/workflows/learnings/`
2. Seed `gotchas.md` if missing
3. Generate `PROJECT.md` — empty `## Language` (implement merges from handoff after clarify)
4. Confirm: create labels `workflow:start`, `workflow:clarify`, `workflow:implement`, `workflow:review`, `workflow:human-review`; configure routines in `routines/`

## PROJECT.md `## Language`

```markdown
## Language

_(Domain terms are added when implement merges clarify handoff.)_
```

During clarify, terms live in session `language.md` → posted in handoff at approve.

## Writable files

`.claude/workflows/learnings/gotchas.md`, `.claude/workflows/PROJECT.md`

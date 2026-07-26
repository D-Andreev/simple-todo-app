---
name: workflow-init
description: >-
  Initialize the AI workflow for a project — scaffold .claude/workflows
  directories, seed gotchas.md, generate PROJECT.md, and create GitHub workflow
  labels. Use when setting up a new repo, when PROJECT.md is missing, or when
  the user runs /workflow-init.
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
4. **Create GitHub labels** (requires `gh` authenticated for this repo). Idempotent — use `--force` so re-runs update description/color without error:

   ```bash
   gh label create "workflow:start"        --description "Start clarify routine"     --color "0E8A16" --force
   gh label create "workflow:clarify"      --description "Clarify in progress"       --color "FBCA04" --force
   gh label create "workflow:implement"    --description "Start implement routine"   --color "1D76DB" --force
   gh label create "workflow:review"       --description "Start AI review routine"   --color "5319E7" --force
   gh label create "workflow:human-review" --description "Human PR review (no routine)" --color "D93F0B" --force
   ```

   If `gh` is unavailable or not authenticated, list the five labels and ask the user to create them in GitHub (Settings → Labels) or run the commands above.
5. Remind the user to configure routines — paste prompts from `routines/` at [claude.ai/code/routines](https://claude.ai/code/routines) with matching label triggers.

## PROJECT.md `## Language`

```markdown
## Language

_(Domain terms are added when implement merges clarify handoff.)_
```

During clarify, terms live in session `language.md` → posted in handoff at approve.

## Writable files

`.claude/workflows/learnings/gotchas.md`, `.claude/workflows/PROJECT.md`

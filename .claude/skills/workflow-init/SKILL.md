---
name: workflow-init
description: >-
  Initialize the AI workflow for a project — scaffold workflow/ directories,
  seed gotchas.md, generate PROJECT.md, and create GitHub workflow labels. Use
  when setting up a new repo, when PROJECT.md is missing, or when the user runs
  /workflow-init.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Init

One-time setup. Clarify **creates `workflow/issue-{n}` first** and saves ephemeral handoff files under `workflow/issues/{n}/`; implement merges `language.md` into `PROJECT.md`.

**No application code changes.**

## Process

1. Scaffold `workflow/learnings/`
2. Seed `workflow/learnings/gotchas.md` if missing
3. Generate `workflow/PROJECT.md` — empty `## Language` (implement merges from handoff after clarify)
   - If legacy `.claude/workflows/PROJECT.md` exists, copy its contents to `workflow/PROJECT.md` (and gotchas) instead of regenerating; note the old path is deprecated.
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

During clarify, terms live in `workflow/issues/{n}/language.md` on the work branch; implement merges into `PROJECT.md`.

## Writable files

`workflow/learnings/gotchas.md`, `workflow/PROJECT.md`

Workflow files live under **`workflow/`** (repo root), not `.claude/` — Claude Code treats `.claude/` as protected config and cloud routines cannot approve writes there.

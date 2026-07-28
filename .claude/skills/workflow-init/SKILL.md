---
name: workflow-init
description: >-
  Initialize the AI workflow for a project — scaffold workflow/ directories,
  seed gotchas.md, generate PROJECT.md, create GitHub workflow labels, and
  create the long-lived workflow/state branch. Use when setting up a new
  repo, when PROJECT.md is missing, or when the user runs /workflow-init.
disable-model-invocation: true
metadata:
  internal: true
---

# Workflow: Init

One-time setup. Creates long-lived **`workflow/state`** for all issue handoffs (`issues/{n}/`). Clarify writes only there; implement creates `workflow/issue-{n}` for code and merges `language.md` into `PROJECT.md`.

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
   gh label create "workflow:done"         --description "Workflow complete"         --color "BFDADC" --force
   ```

   If `gh` is unavailable or not authenticated, list the six labels and ask the user to create them in GitHub (Settings → Labels) or run the commands above.
5. **Create long-lived `workflow/state` branch** (orphan; never merge to main). Idempotent — skip if `origin/workflow/state` already exists:

   ```bash
   git fetch origin
   if ! git rev-parse --verify origin/workflow/state >/dev/null 2>&1; then
     current=$(git branch --show-current)
     git checkout --orphan workflow/state
     git rm -rf . 2>/dev/null || true
     mkdir -p issues
     printf '%s\n' '# Workflow state' '' 'Long-lived handoff and audit branch for all issues under `issues/{n}/`. Do not merge into main.' > README.md
     git add README.md
     git commit -m "workflow: init state branch"
     git push -u origin workflow/state
     git checkout "$current"
   fi
   ```

   If push fails (no remote auth), tell the user to create/push `workflow/state` once; clarify will also ensure-or-create it at start.
6. Remind the user to configure **four** routines — paste prompts from `routines/` at [claude.ai/code/routines](https://claude.ai/code/routines):
   - Clarify / Implement / AI Review — **label** triggers (`workflow:start`, `workflow:implement`, `workflow:review`)
   - Close — **GitHub event** trigger: issue **closed** with label `workflow:human-review` (see [close-routine.md](../../routines/close-routine.md))
   - Enable **Allow unrestricted branch pushes** on routines that push `workflow/state`

## PROJECT.md `## Language`

```markdown
## Language

_(Domain terms are added when implement merges clarify handoff.)_
```

During clarify, terms live in `issues/{n}/language.md` on **`workflow/state`**; implement merges into `PROJECT.md` on the work branch.

## Writable files

`workflow/learnings/gotchas.md`, `workflow/PROJECT.md`, and (once) the orphan **`workflow/state`** branch with its README.

Workflow files live under **`workflow/`** (repo root), not `.claude/` — Claude Code treats `.claude/` as protected config and cloud routines cannot approve writes there.

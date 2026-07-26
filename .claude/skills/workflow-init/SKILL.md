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

One-time (or refresh) setup for a repo. Run via `/workflow-init` before using GitHub issue routines.

Scaffolds workflow directories, seeds durable files, and writes `.claude/workflows/PROJECT.md`. Per-issue pipeline state lives on **GitHub issue comments** — not in the repo (see [handoff-format.md](../workflow-routines/handoff-format.md)).

**No application code changes.**

## When to use

| Situation | Action |
|-----------|--------|
| New repo, first-time setup | Full init: dirs + gotchas + PROJECT.md |
| `init refresh` | Regenerate PROJECT.md only |
| Plain `init` | Show setup; offer refresh if stack changed |

## Process

### 1. Explore

- `.claude/workflows/PROJECT.md`
- `.claude/workflows/learnings/gotchas.md`

If **`init refresh`**, skip to step 4.

### 2. Scaffold (full init only)

```
.claude/workflows/learnings/
```

No `issues/` directory — handoff is on GitHub issues.

### 3. Seed gotchas.md (full init only)

If missing, write:

```markdown
# Gotchas & Learnings

Curated pitfalls from workflow runs. Consolidated after each pipeline — not a per-run log.

No outstanding gotchas yet.
```

### 4. Generate PROJECT.md

Gather facts from repo manifests, README, config, source layout. Write `.claude/workflows/PROJECT.md` (template below, ~50 lines max). Do not overwrite without refresh.

### 5. Confirm

1. What was created or refreshed
2. Create labels: `workflow:start`, `workflow:clarify`, `workflow:implement`
3. Configure clarify routine at claude.ai/code/routines
4. Start: open issue + `workflow:start`

## PROJECT.md template

Same as ai-workflow — Overview, Main Features, Stack, Development, empty `## Language`.

## Writable files

Full init: `.claude/workflows/learnings/gotchas.md`, `.claude/workflows/PROJECT.md`

Init refresh: `.claude/workflows/PROJECT.md` only

## Rules

- **`## Language` starts empty**
- Never invent features or commands
- No application code changes

# Issue Comment Handoff Format

Per-issue pipeline artifacts are posted in **one GitHub issue comment** when **clarify completes** (`approve requirements`). Later routines read this comment. Nothing is posted during the clarify Q&A turns.

Full schema for `state.json`: [state-schema.md](state-schema.md)

## Marker

```html
<!-- ai-workflow:handoff v1 issue=42 -->
```

Clarify **POSTs once** at session end. Implement and later phases may **PATCH** the same comment to add sections.

## Comment body template

```markdown
<!-- ai-workflow:handoff v1 issue=42 -->

_Workflow handoff — clarify complete._

### state.json

```json
{ ... }
```

### task.md

```markdown
# Task
...
```

### language.md

```markdown
## Language

**Term**:
Definition.
_Avoid_: alternatives
```

### requirements.md

```markdown
# Requirements: issue-42
...
```

### adrs.md

```markdown
# ADR drafts
...
```
```

Use **per-section fences only**.

### Section rules

| Section | Posted by clarify | Notes |
|---------|-------------------|-------|
| `state.json` | yes | Final state at approve |
| `task.md` | yes | |
| `language.md` | yes | Implement merges into PROJECT.md |
| `requirements.md` | yes | |
| `adrs.md` | if any | |
| `implement-handoff.md` | no | Implement PATCH at complete |
| `review-report.md` | no | Review PATCH at `proceed to human review` |

## Write protocol

### Clarify (once, on approve)

1. Build full snapshot from in-session artifacts
2. **POST** new comment — `gh api POST repos/{owner}/{repo}/issues/{n}/comments`
3. Do **not** POST or PATCH handoff during Q&A turns

### Later phases (implement, …)

1. Find comment with marker
2. **PATCH** to append/update sections

```bash
gh api --method POST repos/{owner}/{repo}/issues/{n}/comments -f body='...'
gh api --method PATCH repos/{owner}/{repo}/issues/comments/{comment_id} -f body='...'
```

## Read protocol

1. Fetch issue comments; find `<!-- ai-workflow:handoff v1 issue={n} -->`
2. If missing — clarify not finished yet; implement must not run
3. Parse `### {filename}` sections → fenced blocks

## Session comment (separate, at clarify start)

Human session URL — posted when clarify **starts**, not the handoff. See [label-rules.md](label-rules.md).

## Repo vs issue

| During clarify (session memory) | Posted at clarify end (issue) | Repo (implement writes) |
|-------------------------------|-------------------------------|-------------------------|
| `language.md` | handoff `language.md` | `PROJECT.md` `## Language` |
| `requirements.md` | handoff `requirements.md` | |
| `adrs.md` | handoff `adrs.md` | `docs/adr/` |

Clarify: no branch, no repo writes, **no handoff comment until approve**.

Implement: read handoff → branch `workflow/issue-{n}` → code on branch → PATCH handoff with `implement-handoff.md`.

Review: checkout `work_branch` → AI review in session → optional fixes on branch → PATCH handoff with `review-report.md` at **`proceed to human review`**.

# Issue Comment Handoff Format

Per-issue pipeline state and artifacts live in **one GitHub issue comment** — not in the repo. Later routines (implement, etc.) load handoff by reading this comment.

Full schema for `state.json` contents: [state-schema.md](state-schema.md)

## Marker

Every handoff comment **must** start with this HTML comment (issue number required):

```html
<!-- ai-workflow:handoff v1 issue=42 -->
```

- `v1` — format version; bump only if section layout changes
- `issue={number}` — must match the GitHub issue

Search issue comments for this exact marker to find the handoff comment.

## Comment body template

Post on **create**; **edit in place** on every subsequent clarify turn (do not post a new handoff comment each turn).

```markdown
<!-- ai-workflow:handoff v1 issue=42 -->

_Workflow handoff — updated 2026-07-26T07:15:00Z. Agents: parse fenced sections below. Humans: use the session comment for Q&A._

### state.json

```json
{
  "id": "issue-42",
  "issue_number": 42,
  ...
}
```

### task.md

```markdown
# Task

{issue title}

{issue body}
```

### requirements.md

```markdown
# Requirements: issue-42
...
```
```

### Section rules

| Section | Required | Notes |
|---------|----------|-------|
| `state.json` | yes | Valid JSON; fence language tag `json` |
| `task.md` | yes | Copied from issue title + body at start |
| `requirements.md` | after first Q&A | Omit until first answer, or include stub |

Later phases add sections the same way when defined (e.g. `implement-handoff.md`).

**Fence nesting:** the outer comment uses ` ```markdown ` for the whole body. Inner artifact fences use **4-space indent** or alternate fence length (` ````markdown `) so GitHub renders correctly. Prefer **4-space indent** for inner ` ``` ` blocks inside the outer markdown fence when editing via API.

Safer alternative — **no outer fence**; only per-section fences as shown in the template above (recommended).

## Write protocol (clarify)

1. List comments: `gh api repos/{owner}/{repo}/issues/{n}/comments`
2. Find comment whose body contains `<!-- ai-workflow:handoff v1 issue={n} -->`
3. **If found** — PATCH that comment with updated full body (all sections, full snapshot each time)
4. **If not found** — POST new comment with the template
5. Record `handoff_updated` in `state.history` (inside the JSON you write)

```bash
# Edit existing (preferred)
gh api --method PATCH repos/{owner}/{repo}/issues/comments/{comment_id} \
  -f body='...'

# Create first handoff
gh api --method POST repos/{owner}/{repo}/issues/{n}/comments \
  -f body='...'
```

## Read protocol (clarify resume, implement, …)

1. Fetch issue comments (newest-first or oldest-first — marker is unique)
2. Locate body containing `<!-- ai-workflow:handoff v1 issue={n} -->`
3. Extract each `### {filename}` section — content is the fenced block immediately below the heading
4. Parse `state.json` as JSON; treat other sections as raw markdown strings
5. If no handoff comment exists and label is `workflow:clarify`, clarify may still be starting — run Start sequence

## Session comment (separate)

Human-facing link to the Claude Code session — **different comment**, not the handoff comment. See [label-rules.md](label-rules.md). Never embed the session URL inside the handoff comment (handoff is machine-readable and long-lived).

## What stays in the repo

| Committed | Not committed |
|-----------|---------------|
| `.claude/workflows/PROJECT.md` (glossary updates from clarify) | `state.json`, `task.md`, `requirements.md` per issue |
| `.claude/workflows/learnings/gotchas.md` | |
| `docs/adr/*.md` | |

PROJECT.md is shared team context. Per-issue specs stay on the issue.

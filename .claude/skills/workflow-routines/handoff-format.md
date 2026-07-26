# Issue Comment Handoff Format

Per-issue pipeline artifacts live in **one GitHub issue comment**. Clarify **POSTs** it; every later phase **PATCHes** the same comment and **updates `state.json`**.

Full schema: [state-schema.md](state-schema.md)

## Marker

```html
<!-- ai-workflow:handoff v1 issue=42 -->
```

## Comment body template

```markdown
<!-- ai-workflow:handoff v1 issue=42 -->

_Workflow handoff — updated by each phase._

### state.json

```json
{ ... }
```

### task.md
...

### language.md
...

### requirements.md
...

### adrs.md
...

### implement-handoff.md
...

### review-report.md
...
```

Use **per-section fences only**. Omit empty optional sections until that phase writes them.

### Section rules

| Section | First writer | Updated by |
|---------|--------------|------------|
| `state.json` | clarify | **every phase** (POST + PATCH each start/complete) |
| `task.md`, `language.md`, `requirements.md`, `adrs.md` | clarify | preserved in every PATCH |
| `implement-handoff.md` | implement (complete) | preserved in review PATCH |
| `review-report.md` | review (complete) | — |

## Write protocol

### Clarify (POST once, then PATCH for comment id)

1. Build full snapshot from in-session artifacts
2. **POST** new comment — `gh api POST repos/{owner}/{repo}/issues/{n}/comments`
3. Read `id` from response → **PATCH** same comment immediately — set `handoff_comment_id` in `state.json`, append history `handoff_created`
4. Do **not** POST or PATCH handoff during Q&A turns

### Later phases (implement, review, …)

1. Read handoff — use `state.json` → `handoff_comment_id`, or find comment with marker
2. **PATCH at phase start** — update `state.json` (`phase`, `status: ai_running`, `last_session_url`, history `started`)
3. Do phase work
4. **PATCH at phase complete** — update `state.json` (phase fields, history `phase_completed`, `labels_updated`), add phase sections (`implement-handoff.md`, `review-report.md`, …)
5. **Full snapshot every PATCH** — include all existing sections, not just deltas

```bash
gh api --method POST repos/{owner}/{repo}/issues/{n}/comments -f body='...'
gh api --method PATCH repos/{owner}/{repo}/issues/comments/{comment_id} -f body='...'
```

**Never POST a second handoff comment** for the same issue.

## Read protocol

1. Fetch issue comments; find `<!-- ai-workflow:handoff v1 issue={n} -->` (prefer `handoff_comment_id` from last read)
2. If missing — clarify not finished; implement must not run
3. Parse `### {filename}` sections → fenced blocks

## Session comment (separate, at phase start)

Claude Code session URL — posted on the issue when **clarify**, **implement**, or **review** starts; not the handoff. See [label-rules.md](label-rules.md).

## Repo vs issue

| During clarify (session memory) | Handoff comment (issue) | Repo (implement writes) |
|-------------------------------|-------------------------|-------------------------|
| `language.md` | handoff `language.md` | `workflow/PROJECT.md` `## Language` |
| `requirements.md` | handoff `requirements.md` | |
| `adrs.md` | handoff `adrs.md` | `docs/adr/` |

**Label swap is always the last GitHub write** when advancing phases (see [label-rules.md](label-rules.md)).

# Gist Handoff Format (Machine State) + Human Issue Comments

All machine files live in a **secret GitHub Gist**. Issue comments are **human-only** — short session links and status one-liners. Never put JSON or artifact bodies in issue comments.

Full schema: [state-schema.md](state-schema.md)

## Split

| Layer | Where | Audience |
|-------|-------|----------|
| **Handoff gist** | Secret gist (multi-file) | Agents read/write all artifacts |
| **Issue comments** | Normal issue thread | Humans only |

Agents locate the gist via `handoff_gist_id` in `state.json`, or the pointer marker on the issue (see below).

## Gist files

Flat filenames in the gist root:

| File | First writer | Updated by |
|------|--------------|------------|
| `state.json` | clarify (approve) | **every phase** (start + complete) |
| `task.md` | clarify (approve) | preserved |
| `language.md` | clarify (approve) | preserved |
| `requirements.md` | clarify (approve) | preserved |
| `adrs.md` | clarify (optional) | preserved |
| `implement-handoff.md` | implement (complete) | preserved in review |
| `review-report.md` | review (complete) | — |

Gist description: `ai-workflow handoff issue-{n}`

## Issue comments (humans only)

One to three lines. No JSON, no fenced artifact blocks.

| When | Example |
|------|---------|
| Clarify start | `**Clarify** — [session]({url})` |
| Clarify approve | `**Clarify complete** — requirements approved.` |
| Implement start | `**Implement** — [session]({url}) · branch \`workflow/issue-{n}\`` |
| Implement complete | `**Implement complete** — draft PR #{pr}` |
| Review start | `**Review** — [session]({url}) · PR #{pr}` |
| Review complete | `**Review complete** — {VERDICT} · [PR review]({url})` |
| Gist write failure | `**{Phase}** — handoff gist update failed: {one-line error}. Session: {url}` |

PR comments stay short (≤ 8 lines); full detail in gist `review-report.md`.

### Pointer marker (optional, in approve comment)

Invisible to most readers; helps agents find the gist if `state.json` is stale:

```html
<!-- ai-workflow:handoff v3 issue=42 gist=abc123def456 -->
```

May be appended to the clarify-complete comment. **Never** put artifact content in the same comment.

## Write protocol

### Auth (cloud routines — required)

Handoff gist create/edit **must** use **`gh gist create`**, **`gh gist edit`**, or **`gh api PATCH gists/{id}`** via the **`gh` CLI**. Cloud sessions authenticate via the **[Claude GitHub App](https://github.com/apps/claude)** — not `$GITHUB_TOKEN`, not `curl`.

**Do:**

- `gh gist …` for all handoff file writes
- `gh issue comment` for short human comments only
- Verify gist commands succeed before swapping labels

**Do not:**

- Store artifacts in issue comments
- PATCH issue comments to update machine state
- Skip gist update because a pointer comment exists — **pointer ≠ current state**

### Create gist (clarify approve)

During Q&A, artifacts live **in session memory only** — no gist until approve.

1. Write temp files: `state.json`, `task.md`, `language.md`, `requirements.md`, `adrs.md` if any.
2. Create secret gist:

```bash
gh gist create /tmp/handoff-{n}/* --secret --desc "ai-workflow handoff issue-{n}"
```

3. Parse gist id and URL from output.
4. Set `handoff_gist_id` and `handoff_gist_url` in `state.json`; append history `handoff_created`.
5. Upload final `state.json`:

```bash
gh gist edit {gist_id} state.json < /tmp/handoff-{n}/state.json
```

6. Post short approval comment on issue (optional pointer marker with gist id).
7. **Swap labels last** — `workflow:implement`.

### Update gist (implement, review)

1. Resolve gist id — from pointer marker, or `handoff_gist_id` in last-read `state.json`.
2. Fetch files: `gh gist view {gist_id} -f state.json` (and others as needed).
3. **At phase start** — update `state.json`; push to gist.
4. Do phase work.
5. **At phase complete** — update `state.json`; add phase files; push to gist.
6. Post short issue comment; **label swap last**.

Multi-file atomic update:

```bash
gh api PATCH "gists/{gist_id}" --input - <<< "$(jq -n \
  --rawfile s /tmp/state.json \
  --rawfile h /tmp/implement-handoff.md \
  '{files: {"state.json": {content: $s}, "implement-handoff.md": {content: $h}}}')"
```

Single file:

```bash
gh gist edit {gist_id} state.json < /tmp/state.json
```

**Never create a second handoff gist** for the same issue.

### On handoff write failure

1. Post a **short issue comment** — phase, gist update failed, one-line error, session link.
2. **Stop** — do not swap labels, do not open PR.

## Read protocol

1. Find gist id — pointer comment `<!-- ai-workflow:handoff v3 issue={n} gist={id} -->`, or `handoff_gist_id` from cached `state.json`.
2. If missing — clarify not finished; implement must not run.
3. Load files:

```bash
gh gist view {gist_id} -f state.json
gh gist view {gist_id} -f requirements.md
```

4. Plain files by filename — no comment section parsing.

**Legacy v1 comment handoffs:** if only `<!-- ai-workflow:handoff v1 … -->` exists, re-run clarify or migrate manually.

## Session comments

Posted when **clarify**, **implement**, or **review** starts — separate from handoff. See [label-rules.md](label-rules.md).

## Repo vs gist

| During clarify (session memory) | Handoff gist | Repo (implement writes) |
|-------------------------------|--------------|-------------------------|
| artifacts | all machine files | application code only |
| `language.md` | gist | merged → `workflow/PROJECT.md` |
| `adrs.md` | gist | committed → `docs/adr/` |

**Label swap is always the last GitHub write** when advancing phases (see [label-rules.md](label-rules.md)).

# Branch Handoff Format (Ephemeral Files) + Human Issue Comments

Ephemeral machine files live on the **work branch** under `workflow/issues/{n}/`. Issue comments are **human-only** — short session links and status one-liners. Never put JSON or artifact bodies in issue comments.

Full schema: [state-schema.md](state-schema.md)

## Split

| Layer | Where | Audience |
|-------|-------|----------|
| **Handoff files** | `workflow/issue-{n}` → `workflow/issues/{n}/` | Agents read/write |
| **Issue comments** | Issue thread | Humans only |
| **Repo (same branch)** | App code, `workflow/PROJECT.md`, `docs/adr/` | Shipped artifacts (implement+) |

**Clarify creates the branch first** — before session comment and Q1. Every phase uses the same branch.

## Branch layout

**Branch:** `workflow/issue-{n}` (created at **clarify start**)

**Handoff directory:** `workflow/issues/{n}/`

| File | First writer | Updated by |
|------|--------------|------------|
| `state.json` | clarify (start) | **every phase** (start + complete) |
| `task.md` | clarify (start) | clarify (Q&A commits) |
| `language.md` | clarify (start) | clarify (Q&A commits) |
| `requirements.md` | clarify (start) | clarify (Q&A + approve) |
| `adrs.md` | clarify (optional) | clarify |
| `implement-handoff.md` | implement (complete) | — |
| `review-report.md` | review (complete) | — |

During clarify, **only write** under `workflow/issues/{n}/` — not application code, not `workflow/PROJECT.md`.

## Issue comments (humans only)

**Voice:** informative, short, engaging — Claude Code style: warm, direct, lightly playful, always professional. One to three lines. No JSON or artifact bodies. **Always use markdown links** where required.

**Do:** tell humans what phase just started or finished, what to do next, link session/branch/PR.  
**Don't:** dump specs, post walls of text, use more than one emoji per comment, or sound like a status bot.

### Clarify start (required links)

Post **after** branch push. Must include **both** links:

1. **Session** — this Claude Code session URL (record in `state.json` → `last_session_url`).
2. **Branch** — `https://github.com/{owner}/{repo}/tree/workflow/issue-{n}` (`gh repo view --json nameWithOwner -q .nameWithOwner`).

**Example:**

```markdown
**Clarify** — Let's sharpen the requirements together. [Open the session](https://claude.ai/code/…) — one question at a time. Specs live on [`workflow/issue-42`](https://github.com/acme/app/tree/workflow/issue-42).
```

Optional anchor: `<!-- ai-workflow:handoff v4 issue=42 branch=workflow/issue-42 -->`

### All phase comments

Adapt tone; keep links. Examples:

| When | Example |
|------|---------|
| Clarify approve | `**Requirements approved** — Spec is locked; implement picks up next. Reply in the session if anything looks off.` |
| Implement start | `**Implement** — Building from the approved spec on [\`workflow/issue-42\`]({branch_url}). [Follow along in session]({session_url}).` |
| Implement complete | `**Draft PR ready** — [#17]({pr_url}) is open for you; still draft until you've tested locally. AI review runs next.` |
| Review start | `**Review** — Fresh eyes on the diff. [Session]({session_url}) · [PR #17]({pr_url})` |
| Review complete (approve) | `**Review: APPROVE** — Looks good to merge after your local pass. [PR review]({review_url})` |
| Review complete (notes) | `**Review: APPROVE WITH NOTES** — Shippable; a few non-blocking nits in the [review]({review_url}).` |
| Review complete (changes) | `**Review: REQUEST CHANGES** — Must-fix items in the [review]({review_url}); ping me in session after fixes.` |
| Handoff push failure | `**{Phase}** — Handoff didn't push ({one-line error}). Nothing else ran — [session]({session_url}) to retry.` |

## Write protocol

### Git (cloud routines — required)

Handoff writes **must** use **git commit + push** on `workflow/issue-{n}` via git/`gh` authenticated by the **[Claude GitHub App](https://github.com/apps/claude)**.

**Do:**

- Create branch at clarify start; commit handoff files on every clarify Q&A turn and at each phase start/complete
- `gh issue comment` for short human comments only
- Push after each handoff commit

**Do not:**

- Store artifacts in issue comments
- Use gists for handoff
- Create a second branch for the same issue
- Write application code during clarify

### Clarify start (create branch first)

After label swap to `workflow:clarify`:

1. Read issue; verify `workflow/PROJECT.md` exists on `base_branch`.
2. Create and push work branch:

```bash
git fetch origin
git checkout -b workflow/issue-{n} origin/{base_branch}
mkdir -p workflow/issues/{n}
# write state.json, task.md, language.md, requirements.md (initial shell)
git add workflow/issues/{n}/
git commit -m "workflow(issue-{n}): clarify — init handoff"
git push -u origin workflow/issue-{n}
```

3. Post short session comment with **both markdown links** (session + branch). See handoff-format **Clarify start comment**.
4. Ask first question.

### Clarify Q&A (each human answer)

1. Update files under `workflow/issues/{n}/`.
2. Commit and push:

```bash
git add workflow/issues/{n}/
git commit -m "workflow(issue-{n}): clarify — update requirements"
git push
```

### Clarify approve

1. Finalize `state.json` (`requirements_approved: true`, `status: done`, history).
2. Commit and push handoff files.
3. Post short approval comment.
4. **Swap labels last** — `workflow:implement`.

### Later phases (implement, review)

1. Checkout `workflow/issue-{n}`; pull latest.
2. Read `workflow/issues/{n}/state.json` and sibling files.
3. **At phase start** — update `state.json`; commit + push.
4. Do phase work (implement: code + PROJECT.md + ADRs on same branch).
5. **At phase complete** — update handoff files; commit + push.
6. Post short issue comment; **label swap last**.

**Never create a second work branch** for the same issue.

### On handoff write failure

1. Post a **short issue comment** — phase, push/commit failed, one-line error, session link.
2. **Stop** — do not swap labels, do not open PR.

## Read protocol

1. Branch: `workflow/issue-{n}` (convention from issue number, or `work_branch` in `state.json`).
2. Checkout branch; read `workflow/issues/{n}/state.json`.
3. If branch or `state.json` missing — clarify not started; implement must not run.
4. Load sibling files by path.

For implement: require `requirements_approved: true`.

**Legacy gist or v1 comment handoffs:** re-run clarify or migrate manually.

## Session comments

Posted when **clarify**, **implement**, or **review** starts. See [label-rules.md](label-rules.md).

**Label swap is always the last GitHub write** when advancing phases (see [label-rules.md](label-rules.md)).

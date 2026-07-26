# Branch Handoff Format (Ephemeral Files) + Human Issue Comments

Ephemeral machine files live on the **work branch** under `workflow/issues/{n}/`. Issue comments are **human-only** — engaging, short where possible. **Approved `requirements.md` is posted on the issue at clarify approve.** Never put `state.json` or other machine handoff in comments.

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

### Voice

Write like a sharp teammate in Claude Code — **warm, a little playful, never corny**. Professional always. Informative first: what happened, what you need from the human, links that work.

**Vary your wording every time.** Do not reuse the same opener, emoji, or sentence shape across issues or phases. Pull a detail from the issue title, a clarification, or the diff so the comment feels written for *this* task.

| Do | Don't |
|----|--------|
| Rotate phrasing — use the **example bank** below, mix lines, or invent fresh copy | Copy-paste the same template every run |
| One light touch of personality (metaphor, gentle humor, specific praise) | Robotic status lines ("Phase complete.") |
| Required markdown links (session, branch, PR) | Placeholder URLs or backticks without links |
| 1–2 emojis **max**, and skip them sometimes | Emoji every comment or stacked emoji |
| `state.json` / machine handoff on branch only | JSON or handoff dumps in comments |

**Exception — clarify approve:** header (varied, engaging) + `---` + **full approved `requirements.md`**. See below.

### Clarify start (required links)

Post **after** branch push. **Both links required:** Claude Code session + GitHub branch tree URL (`gh repo view --json nameWithOwner -q .nameWithOwner`).

**Example bank — pick one style, adapt to the issue:**

```markdown
**Clarify** — Time to interrogate the spec (gently). [Hop into the session]({session_url}) — I'll ask one question at a time. Notes accumulating on [`workflow/issue-42`]({branch_url}).

**Clarify** — Requirements workshop is open. [Your turn in the session]({session_url}); I'm keeping the living spec on [`workflow/issue-42`]({branch_url}).

**Clarify** — Before we write code, let's agree on what "done" means. [Session here]({session_url}) · handoff files on [`workflow/issue-42`]({branch_url}).
```

Optional: `<!-- ai-workflow:handoff v4 issue=42 branch=workflow/issue-42 -->`

### Clarify approve (post requirements)

1. **Header** — one line, varied (celebrate, confirm scope, nod to something specific from clarifications). Not always "Requirements approved".
2. `---`
3. **Full `requirements.md`** from branch (omit `## Approved by human` checkbox block).

**Header example bank:**

```markdown
**Locked in** — We agreed on retry semantics, backoff, and test coverage. Implement is queued unless you spot a hole below.

**Spec approved** — This is the contract for issue #42. Push back in the session if anything reads wrong.

**Green light on requirements** — Nice clarifications on the edge cases. Next phase picks up from here.
```

Then `---` and full requirements body. If over ~65k chars, post AC + clarifications + branch link; say so in the header.

### Implement

**Start — example bank:**

```markdown
**Implement** — Spec's approved; time to make it real on [`workflow/issue-42`]({branch_url}). [Watch or steer in session]({session_url}).

**Implement** — Rolling up sleeves on {short task reference from title}. Branch: [`workflow/issue-42`]({branch_url}) · [session]({session_url}).

**Implement** — Building against the approved AC. I'll mirror existing patterns where I can. [`workflow/issue-42`]({branch_url}) · [session]({session_url}).
```

**Complete — example bank:**

```markdown
**Draft PR is up** — [#17]({pr_url}) has the changes; left as **draft** so you can kick the tires locally before review.

**Ready for your eyes** — [#17]({pr_url}) is open (draft). Run it locally when you can; AI review follows.

**Implement done** — Code + tests on [#17]({pr_url}). Draft on purpose — mark ready when you're happy.
```

### Review

**Start — example bank:**

```markdown
**Review** — Fresh eyes, no implementation baggage. [Session]({session_url}) · diff in [#17]({pr_url}).

**Review** — Reading this like I've never seen the repo. [#17]({pr_url}) · [join in]({session_url}) if curious.

**Review** — Sanity-checking against the spec and the diff. [#17]({pr_url}) · [session]({session_url}).
```

**Complete — example bank** (link to **one** PR comment, not a formal review):

```markdown
**Review: APPROVE WITH NOTES** — Shippable; one small nit in the [PR comment]({pr_comment_url}). Full autopsy on branch.

**Review: APPROVE** — Matches the spec; implement test results look good on paper. [Summary on the PR]({pr_comment_url}).

**Review: REQUEST CHANGES** — Found blockers — details in the [PR comment]({pr_comment_url}). Happy to re-review after fixes.
```

### Failures

```markdown
**Clarify** — Handoff push failed ({error}). Nothing else ran — [session]({session_url}) when you're ready to retry.

**Implement** — Couldn't push handoff ({error}). Branch may be stale; [session]({session_url}).
```

## Write protocol

### Git (cloud routines — required)

Handoff writes **must** use **git commit + push** on `workflow/issue-{n}` via git/`gh` authenticated by the **[Claude GitHub App](https://github.com/apps/claude)**.

**Do:**

- Create branch at clarify start; commit handoff files on every clarify Q&A turn and at each phase start/complete
- `gh issue comment` for human comments (including **approved requirements** at clarify approve)
- Push after each handoff commit

**Do not:**

- Store machine handoff in issue comments (`state.json`, raw handoff paths) — **except** publishing approved `requirements.md` at clarify approve
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
3. Post approval comment — engaging header + `---` + **full approved `requirements.md`**. See **Clarify approve (post requirements)** above.
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

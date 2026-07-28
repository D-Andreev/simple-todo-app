# Workflow metrics (`metrics.jsonl`)

Append-only analytics log on **`workflow/state`** at `issues/{n}/metrics.jsonl`.

A later job reads this file (plus `state.json`) — agents **only append**, never rewrite or delete lines.

Full handoff layout: [handoff-format.md](handoff-format.md)

## File rules

| Rule | Detail |
|------|--------|
| Path | `issues/{n}/metrics.jsonl` on `workflow/state` |
| Format | One JSON object per line (JSONL); UTF-8; no trailing commas |
| Create | Touch empty file at clarify start (or create on first append) |
| Write | **Append** one event, then commit with other handoff updates |
| Do not | Edit prior lines, pretty-print the whole file, or put metrics on the work branch |

## Common fields (every event)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ts` | string (ISO 8601) | yes | Event time, UTC |
| `issue_number` | number | yes | GitHub issue number |
| `phase` | string | yes | `clarify` \| `implement` \| `review` |
| `event` | string | yes | Event type (below) |
| `session_id` | string \| null | no | Claude session id when known |
| `schema_version` | number | yes | Always `1` for this schema |

---

## Clarify: `clarify_turn`

Append **once per answered (or skipped) question**, when committing the Q&A handoff update — not when asking the question.

```json
{
  "schema_version": 1,
  "ts": "2026-07-28T10:15:00.000Z",
  "issue_number": 42,
  "phase": "clarify",
  "event": "clarify_turn",
  "session_id": null,
  "q_index": 1,
  "category": "edge_case",
  "recommendation_outcome": "accepted_recommendation",
  "question": "Should retries apply to all notification channels or email only?"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `q_index` | number | yes | 1-based; matches Clarifications table `#` |
| `category` | string | yes | **Only** values from [Question categories](#question-categories) |
| `recommendation_outcome` | string | yes | **Only** values from [Recommendation outcomes](#recommendation-outcomes) |
| `question` | string | yes | Short question text (one line preferred) |

### Question categories

Pick **exactly one** per question. Do not invent new categories.

| `category` | Use when the question is mainly about… |
|------------|------------------------------------------|
| `scope` | In/out of this issue; deferrals; MVP vs later |
| `behavior` | Happy-path product/UX behavior |
| `edge_case` | Boundaries, empty/null, concurrency, races, odd inputs |
| `data_model` | Entities, fields, persistence, migrations |
| `api_contract` | APIs, payloads, compatibility, versioning |
| `error_handling` | Failures, retries, timeouts, user-visible errors |
| `security` | Authn/authz, secrets, PII, tenancy |
| `performance` | Latency, throughput, caching, scale |
| `testing` | What/how to test; coverage expectations |
| `ops` | Config, flags, deploy, observability, runbooks |
| `domain_language` | Naming, terms for `language.md` |
| `dependency` | Libraries, services, external systems |

### Recommendation outcomes

Judge the human’s **session** answer against the recommended answer you offered. Use **exactly one**:

| `recommendation_outcome` | Meaning |
|--------------------------|---------|
| `skipped` | Human skipped / deferred / said to skip this question |
| `accepted_recommendation` | Went with the recommendation as-is (or equivalent) |
| `accepted_with_adjustment` | Accepted the recommendation but changed details |
| `rejected_recommendation` | Chose a different approach than the recommendation |

---

## Review: `review_completed`

Append **once** at review complete, in the same commit as `review-report.md` / final `state.json`.

```json
{
  "schema_version": 1,
  "ts": "2026-07-28T14:02:00.000Z",
  "issue_number": 42,
  "phase": "review",
  "event": "review_completed",
  "session_id": null,
  "verdict": "APPROVE WITH NOTES",
  "critical_count": 0,
  "minor_count": 1,
  "notes_count": 2
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `verdict` | string | yes | `APPROVE` \| `APPROVE WITH NOTES` \| `REQUEST CHANGES` |
| `critical_count` | number | yes | 🔴 must-fix / critical findings (integer ≥ 0) |
| `minor_count` | number | yes | 🟡 minor findings (integer ≥ 0) |
| `notes_count` | number | yes | Non-blocking notes / suggestions not counted as critical/minor (integer ≥ 0) |

**Counting rules**

- Align with `review-report.md` (Issues found + Principles critical/suggestions).
- `critical_count` → must-fix / 🔴 / Critical sections.
- `minor_count` → 🟡 / minor issues that are still “findings.”
- `notes_count` → shippable nits and “nice to have” that are not minor findings.
- Do not double-count the same finding across buckets.
- `APPROVE` usually has all zeros; `APPROVE WITH NOTES` usually has `notes_count` and/or `minor_count` > 0 and `critical_count` = 0; `REQUEST CHANGES` usually has `critical_count` ≥ 1.

---

## Append recipe

```bash
# On workflow/state, after preparing the event object:
printf '%s\n' '{"schema_version":1,...}' >> issues/{n}/metrics.jsonl
git add issues/{n}/metrics.jsonl
# commit with the rest of the handoff update
```

Validate mentally: single line, valid JSON, enums only from this doc.

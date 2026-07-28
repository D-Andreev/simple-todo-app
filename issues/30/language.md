## Language

**Priority**: A predefined urgency level on a `Todo` — `low`, `mid`, or `high`. Optional on `todo add` via `--priority <low|mid|high>`; defaults to `mid` when omitted, so every todo always has a priority. A stored or imported todo with no `priority` field (legacy data from before this change) is treated as `mid`, not `null`/unset.
_Avoid_: Severity, urgency (as the field name), importance

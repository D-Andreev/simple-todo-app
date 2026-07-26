# Language additions: issue-22

**List ordering**: The unconditional display order applied to `todo list` and `todo filter` results (text and `--json`, one-shot and `interactive`): grouped by `state` (`pending` first, `done` second), sorted by `title` case-insensitively ascending within each group, `createdAt` ascending as tiebreaker. No `--sort`/`--group` flag — this is the only supported order.

Merged into `workflow/PROJECT.md` at implement start.

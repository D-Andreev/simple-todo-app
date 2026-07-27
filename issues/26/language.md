# Language (issue-26, draft)

Terms below are proposed during clarify and merged into `workflow/PROJECT.md` `## Language` at implement. None are final until resolved with the human.

No new `State` values — this issue only adds a transition back to the existing `pending` state.

**Reopen**: The action of moving a `done` todo back to `pending`, invoked via `todo reopen <id>`.
_Avoid_: `pending` (as a command name — reserved for the existing `--state pending` filter value), undo, restore

# Requirements: issue-36

## Original ask
Make the help command better, more descriptive. Maybe add some ascii art

## Clarifications
| # | Question | Answer | Recommended |
|---|----------|--------|-------------|
| 1 | Should the improved help cover the one-shot CLI (`todo --help`), interactive mode's `help` command, or both? | Both — keep them consistent | Both, kept consistent |
| 2 | Where should the ASCII art appear — help output only, interactive startup too, or every subcommand's `--help`? | Help output only (`todo --help` and interactive `help`) | Same |
| 3 | What should "more descriptive" change beyond wording — flat list, grouped sections, or grouped sections + per-command usage examples? | Grouped sections + per-command usage examples | Same |
| 4 | What should the ASCII art depict — a "TODO" banner, a checklist motif, or something else? | "TODO" ASCII banner (figlet-style block letters) | Same |
| 5 | Is the proposed grouping (Manage todos / Find & filter / Data / Session) acceptable? | Yes | Same |

## Acceptance criteria
- [ ] ...

## Approved by human
- [ ] Pending — say `approve requirements` in the session when ready

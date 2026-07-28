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
| 6 | Should new tests assert the grouped headers/banner/examples, or is passing existing `.toContain()` checks enough? | Add new targeted assertions (headers, banner, one example line) | Same |
| 7 | Should bare `todo` (no args/subcommand) now print the improved help + banner, or stay as-is? | Yes, make bare `todo` print help | Same |
| 8 | Should individual subcommand help pages (e.g. `todo add --help`) also get usage examples, or stay untouched? | Leave subcommand help pages untouched | Same |

## Acceptance criteria
- [x] `todo --help`, bare `todo` (no args), and interactive mode's `help` command all show the improved output; per-subcommand help (e.g. `todo add --help`) is untouched
- [x] A compact "TODO" ASCII banner (figlet-style block letters, plain text, no color codes) appears above the help text on all three of those surfaces, and nowhere else
- [x] Commands are grouped into four sections: **Manage todos** (`add`, `update`, `done`, `reopen`, `delete`, `clear`), **Find & filter** (`list`, `filter`), **Data** (`export`, `import`), **Session** (`interactive` — one-shot only; `help`, `exit`, `quit` — interactive only)
- [x] Each command line includes a one-line usage example (e.g. `add "Buy milk" --due 2026-08-01 --priority high`) alongside its description
- [x] The one-shot CLI and interactive mode share the same grouping/description/example content so they stay consistent
- [x] Existing tests continue to pass unmodified (`.toContain()`-style assertions on command names/flags in `tests/e2e/cli.e2e.test.ts`)
- [x] New test assertions added for: presence of each group header, presence of the ASCII banner text, and presence of at least one example line
- [x] `add --help` (and other subcommand `--help` pages) still do not leak unrelated flags (e.g. `--json` must still not appear on `add --help`)

## Approved by human
- [x] Approved — `approve requirements` said in the session

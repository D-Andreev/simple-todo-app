# Task: issue-36

## Title
Improve help command

## Original ask (from issue body)
> Make the help command better, more descriptive. Maybe add some ascii art

## Context
- Repo: `simple-todo-app` — Node.js/TypeScript CLI todo manager (`todo <command> <args>`).
- One-shot CLI (`src/index.ts`) has no custom `help` command — help text comes from Commander's built-in `--help`/`-h` and per-command `--help`.
- Interactive mode (`src/interactive.ts`) has an explicit `help` command that prints a hardcoded `HELP_TEXT` block (one line per command, plain text, no examples or grouping).
- No ASCII art or branding currently exists anywhere in the CLI output.

## Notes
This file tracks the raw ask; `requirements.md` holds the clarified, agreed spec.

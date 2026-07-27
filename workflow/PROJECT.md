# simple-todo-app

A todo application demonstrating core patterns and best practices.

## Overview

Simple todo app built as a learning/reference project. Current state: early scaffolding, ready for development.

## Main Features

- (To be defined)

## Stack

- **Language**: (To be defined)
- **Build**: (To be defined)
- **Testing**: (To be defined)
- **Deployment**: (To be defined)

## Development

- **Repo path**: `/Users/dandreev/go/src/github.com/simple-todo-app`
- **Main branch**: `main`
- **Workflow files**: `.claude/workflows/`

## Language

**CLI**: A command-line interface that users invoke via `todo <command> <args>`. Built with Node.js, uses `commander` for subcommand routing.
_Avoid_: Terminal UI, GUI, web interface

**Todo**: A discrete task item with an id (uuid), title, and state (pending or done).
_Avoid_: Task, issue, work item

**State**: The lifecycle status of a todo. Valid values: `pending` (not yet done) or `done` (completed).
_Avoid_: Status, condition, flag

**Storage**: A JSON file at `~/.simple-todo/todos.json` on the user's machine, persisting todos between CLI invocations.
_Avoid_: Database, cloud sync, multi-user storage

**Filter**: A dedicated CLI command (`todo filter <name>`) that returns all todos whose title contains a name search term, case-insensitively.
_Avoid_: Search, query, grep

**Interactive mode**: A REPL started via `todo interactive` that reads commands from stdin (one per line, no `todo` prefix, no quoting), dispatches them to the same handlers as the one-shot CLI, and loops until `exit`, `quit`, EOF (Ctrl+D), or SIGINT (Ctrl+C).
_Avoid_: REPL mode, shell mode, TUI mode

**JSON output**: A `--json` flag on `list` and `filter` that emits todos as a JSON array of raw internal `Todo` objects (`{ id, title, state, createdAt }`, full uuid, epoch-ms) instead of the human-readable formatted rows, for scripting (e.g. piping through `jq`).
_Avoid_: `--format json`, `-j`, pretty-printed-only output

**List ordering**: The unconditional display order applied to `todo list` and `todo filter` results (text and `--json`, one-shot and `interactive`): todos are grouped by `state` (`pending` group first, `done` group second), sorted by `title` case-insensitively ascending within each group, with `createdAt` ascending as the tiebreaker for identical case-insensitive titles. There is no flag to opt out or restore the old flat `createdAt` order.
_Avoid_: `--sort`, `--group`, raw creation-time order

**Due date**: An optional `YYYY-MM-DD` date-only value on a `Todo`, set via `--due` on `todo add`, shown in `list`/`filter` text rows and as `dueDate` in `--json` output. Does not affect the existing state → title → `createdAt` sort order.
_Avoid_: Deadline, expiry, target date

**Overdue**: A pending todo whose due date is earlier than today, matched via `todo filter --overdue`.
_Avoid_: Late, expired

**Reopen**: The action of moving a `done` todo back to `pending`, invoked via `todo reopen <id>`.
_Avoid_: `pending` (as a command name — reserved for the existing `--state pending` filter value), undo, restore

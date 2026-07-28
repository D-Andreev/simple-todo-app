# Simple Todo App

A simple command-line todo manager built with TypeScript and Node.js.

## Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Usage

Run the CLI with:
```bash
npm start -- <command> [options]
```

Or after installation as a global package:
```bash
todo <command> [options]
```

### Commands

#### Add a todo
```bash
npm start -- add "Buy groceries"
npm start -- add "Buy groceries" --priority high
```
Output:
```
Added: a1b2c3d4 pending Buy groceries
```
`--priority <low|mid|high>` is optional and defaults to `mid` when omitted.

#### List all todos
```bash
npm start -- list
```
Output:
```
a1b2c3d4 pending Buy groceries (created: 2026-07-26T10:34:28.000Z) priority: high
b2c3d4e5 pending Walk the dog (created: 2026-07-26T10:35:15.000Z) priority: mid
c3d4e5f6 done Clean the house (created: 2026-07-26T10:36:00.000Z) priority: mid
```

#### Mark a todo as done
```bash
npm start -- done a1b2c3d4
```
Output:
```
Done: a1b2c3d4 Buy groceries
```

#### Reopen a done todo
```bash
npm start -- reopen a1b2c3d4
```
Output:
```
Reopened: a1b2c3d4 Buy groceries
```

#### Update a todo's title
```bash
npm start -- update a1b2c3d4 "Buy groceries and cook dinner"
```
Output:
```
Updated: a1b2c3d4 Buy groceries and cook dinner
```

#### Delete a todo
```bash
npm start -- delete a1b2c3d4
```
Output:
```
Deleted todo a1b2c3d4
```

#### Export todos
```bash
npm start -- export
npm start -- export --file backup.json
```
With no flags, prints the full todos array as JSON to stdout. With `--file <path>`, writes it to that path instead.

#### Import todos
```bash
npm start -- import < backup.json
npm start -- import --file backup.json
npm start -- import --file backup.json --replace
```
With no flags, reads a JSON todos array from stdin and merges it into the existing list — an imported todo whose `id` already exists locally is skipped. With `--file <path>`, reads from that path instead of stdin. With `--replace`, the imported list wholesale replaces the existing todos instead of merging.

If the parsed payload isn't a JSON array, the import aborts entirely with an error and no todos are added. Individual entries that fail validation (missing/wrong-typed fields, bad `state`, malformed `dueDate`, bad `priority`, missing `id`) are skipped and counted separately from id collisions; `id` is never auto-generated. An entry with no `priority` field is treated as `mid`, not invalid. The command reports counts of imported, skipped (id collision), and skipped (invalid) todos.

## Development

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Storage

Todos are persisted to a JSON file stored in your user's data directory. The storage format includes:
- `id`: Unique identifier (UUID)
- `title`: Todo description
- `state`: Current state (`pending` or `done`)
- `createdAt`: Timestamp when created
- `dueDate`: Optional due date (`YYYY-MM-DD`) or `null`
- `priority`: Priority (`low`, `mid`, or `high`); a stored entry with no `priority` field is treated as `mid`

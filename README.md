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
```
Output:
```
Added: a1b2c3d4 pending Buy groceries
```

#### List all todos
```bash
npm start -- list
```
Output:
```
a1b2c3d4 pending Buy groceries (created: 2026-07-26T10:34:28.000Z)
b2c3d4e5 pending Walk the dog (created: 2026-07-26T10:35:15.000Z)
c3d4e5f6 done Clean the house (created: 2026-07-26T10:36:00.000Z)
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

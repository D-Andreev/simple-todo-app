// Centralized command descriptions to keep CLI and help output in sync
export const COMMAND_DESCRIPTIONS = {
  add: 'Add a new todo',
  list: 'List all todos',
  done: 'Mark a todo as done',
  reopen: 'Move a done todo back to pending',
  update: "Update a todo's title",
  delete: 'Delete a todo',
  filter: 'Filter todos by name, state, priority, tag, and/or due date (exact, before, after, today, overdue)',
  clear: 'Clear todos, optionally by state',
  export: 'Export todos as JSON to stdout, or to a file with --file',
  import: 'Import todos from stdin, or from a file with --file (merges by default)',
  interactive: 'Start interactive mode',
} as const;

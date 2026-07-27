import * as readline from 'readline';
import * as commands from './commands';

const PROMPT = 'todo> ';

const HELP_TEXT = [
  'add <title> [--due <date>]  Add a new todo',
  'list                     List all todos',
  'done <id>                Mark a todo as done',
  'reopen <id>              Move a done todo back to pending',
  'update <id> <newTitle>   Update a todo\'s title',
  'delete <id>              Delete a todo',
  'filter [name] [--state <state>] [--due <date>] [--overdue]  Filter todos by name, state, and/or due date',
  'clear [--state <state>]  Clear todos, optionally by state',
  'exit                     Exit interactive mode',
  'quit                     Exit interactive mode',
].join('\n');

type Handler = (rest: string) => string;

const handlers: Record<string, Handler> = {
  add: (rest) => {
    const { title, due } = parseAddArgs(rest);
    return commands.handleAdd(title, due);
  },
  list: () => commands.handleList(),
  done: (rest) => commands.handleDone(rest.trim()),
  reopen: (rest) => commands.handleReopen(rest.trim()),
  update: (rest) => {
    const spaceIdx = rest.indexOf(' ');
    const id = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx);
    const newTitle = spaceIdx === -1 ? '' : rest.slice(spaceIdx + 1);
    return commands.handleUpdate(id, newTitle);
  },
  delete: (rest) => commands.handleDelete(rest.trim()),
  filter: (rest) => {
    const { name, state, due, overdue } = parseFilterArgs(rest);
    return commands.handleFilter(name, state, undefined, due, overdue);
  },
  clear: (rest) => {
    const { state } = parseClearArgs(rest);
    return commands.handleClear(state);
  },
};

function parseAddArgs(rest: string): { title: string; due?: string } {
  const dueMatch = rest.match(/--due\s+(\S+)/);
  const due = dueMatch ? dueMatch[1] : undefined;
  const title = (dueMatch ? rest.slice(0, dueMatch.index) : rest).trim();
  return { title, due };
}

function parseFilterArgs(rest: string): { name?: string; state?: string; due?: string; overdue?: boolean } {
  let remaining = rest;

  const stateMatch = remaining.match(/--state\s+(\S+)/);
  const state = stateMatch ? stateMatch[1] : undefined;
  if (stateMatch) {
    remaining = remaining.slice(0, stateMatch.index) + remaining.slice(stateMatch.index! + stateMatch[0].length);
  }

  const dueMatch = remaining.match(/--due\s+(\S+)/);
  const due = dueMatch ? dueMatch[1] : undefined;
  if (dueMatch) {
    remaining = remaining.slice(0, dueMatch.index) + remaining.slice(dueMatch.index! + dueMatch[0].length);
  }

  const overdueMatch = remaining.match(/--overdue\b/);
  const overdue = overdueMatch ? true : undefined;
  if (overdueMatch) {
    remaining = remaining.slice(0, overdueMatch.index) + remaining.slice(overdueMatch.index! + overdueMatch[0].length);
  }

  const nameOnly = remaining.trim();
  return { name: nameOnly === '' ? undefined : nameOnly, state, due, overdue };
}

function parseClearArgs(rest: string): { state?: string } {
  const stateMatch = rest.match(/--state\s+(\S+)/);
  return { state: stateMatch ? stateMatch[1] : undefined };
}

export function runInteractive(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: PROMPT,
  });

  rl.prompt();

  rl.on('line', (line) => {
    const trimmed = line.trim();

    if (trimmed === '') {
      rl.prompt();
      return;
    }

    const spaceIdx = trimmed.indexOf(' ');
    const command = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    const rest = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1);

    if (command === 'exit' || command === 'quit') {
      rl.close();
      return;
    }

    if (command === 'help') {
      console.log(HELP_TEXT);
      rl.prompt();
      return;
    }

    const handler = handlers[command];
    if (!handler) {
      console.log(`Error: Unknown command: ${trimmed}`);
      rl.prompt();
      return;
    }

    try {
      console.log(handler(rest));
    } catch (error) {
      console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    rl.prompt();
  });

  rl.on('SIGINT', () => {
    rl.close();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

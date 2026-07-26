import * as readline from 'readline';
import * as commands from './commands';

const PROMPT = 'todo> ';

const HELP_TEXT = [
  'add <title>              Add a new todo',
  'list                     List all todos',
  'done <id>                Mark a todo as done',
  'update <id> <newTitle>   Update a todo\'s title',
  'delete <id>              Delete a todo',
  'filter [name] [--state <state>]  Filter todos by name and/or state',
  'exit                     Exit interactive mode',
  'quit                     Exit interactive mode',
].join('\n');

type Handler = (rest: string) => string;

const handlers: Record<string, Handler> = {
  add: (rest) => commands.handleAdd(rest),
  list: () => commands.handleList(),
  done: (rest) => commands.handleDone(rest.trim()),
  update: (rest) => {
    const spaceIdx = rest.indexOf(' ');
    const id = spaceIdx === -1 ? rest : rest.slice(0, spaceIdx);
    const newTitle = spaceIdx === -1 ? '' : rest.slice(spaceIdx + 1);
    return commands.handleUpdate(id, newTitle);
  },
  delete: (rest) => commands.handleDelete(rest.trim()),
  filter: (rest) => {
    const { name, state } = parseFilterArgs(rest);
    return commands.handleFilter(name, state);
  },
};

function parseFilterArgs(rest: string): { name?: string; state?: string } {
  const stateMatch = rest.match(/--state\s+(\S+)/);
  const state = stateMatch ? stateMatch[1] : undefined;
  const nameOnly = (stateMatch ? rest.slice(0, stateMatch.index) : rest).trim();
  return { name: nameOnly === '' ? undefined : nameOnly, state };
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

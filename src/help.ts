export type HelpMode = 'cli' | 'interactive';

const BANNER_LETTERS: Record<string, string[]> = {
  T: [' _____ ', '|_   _|', '  | |  ', '  | |  ', '  |_|  '],
  O: ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\___/ '],
  D: [' ____  ', '|  _ \\ ', '| | | |', '| |_| |', '|____/ '],
};

function renderBanner(word: string): string {
  const rows: string[] = [];
  for (let row = 0; row < 5; row++) {
    rows.push(
      word
        .split('')
        .map((letter) => BANNER_LETTERS[letter][row])
        .join('')
    );
  }
  return rows.join('\n');
}

export const BANNER = renderBanner('TODO');

interface CommandEntry {
  example: string;
  description: string;
  modes: HelpMode[];
}

interface CommandGroup {
  title: string;
  commands: CommandEntry[];
}

const GROUPS: CommandGroup[] = [
  {
    title: 'Manage todos',
    commands: [
      {
        example: 'add "Buy milk" --due 2026-08-01 --priority high --tag errand',
        description: 'Add a new todo',
        modes: ['cli', 'interactive'],
      },
      {
        example: 'update <id> "Buy milk and eggs"',
        description: "Update a todo's title",
        modes: ['cli', 'interactive'],
      },
      {
        example: 'done <id>',
        description: 'Mark a todo as done',
        modes: ['cli', 'interactive'],
      },
      {
        example: 'reopen <id>',
        description: 'Move a done todo back to pending',
        modes: ['cli', 'interactive'],
      },
      {
        example: 'delete <id>',
        description: 'Delete a todo',
        modes: ['cli', 'interactive'],
      },
      {
        example: 'clear --state done',
        description: 'Clear todos, optionally by state',
        modes: ['cli', 'interactive'],
      },
    ],
  },
  {
    title: 'Find & filter',
    commands: [
      {
        example: 'list --json',
        description: 'List all todos',
        modes: ['cli', 'interactive'],
      },
      {
        example:
          'filter buy --state pending --priority high --due-before 2026-09-01 --due-after 2026-01-01 --due-today --tag errand --json',
        description: 'Filter todos by name, state, priority, tag, and/or due date (exact, before, after, today)',
        modes: ['cli', 'interactive'],
      },
    ],
  },
  {
    title: 'Data',
    commands: [
      {
        example: 'export --file todos.json',
        description: 'Export todos as JSON to stdout, or to a file with --file',
        modes: ['cli', 'interactive'],
      },
      {
        example: 'import --file todos.json',
        description: 'Import todos from stdin, or from a file with --file (merges by default)',
        modes: ['cli', 'interactive'],
      },
    ],
  },
  {
    title: 'Session',
    commands: [
      {
        example: 'interactive',
        description: 'Start interactive mode',
        modes: ['cli'],
      },
      {
        example: 'help',
        description: 'Show this help',
        modes: ['interactive'],
      },
      {
        example: 'exit',
        description: 'Exit interactive mode',
        modes: ['interactive'],
      },
      {
        example: 'quit',
        description: 'Exit interactive mode',
        modes: ['interactive'],
      },
    ],
  },
];

const ALIGN_CAP = 24;

function renderGroups(mode: HelpMode): string {
  const sections = GROUPS.map((group) => {
    const commands = group.commands.filter((command) => command.modes.includes(mode));
    if (commands.length === 0) {
      return null;
    }
    const width = Math.min(ALIGN_CAP, Math.max(...commands.map((command) => command.example.length)));
    const lines = commands.map((command) =>
      command.example.length > width
        ? `  ${command.example}  ${command.description}`
        : `  ${command.example.padEnd(width)}   ${command.description}`
    );
    return [`${group.title}:`, ...lines].join('\n');
  }).filter((section): section is string => section !== null);

  return sections.join('\n\n');
}

export function renderHelp(mode: HelpMode): string {
  const intro =
    mode === 'cli'
      ? 'todo - manage your todos from the command line\n\nUsage: todo <command> [options]'
      : 'todo interactive - type a command below (no "todo" prefix needed)';

  const footer =
    mode === 'cli' ? "Run 'todo <command> --help' for details on a specific command." : '';

  return [BANNER, '', intro, '', renderGroups(mode), footer].filter((part) => part !== '').join('\n\n');
}

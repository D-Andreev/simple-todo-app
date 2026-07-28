import * as readline from 'readline';
import * as commands from './commands';

const PROMPT = 'todo> ';

const HELP_TEXT = [
  'add <title> [--due <date>] [--priority <priority>] [--tag <name> ...]  Add a new todo',
  'list [--json]            List all todos',
  'done <id>                Mark a todo as done',
  'reopen <id>              Move a done todo back to pending',
  'update <id> <newTitle>   Update a todo\'s title',
  'delete <id>              Delete a todo',
  'filter [name] [--state <state>] [--due <date>] [--overdue] [--priority <priority>] [--due-before <date>] [--due-after <date>] [--due-today] [--tag <name>] [--json]  Filter todos by name, state, priority, tag, due date, date range, and/or JSON output',
  'clear [--state <state>]  Clear todos, optionally by state',
  'exit                     Exit interactive mode',
  'quit                     Exit interactive mode',
].join('\n');

type Handler = (rest: string) => string;

const handlers: Record<string, Handler> = {
  add: (rest) => {
    const { title, due, priority, tags } = parseAddArgs(rest);
    return commands.handleAdd(title, due, priority, tags);
  },
  list: (rest) => {
    const { json } = parseListArgs(rest);
    return commands.handleList(json);
  },
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
    const { name, state, due, overdue, priority, dueBefore, dueAfter, dueToday, tag, json } = parseFilterArgs(rest);
    return commands.handleFilter(name, state, json, due, overdue, priority, dueBefore, dueAfter, dueToday, tag);
  },
  clear: (rest) => {
    const { state } = parseClearArgs(rest);
    return commands.handleClear(state);
  },
};

function parseAddArgs(rest: string): { title: string; due?: string; priority?: string; tags: string[] } {
  let remaining = rest;

  const priorityMatch = remaining.match(/--priority\s+(\S+)/);
  const priority = priorityMatch ? priorityMatch[1] : undefined;
  if (priorityMatch) {
    remaining =
      remaining.slice(0, priorityMatch.index) + remaining.slice(priorityMatch.index! + priorityMatch[0].length);
  }

  const tags: string[] = [];
  const tagMatches = [...remaining.matchAll(/--tag\s+/g)];
  for (let i = 0; i < tagMatches.length; i++) {
    const match = tagMatches[i];
    const startIdx = match.index! + match[0].length;
    const nextFlagIdx = remaining.indexOf('--', startIdx);
    const endIdx = nextFlagIdx === -1 ? remaining.length : nextFlagIdx;
    const tagValue = remaining.slice(startIdx, endIdx).trim();
    if (tagValue) {
      tags.push(tagValue);
    }
  }

  remaining = remaining.replace(/--tag\s+[^-]*(?=--|\s*$)/g, '').trim();

  const dueMatch = remaining.match(/--due\s+(\S+)/);
  const due = dueMatch ? dueMatch[1] : undefined;
  const title = (dueMatch ? remaining.slice(0, dueMatch.index) : remaining).trim();
  return { title, due, priority, tags };
}

function parseFilterArgs(
  rest: string
): {
  name?: string;
  state?: string;
  due?: string;
  overdue?: boolean;
  priority?: string;
  dueBefore?: string;
  dueAfter?: string;
  dueToday?: boolean;
  tag?: string;
  json?: boolean;
} {
  let remaining = rest;

  const stateMatch = remaining.match(/--state\s+(\S+)/);
  const state = stateMatch ? stateMatch[1] : undefined;
  if (stateMatch) {
    remaining = remaining.slice(0, stateMatch.index) + remaining.slice(stateMatch.index! + stateMatch[0].length);
  }

  let tag: string | undefined;
  const tagMatch = remaining.match(/--tag\s+/);
  if (tagMatch) {
    const startIdx = tagMatch.index! + tagMatch[0].length;
    const nextFlagIdx = remaining.indexOf('--', startIdx);
    const endIdx = nextFlagIdx === -1 ? remaining.length : nextFlagIdx;
    tag = remaining.slice(startIdx, endIdx).trim();
    if (!tag) tag = undefined;
    remaining = remaining.slice(0, tagMatch.index) + remaining.slice(endIdx);
  }

  const dueBeforeMatch = remaining.match(/--due-before\s+(\S+)/);
  const dueBefore = dueBeforeMatch ? dueBeforeMatch[1] : undefined;
  if (dueBeforeMatch) {
    remaining =
      remaining.slice(0, dueBeforeMatch.index) + remaining.slice(dueBeforeMatch.index! + dueBeforeMatch[0].length);
  }

  const dueAfterMatch = remaining.match(/--due-after\s+(\S+)/);
  const dueAfter = dueAfterMatch ? dueAfterMatch[1] : undefined;
  if (dueAfterMatch) {
    remaining =
      remaining.slice(0, dueAfterMatch.index) + remaining.slice(dueAfterMatch.index! + dueAfterMatch[0].length);
  }

  const dueTodayMatch = remaining.match(/--due-today\b/);
  const dueToday = dueTodayMatch ? true : undefined;
  if (dueTodayMatch) {
    remaining = remaining.slice(0, dueTodayMatch.index) + remaining.slice(dueTodayMatch.index! + dueTodayMatch[0].length);
  }

  const dueMatch = remaining.match(/--due\s+(\S+)/);
  const due = dueMatch ? dueMatch[1] : undefined;
  if (dueMatch) {
    remaining = remaining.slice(0, dueMatch.index) + remaining.slice(dueMatch.index! + dueMatch[0].length);
  }

  const priorityMatch = remaining.match(/--priority\s+(\S+)/);
  const priority = priorityMatch ? priorityMatch[1] : undefined;
  if (priorityMatch) {
    remaining =
      remaining.slice(0, priorityMatch.index) + remaining.slice(priorityMatch.index! + priorityMatch[0].length);
  }

  const overdueMatch = remaining.match(/--overdue\b/);
  const overdue = overdueMatch ? true : undefined;
  if (overdueMatch) {
    remaining = remaining.slice(0, overdueMatch.index) + remaining.slice(overdueMatch.index! + overdueMatch[0].length);
  }

  const jsonMatch = remaining.match(/--json\b/);
  const json = jsonMatch ? true : undefined;
  if (jsonMatch) {
    remaining = remaining.slice(0, jsonMatch.index) + remaining.slice(jsonMatch.index! + jsonMatch[0].length);
  }

  const nameOnly = remaining.trim();
  return {
    name: nameOnly === '' ? undefined : nameOnly,
    state,
    due,
    overdue,
    priority,
    dueBefore,
    dueAfter,
    dueToday,
    tag,
    json,
  };
}

function parseClearArgs(rest: string): { state?: string } {
  const stateMatch = rest.match(/--state\s+(\S+)/);
  return { state: stateMatch ? stateMatch[1] : undefined };
}

function parseListArgs(rest: string): { json?: boolean } {
  const jsonMatch = rest.match(/--json\b/);
  return { json: jsonMatch ? true : undefined };
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

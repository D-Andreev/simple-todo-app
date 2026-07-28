#!/usr/bin/env node

import { Command } from 'commander';
import * as commands from './commands';
import { runInteractive } from './interactive';
import { renderHelp } from './help';
import { COMMAND_DESCRIPTIONS } from './descriptions';

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 0 || rawArgs[0] === '--help' || rawArgs[0] === '-h') {
  console.log(renderHelp('cli'));
  process.exit(0);
}

const program = new Command();

program
  .name('todo')
  .description('A simple CLI for managing todos')
  .version('1.0.0');

program
  .command('add <title>')
  .description(COMMAND_DESCRIPTIONS.add)
  .option('--due <date>', 'Set a due date (YYYY-MM-DD)')
  .option('--priority <priority>', 'Set a priority (low, mid, or high; defaults to mid)')
  .option('--tag <name>', 'Attach a tag (repeatable)', (val: string, prev: string[]) => prev.concat([val]), [] as string[])
  .action((title: string, options: { due?: string; priority?: string; tag: string[] }) => {
    try {
      const message = commands.handleAdd(title, options.due, options.priority, options.tag);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description(COMMAND_DESCRIPTIONS.list)
  .option('--json', 'Output as JSON')
  .action((options: { json?: boolean }) => {
    try {
      const message = commands.handleList(options.json);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('done <id>')
  .description(COMMAND_DESCRIPTIONS.done)
  .action((id: string) => {
    try {
      const message = commands.handleDone(id);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('reopen <id>')
  .description(COMMAND_DESCRIPTIONS.reopen)
  .action((id: string) => {
    try {
      const message = commands.handleReopen(id);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('update <id> <newTitle>')
  .description(COMMAND_DESCRIPTIONS.update)
  .action((id: string, newTitle: string) => {
    try {
      const message = commands.handleUpdate(id, newTitle);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('delete <id>')
  .description(COMMAND_DESCRIPTIONS.delete)
  .action((id: string) => {
    try {
      const message = commands.handleDelete(id);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('filter [name]')
  .description(COMMAND_DESCRIPTIONS.filter)
  .option('--state <state>', 'Filter by state (pending or done)')
  .option('--due <date>', 'Filter by exact due date (YYYY-MM-DD)')
  .option('--overdue', 'Show pending todos whose due date has passed')
  .option('--priority <priority>', 'Filter by priority (low, mid, or high)')
  .option('--due-before <date>', 'Filter by due date strictly before this date (YYYY-MM-DD)')
  .option('--due-after <date>', 'Filter by due date strictly after this date (YYYY-MM-DD)')
  .option('--due-today', 'Show todos whose due date is today')
  .option('--tag <name>', 'Filter by tag (case-insensitive)')
  .option('--json', 'Output as JSON')
  .action(
    (
      name: string | undefined,
      options: {
        state?: string;
        json?: boolean;
        due?: string;
        overdue?: boolean;
        priority?: string;
        dueBefore?: string;
        dueAfter?: string;
        dueToday?: boolean;
        tag?: string;
      }
    ) => {
      try {
        const message = commands.handleFilter(
          name,
          options.state,
          options.json,
          options.due,
          options.overdue,
          options.priority,
          options.dueBefore,
          options.dueAfter,
          options.dueToday,
          options.tag
        );
        console.log(message);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    }
  );

program
  .command('clear')
  .description(COMMAND_DESCRIPTIONS.clear)
  .option('--state <state>', 'Only clear todos with this state (pending or done)')
  .action((options: { state?: string }) => {
    try {
      const message = commands.handleClear(options.state);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('export')
  .description(COMMAND_DESCRIPTIONS.export)
  .option('--file <path>', 'Write to this file instead of stdout')
  .action((options: { file?: string }) => {
    try {
      const message = commands.handleExport(options.file);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('import')
  .description(COMMAND_DESCRIPTIONS.import)
  .option('--file <path>', 'Read from this file instead of stdin')
  .option('--replace', 'Replace the existing todos with the imported list')
  .action((options: { file?: string; replace?: boolean }) => {
    try {
      const message = commands.handleImport(options.file, options.replace);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('interactive')
  .description(COMMAND_DESCRIPTIONS.interactive)
  .action(() => {
    runInteractive();
  });

program.parse();

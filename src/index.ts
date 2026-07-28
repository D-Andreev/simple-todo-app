#!/usr/bin/env node

import { Command } from 'commander';
import * as commands from './commands';
import { runInteractive } from './interactive';

const program = new Command();

program
  .name('todo')
  .description('A simple CLI for managing todos')
  .version('1.0.0');

program
  .command('add <title>')
  .description('Add a new todo')
  .option('--due <date>', 'Set a due date (YYYY-MM-DD)')
  .action((title: string, options: { due?: string }) => {
    try {
      const message = commands.handleAdd(title, options.due);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all todos')
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
  .description('Mark a todo as done')
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
  .description('Move a done todo back to pending')
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
  .description('Update a todo\'s title')
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
  .description('Delete a todo')
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
  .description('Filter todos by name and/or state')
  .option('--state <state>', 'Filter by state (pending or done)')
  .option('--due <date>', 'Filter by exact due date (YYYY-MM-DD)')
  .option('--overdue', 'Show pending todos whose due date has passed')
  .option('--json', 'Output as JSON')
  .action(
    (
      name: string | undefined,
      options: { state?: string; json?: boolean; due?: string; overdue?: boolean }
    ) => {
      try {
        const message = commands.handleFilter(name, options.state, options.json, options.due, options.overdue);
        console.log(message);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    }
  );

program
  .command('clear')
  .description('Clear todos, optionally by state')
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
  .description('Export todos as JSON to stdout, or to a file with --file')
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
  .description('Import todos from stdin, or from a file with --file (merges by default)')
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
  .description('Start interactive mode')
  .action(() => {
    runInteractive();
  });

program.parse();

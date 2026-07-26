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
  .action((title: string) => {
    try {
      const message = commands.handleAdd(title);
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
  .option('--json', 'Output as JSON')
  .action((name: string | undefined, options: { state?: string; json?: boolean }) => {
    try {
      const message = commands.handleFilter(name, options.state, options.json);
      console.log(message);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

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
  .command('interactive')
  .description('Start interactive mode')
  .action(() => {
    runInteractive();
  });

program.parse();

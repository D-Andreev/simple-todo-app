#!/usr/bin/env node

import { Command } from 'commander';
import * as commands from './commands';

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
  .action(() => {
    try {
      const message = commands.handleList();
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

program.parse();

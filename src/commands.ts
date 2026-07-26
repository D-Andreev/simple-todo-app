import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';

function formatTodoRow(todo: storage.Todo): string {
  const iso = new Date(todo.createdAt).toISOString();
  return `${todo.id.substring(0, 8)} ${todo.state} ${todo.title} (created: ${iso})`;
}

export function handleAdd(title: string): string {
  const id = uuidv4();
  const todo = storage.addTodo(title, id);
  return `Added: ${todo.id.substring(0, 8)} pending ${todo.title}`;
}

export function handleList(json?: boolean): string {
  const todos = storage.getTodos().sort((a, b) => a.createdAt - b.createdAt);

  if (json) {
    return JSON.stringify(todos, null, 2);
  }

  if (todos.length === 0) {
    return 'No todos.';
  }
  return todos.map(formatTodoRow).join('\n');
}

export function handleDone(id: string): string {
  const todo = storage.markTodoDone(id);
  return `Done: ${todo.id.substring(0, 8)} ${todo.title}`;
}

export function handleUpdate(id: string, newTitle: string): string {
  const todo = storage.updateTodoTitle(id, newTitle);
  return `Updated: ${todo.id.substring(0, 8)} ${todo.title}`;
}

export function handleDelete(id: string): string {
  storage.deleteTodo(id);
  return `Deleted todo ${id.substring(0, 8)}`;
}

export function handleFilter(searchTerm?: string, state?: string, json?: boolean): string {
  if (state !== undefined && state !== 'pending' && state !== 'done') {
    throw new Error('Invalid state. Valid values: pending, done');
  }

  const hasName = searchTerm !== undefined;
  const trimmedTerm = hasName ? searchTerm.trim() : '';
  const nameFilterActive = trimmedTerm.length > 0;

  if (!nameFilterActive && state === undefined) {
    throw new Error(hasName ? 'Filter term cannot be empty' : 'Provide a name or --state to filter by');
  }

  const todos = storage.getTodos();
  const lowerSearch = trimmedTerm.toLowerCase();
  const matches = todos
    .filter((todo) => {
      const nameMatches = !nameFilterActive || todo.title.toLowerCase().includes(lowerSearch);
      const stateMatches = state === undefined || todo.state === state;
      return nameMatches && stateMatches;
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  if (json) {
    return JSON.stringify(matches, null, 2);
  }

  if (matches.length === 0) {
    if (nameFilterActive && state) {
      return `No todos match "${searchTerm}" with state "${state}".`;
    }
    if (nameFilterActive) {
      return `No todos match "${searchTerm}".`;
    }
    return `No todos with state "${state}".`;
  }

  return matches.map(formatTodoRow).join('\n');
}

export function handleClear(state?: string): string {
  if (state !== undefined && state !== 'pending' && state !== 'done') {
    throw new Error('Invalid state. Valid values: pending, done');
  }

  const count = storage.clearTodos(state);

  if (count === 0) {
    return 'No todos to clear.';
  }

  return state === undefined ? `Cleared ${count} todo(s).` : `Cleared ${count} ${state} todo(s).`;
}

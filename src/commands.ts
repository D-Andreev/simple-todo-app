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

export function handleList(): string {
  const todos = storage.getTodos();
  if (todos.length === 0) {
    return 'No todos.';
  }
  return todos
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(formatTodoRow)
    .join('\n');
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

export function handleFilter(searchTerm: string): string {
  if (!searchTerm.trim()) {
    throw new Error('Filter term cannot be empty');
  }
  const todos = storage.getTodos();
  const lowerSearch = searchTerm.toLowerCase();
  const matches = todos.filter((todo) => todo.title.toLowerCase().includes(lowerSearch));

  if (matches.length === 0) {
    return `No todos match "${searchTerm}".`;
  }

  return matches
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(formatTodoRow)
    .join('\n');
}

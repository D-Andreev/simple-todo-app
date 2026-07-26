import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';

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
    .map((todo) => `${todo.id.substring(0, 8)} ${todo.state} ${todo.title}`)
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

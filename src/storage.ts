import * as fs from 'fs';
import * as path from 'path';

export interface Todo {
  id: string;
  title: string;
  state: 'pending' | 'done';
  createdAt: number;
  dueDate: string | null;
}

function getStoragePaths() {
  const storageDir = path.join(process.env.HOME || '~', '.simple-todo');
  const storageFile = path.join(storageDir, 'todos.json');
  return { storageDir, storageFile };
}

export function getTodos(): Todo[] {
  const { storageFile } = getStoragePaths();
  if (!fs.existsSync(storageFile)) {
    return [];
  }
  try {
    const data = fs.readFileSync(storageFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Corrupted todo file at ${storageFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function saveTodos(todos: Todo[]): void {
  const { storageDir, storageFile } = getStoragePaths();
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  fs.writeFileSync(storageFile, JSON.stringify(todos, null, 2), 'utf-8');
}

export function findTodoById(idOrPrefix: string): Todo | undefined {
  const todos = getTodos();
  const exact = todos.find((todo) => todo.id === idOrPrefix);
  if (exact) return exact;
  const prefix = todos.find((todo) => todo.id.startsWith(idOrPrefix));
  return prefix;
}

export function addTodo(title: string, id: string, dueDate?: string | null): Todo {
  if (!title.trim()) {
    throw new Error('Todo title cannot be empty');
  }
  const todos = getTodos();
  const newTodo: Todo = {
    id,
    title: title.trim(),
    state: 'pending',
    createdAt: Date.now(),
    dueDate: dueDate ?? null,
  };
  todos.push(newTodo);
  saveTodos(todos);
  return newTodo;
}

export function updateTodoTitle(idOrPrefix: string, newTitle: string): Todo {
  if (!newTitle.trim()) {
    throw new Error('Todo title cannot be empty');
  }
  const todos = getTodos();
  const todo = findTodoByIdOrPrefix(todos, idOrPrefix);
  if (!todo) {
    throw new Error(`Todo with id ${idOrPrefix} not found`);
  }
  todo.title = newTitle.trim();
  saveTodos(todos);
  return todo;
}

export function markTodoDone(idOrPrefix: string): Todo {
  const todos = getTodos();
  const todo = findTodoByIdOrPrefix(todos, idOrPrefix);
  if (!todo) {
    throw new Error(`Todo with id ${idOrPrefix} not found`);
  }
  todo.state = 'done';
  saveTodos(todos);
  return todo;
}

export function reopenTodo(idOrPrefix: string): Todo {
  const todos = getTodos();
  const todo = findTodoByIdOrPrefix(todos, idOrPrefix);
  if (!todo) {
    throw new Error(`Todo with id ${idOrPrefix} not found`);
  }
  todo.state = 'pending';
  saveTodos(todos);
  return todo;
}

export function deleteTodo(idOrPrefix: string): void {
  const todos = getTodos();
  const todo = findTodoByIdOrPrefix(todos, idOrPrefix);
  if (!todo) {
    throw new Error(`Todo with id ${idOrPrefix} not found`);
  }
  const index = todos.indexOf(todo);
  todos.splice(index, 1);
  saveTodos(todos);
}

export function clearTodos(state?: 'pending' | 'done'): number {
  const todos = getTodos();
  const remaining = state === undefined ? [] : todos.filter((todo) => todo.state !== state);
  const clearedCount = todos.length - remaining.length;
  saveTodos(remaining);
  return clearedCount;
}

export function writeTodosToFile(filePath: string, todos: Todo[]): void {
  fs.writeFileSync(filePath, JSON.stringify(todos, null, 2), 'utf-8');
}

export function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function readStdinText(): string {
  return fs.readFileSync(0, 'utf-8');
}

function findTodoByIdOrPrefix(todos: Todo[], idOrPrefix: string): Todo | undefined {
  const exact = todos.find((t) => t.id === idOrPrefix);
  if (exact) return exact;
  const matches = todos.filter((t) => t.id.startsWith(idOrPrefix));
  if (matches.length > 1) {
    throw new Error(`Ambiguous todo id prefix "${idOrPrefix}" matches ${matches.length} todos`);
  }
  return matches[0];
}

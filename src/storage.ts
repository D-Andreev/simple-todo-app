import * as fs from 'fs';
import * as path from 'path';

export interface Todo {
  id: string;
  title: string;
  state: 'pending' | 'done';
  createdAt: number;
}

function getStoragePaths() {
  const storageDir = path.join(process.env.HOME || '~', '.simple-todo');
  const storageFile = path.join(storageDir, 'todos.json');
  return { storageDir, storageFile };
}

export function getTodos(): Todo[] {
  try {
    const { storageFile } = getStoragePaths();
    if (!fs.existsSync(storageFile)) {
      return [];
    }
    const data = fs.readFileSync(storageFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
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

export function addTodo(title: string, id: string): Todo {
  if (!title.trim()) {
    throw new Error('Todo title cannot be empty');
  }
  const todos = getTodos();
  const newTodo: Todo = {
    id,
    title: title.trim(),
    state: 'pending',
    createdAt: Date.now(),
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

export function deleteTodo(idOrPrefix: string): void {
  const todos = getTodos();
  const index = todos.findIndex(
    (t) => t.id === idOrPrefix || t.id.startsWith(idOrPrefix)
  );
  if (index === -1) {
    throw new Error(`Todo with id ${idOrPrefix} not found`);
  }
  todos.splice(index, 1);
  saveTodos(todos);
}

function findTodoByIdOrPrefix(todos: Todo[], idOrPrefix: string): Todo | undefined {
  const exact = todos.find((t) => t.id === idOrPrefix);
  if (exact) return exact;
  return todos.find((t) => t.id.startsWith(idOrPrefix));
}

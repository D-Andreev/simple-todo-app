import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';

const DUE_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDueDate(value: string): boolean {
  if (!DUE_DATE_REGEX.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validateDueDate(value: string): void {
  if (!isValidDueDate(value)) {
    throw new Error('Invalid due date. Expected format: YYYY-MM-DD');
  }
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isOverdue(todo: storage.Todo, today: string): boolean {
  return todo.state === 'pending' && todo.dueDate !== null && todo.dueDate < today;
}

function formatTodoRow(todo: storage.Todo): string {
  const iso = new Date(todo.createdAt).toISOString();
  const dueSuffix = todo.dueDate ? ` due: ${todo.dueDate}` : '';
  return `${todo.id.substring(0, 8)} ${todo.state} ${todo.title} (created: ${iso})${dueSuffix}`;
}

function compareTodos(a: storage.Todo, b: storage.Todo): number {
  if (a.state !== b.state) {
    return a.state === 'pending' ? -1 : 1;
  }

  const aTitle = a.title.toLowerCase();
  const bTitle = b.title.toLowerCase();
  if (aTitle !== bTitle) {
    return aTitle < bTitle ? -1 : 1;
  }

  return a.createdAt - b.createdAt;
}

export function handleAdd(title: string, dueDate?: string): string {
  if (dueDate !== undefined) {
    validateDueDate(dueDate);
  }
  const id = uuidv4();
  const todo = storage.addTodo(title, id, dueDate ?? null);
  return `Added: ${todo.id.substring(0, 8)} pending ${todo.title}`;
}

export function handleList(json?: boolean): string {
  const todos = storage.getTodos().sort(compareTodos);

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

export function handleFilter(
  searchTerm?: string,
  state?: string,
  json?: boolean,
  due?: string,
  overdue?: boolean
): string {
  if (state !== undefined && state !== 'pending' && state !== 'done') {
    throw new Error('Invalid state. Valid values: pending, done');
  }

  if (due !== undefined) {
    validateDueDate(due);
  }

  const hasName = searchTerm !== undefined;
  const trimmedTerm = hasName ? searchTerm.trim() : '';
  const nameFilterActive = trimmedTerm.length > 0;

  if (!nameFilterActive && state === undefined && due === undefined && !overdue) {
    throw new Error(hasName ? 'Filter term cannot be empty' : 'Provide a name or --state to filter by');
  }

  const todos = storage.getTodos();
  const lowerSearch = trimmedTerm.toLowerCase();
  const today = getTodayDateString();
  const matches = todos
    .filter((todo) => {
      const nameMatches = !nameFilterActive || todo.title.toLowerCase().includes(lowerSearch);
      const stateMatches = state === undefined || todo.state === state;
      const dueMatches = due === undefined || todo.dueDate === due;
      const overdueMatches = !overdue || isOverdue(todo, today);
      return nameMatches && stateMatches && dueMatches && overdueMatches;
    })
    .sort(compareTodos);

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
    if (state !== undefined) {
      return `No todos with state "${state}".`;
    }
    if (overdue) {
      return 'No overdue todos.';
    }
    return `No todos match due date "${due}".`;
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

import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';

const DUE_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_PRIORITIES: storage.Priority[] = ['low', 'mid', 'high'];

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

function isValidPriority(value: string): value is storage.Priority {
  return VALID_PRIORITIES.includes(value as storage.Priority);
}

function validatePriority(value: string): void {
  if (!isValidPriority(value)) {
    throw new Error(`Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}`);
  }
}

function normalizeTag(rawTag: string): string {
  const trimmed = rawTag.trim();
  if (!trimmed) {
    throw new Error('Tag cannot be empty');
  }
  return trimmed.toLowerCase();
}

function normalizeTags(rawTags?: string[]): string[] {
  if (!rawTags || rawTags.length === 0) {
    return [];
  }
  const normalized = rawTags.map(normalizeTag);
  return Array.from(new Set(normalized));
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
  const tagsSuffix = todo.tags && todo.tags.length > 0 ? ` tags: ${todo.tags.join(', ')}` : '';
  return `${todo.id.substring(0, 8)} ${todo.state} ${todo.title} (created: ${iso}) priority: ${todo.priority}${dueSuffix}${tagsSuffix}`;
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

export function handleAdd(title: string, dueDate?: string, priority?: string, tags?: string[]): string {
  if (dueDate !== undefined) {
    validateDueDate(dueDate);
  }
  if (priority !== undefined) {
    validatePriority(priority);
  }
  const normalizedTags = normalizeTags(tags);
  const id = uuidv4();
  const todo = storage.addTodo(title, id, dueDate ?? null, priority as storage.Priority | undefined, normalizedTags);
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

export function handleReopen(id: string): string {
  const todo = storage.reopenTodo(id);
  return `Reopened: ${todo.id.substring(0, 8)} ${todo.title}`;
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
  overdue?: boolean,
  priority?: string,
  dueBefore?: string,
  dueAfter?: string,
  dueToday?: boolean,
  tag?: string
): string {
  if (state !== undefined && state !== 'pending' && state !== 'done') {
    throw new Error('Invalid state. Valid values: pending, done');
  }

  if (due !== undefined) {
    validateDueDate(due);
  }

  if (priority !== undefined) {
    validatePriority(priority);
  }

  if (dueBefore !== undefined) {
    validateDueDate(dueBefore);
  }

  if (dueAfter !== undefined) {
    validateDueDate(dueAfter);
  }

  const hasName = searchTerm !== undefined;
  const trimmedTerm = hasName ? searchTerm.trim() : '';
  const nameFilterActive = trimmedTerm.length > 0;

  if (
    !nameFilterActive &&
    state === undefined &&
    due === undefined &&
    !overdue &&
    priority === undefined &&
    dueBefore === undefined &&
    dueAfter === undefined &&
    !dueToday &&
    tag === undefined
  ) {
    throw new Error(hasName ? 'Filter term cannot be empty' : 'Provide a name or --state to filter by');
  }

  const todos = storage.getTodos();
  const lowerSearch = trimmedTerm.toLowerCase();
  const today = getTodayDateString();
  const lowerTag = tag !== undefined ? tag.trim().toLowerCase() : undefined;
  const matches = todos
    .filter((todo) => {
      const nameMatches = !nameFilterActive || todo.title.toLowerCase().includes(lowerSearch);
      const stateMatches = state === undefined || todo.state === state;
      const dueMatches = due === undefined || todo.dueDate === due;
      const overdueMatches = !overdue || isOverdue(todo, today);
      const priorityMatches = priority === undefined || todo.priority === priority;
      const dueBeforeMatches = dueBefore === undefined || (todo.dueDate !== null && todo.dueDate < dueBefore);
      const dueAfterMatches = dueAfter === undefined || (todo.dueDate !== null && todo.dueDate > dueAfter);
      const dueTodayMatches = !dueToday || (todo.dueDate !== null && todo.dueDate === today);
      const tagMatches = lowerTag === undefined || todo.tags.some((t) => t.toLowerCase() === lowerTag);
      return (
        nameMatches &&
        stateMatches &&
        dueMatches &&
        overdueMatches &&
        priorityMatches &&
        dueBeforeMatches &&
        dueAfterMatches &&
        dueTodayMatches &&
        tagMatches
      );
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
    if (priority !== undefined) {
      return `No todos with priority "${priority}".`;
    }
    if (tag !== undefined) {
      return `No todos with tag "${tag}".`;
    }
    if (overdue) {
      return 'No overdue todos.';
    }
    if (dueToday) {
      return 'No todos due today.';
    }
    if (dueBefore !== undefined && dueAfter !== undefined) {
      return `No todos due after "${dueAfter}" and before "${dueBefore}".`;
    }
    if (dueBefore !== undefined) {
      return `No todos due before "${dueBefore}".`;
    }
    if (dueAfter !== undefined) {
      return `No todos due after "${dueAfter}".`;
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

export function handleExport(filePath?: string): string {
  const todos = storage.getTodos();

  if (filePath) {
    storage.writeTodosToFile(filePath, todos);
    return `Exported ${todos.length} todo(s) to ${filePath}`;
  }

  return JSON.stringify(todos, null, 2);
}

function isValidImportEntry(entry: unknown): entry is storage.Todo {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  const candidate = entry as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || candidate.id.trim() === '') {
    return false;
  }
  if (typeof candidate.title !== 'string' || candidate.title.trim() === '') {
    return false;
  }
  if (candidate.state !== 'pending' && candidate.state !== 'done') {
    return false;
  }
  if (typeof candidate.createdAt !== 'number' || !Number.isFinite(candidate.createdAt)) {
    return false;
  }
  if (candidate.dueDate !== null && (typeof candidate.dueDate !== 'string' || !isValidDueDate(candidate.dueDate))) {
    return false;
  }
  if (candidate.priority !== undefined && !isValidPriority(candidate.priority as string)) {
    return false;
  }
  return true;
}

function isValidTagsArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((tag) => typeof tag === 'string' && tag.trim() !== '');
}

function validateImportTags(entry: unknown): void {
  if (typeof entry !== 'object' || entry === null) {
    return;
  }
  const candidate = entry as Record<string, unknown>;
  if (candidate.tags !== undefined && !isValidTagsArray(candidate.tags)) {
    throw new Error('Invalid import data: malformed tags field');
  }
}

export function handleImport(filePath?: string, replace?: boolean): string {
  const raw = filePath ? storage.readTextFile(filePath) : storage.readStdinText();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid import data: not valid JSON');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid import data: expected a JSON array');
  }

  const valid: storage.Todo[] = [];
  let skippedInvalid = 0;
  for (const entry of parsed) {
    validateImportTags(entry);
    if (isValidImportEntry(entry)) {
      valid.push({ ...entry, priority: entry.priority ?? 'mid', tags: entry.tags ?? [] });
    } else {
      skippedInvalid++;
    }
  }

  if (replace) {
    storage.saveTodos(valid);
    return `Imported ${valid.length} todo(s), skipped 0 (id collision), skipped ${skippedInvalid} invalid.`;
  }

  const todos = storage.getTodos();
  const existingIds = new Set(todos.map((todo) => todo.id));
  let imported = 0;
  let skippedCollision = 0;
  for (const todo of valid) {
    if (existingIds.has(todo.id)) {
      skippedCollision++;
    } else {
      todos.push(todo);
      existingIds.add(todo.id);
      imported++;
    }
  }
  storage.saveTodos(todos);

  return `Imported ${imported} todo(s), skipped ${skippedCollision} (id collision), skipped ${skippedInvalid} invalid.`;
}

import * as storage from '../src/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Storage', () => {
  let TEST_DIR: string;
  let TEST_STORAGE: string;
  let originalHome: string | undefined;

  beforeAll(() => {
    originalHome = process.env.HOME;
  });

  beforeEach(() => {
    TEST_DIR = path.join(os.tmpdir(), `simple-todo-test-${Date.now()}-${Math.random()}`);
    TEST_STORAGE = path.join(TEST_DIR, '.simple-todo', 'todos.json');
    fs.mkdirSync(TEST_DIR, { recursive: true });
    process.env.HOME = TEST_DIR;
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    process.env.HOME = originalHome;
  });

  test('getTodos returns empty array when file does not exist', () => {
    const todos = storage.getTodos();
    expect(todos).toEqual([]);
  });

  test('saveTodos creates storage directory and file', () => {
    const todos = [
      { id: 'test-1', title: 'Test', state: 'pending' as const, createdAt: Date.now(), dueDate: null },
    ];
    storage.saveTodos(todos);
    expect(fs.existsSync(TEST_STORAGE)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(TEST_STORAGE, 'utf-8'));
    expect(saved).toEqual(todos);
  });

  test('addTodo adds a new todo and returns it', () => {
    const todo = storage.addTodo('Test Todo', 'test-1');
    expect(todo.id).toBe('test-1');
    expect(todo.title).toBe('Test Todo');
    expect(todo.state).toBe('pending');
    expect(todo.createdAt).toBeDefined();

    const todos = storage.getTodos();
    expect(todos).toHaveLength(1);
    expect(todos[0]).toEqual(todo);
  });

  test('addTodo throws when title is empty', () => {
    expect(() => storage.addTodo('', 'test-1')).toThrow('Todo title cannot be empty');
    expect(() => storage.addTodo('   ', 'test-1')).toThrow('Todo title cannot be empty');
  });

  test('addTodo defaults dueDate to null when not provided', () => {
    const todo = storage.addTodo('Test Todo', 'test-1');
    expect(todo.dueDate).toBeNull();
  });

  test('addTodo stores the given dueDate', () => {
    const todo = storage.addTodo('Test Todo', 'test-1', '2026-08-15');
    expect(todo.dueDate).toBe('2026-08-15');

    const fetched = storage.findTodoById('test-1');
    expect(fetched?.dueDate).toBe('2026-08-15');
  });

  test('findTodoById returns todo when found', () => {
    storage.addTodo('Test', 'test-1');
    const found = storage.findTodoById('test-1');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Test');
  });

  test('findTodoById returns undefined when not found', () => {
    const found = storage.findTodoById('nonexistent');
    expect(found).toBeUndefined();
  });

  test('updateTodoTitle updates title and returns updated todo', () => {
    storage.addTodo('Original', 'test-1');
    const updated = storage.updateTodoTitle('test-1', 'Updated');
    expect(updated.title).toBe('Updated');

    const fetched = storage.findTodoById('test-1');
    expect(fetched?.title).toBe('Updated');
  });

  test('updateTodoTitle throws when todo not found', () => {
    expect(() => storage.updateTodoTitle('nonexistent', 'New')).toThrow(
      'Todo with id nonexistent not found'
    );
  });

  test('updateTodoTitle throws when new title is empty', () => {
    storage.addTodo('Original', 'test-1');
    expect(() => storage.updateTodoTitle('test-1', '')).toThrow('Todo title cannot be empty');
  });

  test('markTodoDone changes state to done', () => {
    storage.addTodo('Test', 'test-1');
    const done = storage.markTodoDone('test-1');
    expect(done.state).toBe('done');

    const fetched = storage.findTodoById('test-1');
    expect(fetched?.state).toBe('done');
  });

  test('markTodoDone throws when todo not found', () => {
    expect(() => storage.markTodoDone('nonexistent')).toThrow(
      'Todo with id nonexistent not found'
    );
  });

  test('reopenTodo changes state from done back to pending', () => {
    storage.addTodo('Test', 'test-1');
    storage.markTodoDone('test-1');
    const reopened = storage.reopenTodo('test-1');
    expect(reopened.state).toBe('pending');

    const fetched = storage.findTodoById('test-1');
    expect(fetched?.state).toBe('pending');
  });

  test('reopenTodo is a no-op when todo is already pending', () => {
    storage.addTodo('Test', 'test-1');
    const reopened = storage.reopenTodo('test-1');
    expect(reopened.state).toBe('pending');
  });

  test('reopenTodo throws when todo not found', () => {
    expect(() => storage.reopenTodo('nonexistent')).toThrow(
      'Todo with id nonexistent not found'
    );
  });

  test('deleteTodo removes todo', () => {
    storage.addTodo('Test', 'test-1');
    expect(storage.getTodos()).toHaveLength(1);
    storage.deleteTodo('test-1');
    expect(storage.getTodos()).toHaveLength(0);
  });

  test('deleteTodo throws when todo not found', () => {
    expect(() => storage.deleteTodo('nonexistent')).toThrow(
      'Todo with id nonexistent not found'
    );
  });

  test('clearTodos with no state removes all todos and returns count', () => {
    storage.addTodo('First', 'id-1');
    storage.addTodo('Second', 'id-2');

    const count = storage.clearTodos();
    expect(count).toBe(2);
    expect(storage.getTodos()).toEqual([]);
  });

  test('clearTodos with a state removes only matching todos and returns count', () => {
    storage.addTodo('First', 'id-1');
    storage.addTodo('Second', 'id-2');
    storage.markTodoDone('id-1');

    const count = storage.clearTodos('done');
    expect(count).toBe(1);
    const remaining = storage.getTodos();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('id-2');
  });

  test('clearTodos returns 0 and leaves storage untouched when nothing matches', () => {
    storage.addTodo('First', 'id-1');

    const count = storage.clearTodos('done');
    expect(count).toBe(0);
    expect(storage.getTodos()).toHaveLength(1);
  });
});

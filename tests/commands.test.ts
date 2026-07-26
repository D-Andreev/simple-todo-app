import * as commands from '../src/commands';
import * as storage from '../src/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Commands', () => {
  let TEST_DIR: string;
  let originalHome: string | undefined;

  beforeAll(() => {
    originalHome = process.env.HOME;
  });

  beforeEach(() => {
    TEST_DIR = path.join(os.tmpdir(), `simple-todo-cmd-test-${Date.now()}-${Math.random()}`);
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

  describe('handleAdd', () => {
    test('adds a todo and returns message with uuid prefix', () => {
      const message = commands.handleAdd('New Todo');
      expect(message).toContain('Added:');
      expect(message).toContain('pending');
      expect(message).toContain('New Todo');
      expect(storage.getTodos()).toHaveLength(1);
    });

    test('generates unique id for each todo', () => {
      const msg1 = commands.handleAdd('Todo 1');
      const msg2 = commands.handleAdd('Todo 2');
      const id1 = msg1.split(' ')[1];
      const id2 = msg2.split(' ')[1];
      expect(id1).not.toBe(id2);
    });
  });

  describe('handleList', () => {
    test('returns "No todos." when empty', () => {
      const message = commands.handleList();
      expect(message).toBe('No todos.');
    });

    test('lists all todos sorted by creation time', () => {
      const id1 = 'id-1';
      const id2 = 'id-2';
      const todo1 = storage.addTodo('First', id1);
      const todo2 = storage.addTodo('Second', id2);

      const message = commands.handleList();
      const lines = message.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain(id1.substring(0, 8));
      expect(lines[0]).toContain('First');
      expect(lines[1]).toContain(id2.substring(0, 8));
      expect(lines[1]).toContain('Second');
    });

    test('shows todo state in list', () => {
      storage.addTodo('Test', 'id-1');
      storage.markTodoDone('id-1');
      const message = commands.handleList();
      expect(message).toContain('done');
      expect(message).toContain('Test');
    });

    test('includes createdAt as ISO 8601 UTC string in parentheses', () => {
      storage.addTodo('Test', 'id-1');
      const todo = storage.findTodoById('id-1');
      const expectedIso = new Date(todo!.createdAt).toISOString();

      const message = commands.handleList();
      expect(message).toContain(`(created: ${expectedIso})`);
    });
  });

  describe('handleDone', () => {
    test('marks todo as done and returns message', () => {
      storage.addTodo('Test', 'id-1');
      const message = commands.handleDone('id-1');
      expect(message).toContain('Done:');
      expect(message).toContain('id-1'.substring(0, 8));
      expect(message).toContain('Test');

      const todo = storage.findTodoById('id-1');
      expect(todo?.state).toBe('done');
    });

    test('throws when todo not found', () => {
      expect(() => commands.handleDone('nonexistent')).toThrow('Todo with id nonexistent not found');
    });
  });

  describe('handleUpdate', () => {
    test('updates todo title and returns message', () => {
      storage.addTodo('Original', 'id-1');
      const message = commands.handleUpdate('id-1', 'Updated');
      expect(message).toContain('Updated:');
      expect(message).toContain('id-1'.substring(0, 8));
      expect(message).toContain('Updated');

      const todo = storage.findTodoById('id-1');
      expect(todo?.title).toBe('Updated');
    });

    test('throws when todo not found', () => {
      expect(() => commands.handleUpdate('nonexistent', 'New')).toThrow(
        'Todo with id nonexistent not found'
      );
    });

    test('throws when new title is empty', () => {
      storage.addTodo('Original', 'id-1');
      expect(() => commands.handleUpdate('id-1', '')).toThrow('Todo title cannot be empty');
    });
  });

  describe('handleDelete', () => {
    test('deletes todo and returns message', () => {
      storage.addTodo('Test', 'id-1');
      expect(storage.getTodos()).toHaveLength(1);

      const message = commands.handleDelete('id-1');
      expect(message).toContain('Deleted');
      expect(message).toContain('id-1'.substring(0, 8));
      expect(storage.getTodos()).toHaveLength(0);
    });

    test('throws when todo not found', () => {
      expect(() => commands.handleDelete('nonexistent')).toThrow(
        'Todo with id nonexistent not found'
      );
    });
  });

  describe('handleFilter', () => {
    test('throws when search term is empty', () => {
      expect(() => commands.handleFilter('')).toThrow('Filter term cannot be empty');
    });

    test('throws when search term is whitespace only', () => {
      expect(() => commands.handleFilter('   ')).toThrow('Filter term cannot be empty');
    });

    test('returns matching todos case-insensitive substring', () => {
      storage.addTodo('Buy groceries', 'id-1');
      storage.addTodo('Walk dog', 'id-2');
      storage.addTodo('Buy milk', 'id-3');

      const message = commands.handleFilter('buy');
      const lines = message.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('Buy groceries');
      expect(lines[1]).toContain('Buy milk');
    });

    test('returns no matches message when nothing matches', () => {
      storage.addTodo('Buy groceries', 'id-1');
      storage.addTodo('Walk dog', 'id-2');

      const message = commands.handleFilter('xyz');
      expect(message).toBe('No todos match "xyz".');
    });

    test('preserves creation order in results', () => {
      storage.addTodo('Apple', 'id-1');
      storage.addTodo('Apricot', 'id-2');
      storage.addTodo('Avocado', 'id-3');

      const message = commands.handleFilter('a');
      const lines = message.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('Apple');
      expect(lines[1]).toContain('Apricot');
      expect(lines[2]).toContain('Avocado');
    });

    test('matches case-insensitively', () => {
      storage.addTodo('Buy Groceries', 'id-1');
      storage.addTodo('walk dog', 'id-2');

      const message = commands.handleFilter('GROC');
      expect(message).toContain('Buy Groceries');
      expect(message).not.toContain('walk dog');
    });

    test('includes createdAt as ISO 8601 UTC string in parentheses', () => {
      storage.addTodo('Apple', 'id-1');
      storage.addTodo('Apricot', 'id-2');
      const todo1 = storage.findTodoById('id-1');
      const expectedIso1 = new Date(todo1!.createdAt).toISOString();

      const message = commands.handleFilter('a');
      expect(message).toContain(`(created: ${expectedIso1})`);
    });
  });
});

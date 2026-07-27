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

    test('with no --due, creates a todo with no due date', () => {
      commands.handleAdd('New Todo');
      const todos = storage.getTodos();
      expect(todos[0].dueDate).toBeNull();
    });

    test('with a valid --due, sets the due date', () => {
      commands.handleAdd('New Todo', '2026-08-15');
      const todos = storage.getTodos();
      expect(todos[0].dueDate).toBe('2026-08-15');
    });

    test('with --due in the past, allows it', () => {
      commands.handleAdd('New Todo', '2000-01-01');
      const todos = storage.getTodos();
      expect(todos[0].dueDate).toBe('2000-01-01');
    });

    test('with a malformed --due, throws and does not create the todo', () => {
      expect(() => commands.handleAdd('New Todo', '15-08-2026')).toThrow(
        'Invalid due date. Expected format: YYYY-MM-DD'
      );
      expect(storage.getTodos()).toHaveLength(0);
    });

    test('with an invalid calendar date, throws and does not create the todo', () => {
      expect(() => commands.handleAdd('New Todo', '2026-13-40')).toThrow(
        'Invalid due date. Expected format: YYYY-MM-DD'
      );
      expect(storage.getTodos()).toHaveLength(0);
    });
  });

  describe('handleList', () => {
    test('returns "No todos." when empty', () => {
      const message = commands.handleList();
      expect(message).toBe('No todos.');
    });

    test('sorts todos by title, case-insensitively, ascending', () => {
      const id1 = 'id-1';
      const id2 = 'id-2';
      storage.addTodo('Second', id1);
      storage.addTodo('First', id2);

      const message = commands.handleList();
      const lines = message.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain(id2.substring(0, 8));
      expect(lines[0]).toContain('First');
      expect(lines[1]).toContain(id1.substring(0, 8));
      expect(lines[1]).toContain('Second');
    });

    test('groups pending todos before done todos, regardless of creation order', () => {
      storage.addTodo('Zebra', 'id-1');
      storage.markTodoDone('id-1');
      storage.addTodo('Apple', 'id-2');

      const message = commands.handleList();
      const lines = message.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('id-2'.substring(0, 8));
      expect(lines[0]).toContain('pending');
      expect(lines[1]).toContain('id-1'.substring(0, 8));
      expect(lines[1]).toContain('done');
    });

    test('sorts by title within a state group before sorting the other group', () => {
      storage.addTodo('Banana', 'id-1');
      storage.markTodoDone('id-1');
      storage.addTodo('Cherry', 'id-2');
      storage.markTodoDone('id-2');
      storage.addTodo('Date', 'id-3');
      storage.addTodo('Apple', 'id-4');

      const message = commands.handleList();
      const lines = message.split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toContain('Apple');
      expect(lines[1]).toContain('Date');
      expect(lines[2]).toContain('Banana');
      expect(lines[3]).toContain('Cherry');
    });

    test('breaks ties between identical case-insensitive titles by createdAt ascending', () => {
      storage.saveTodos([
        { id: 'id-1', title: 'Todo', state: 'pending', createdAt: 200, dueDate: null },
        { id: 'id-2', title: 'todo', state: 'pending', createdAt: 100, dueDate: null },
      ]);

      const message = commands.handleList();
      const lines = message.split('\n');
      expect(lines[0]).toContain('id-2'.substring(0, 8));
      expect(lines[1]).toContain('id-1'.substring(0, 8));
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

    test('with json=true returns "[]" when empty', () => {
      const message = commands.handleList(true);
      expect(message).toBe('[]');
    });

    test('with json=true returns raw todo objects, pretty-printed', () => {
      storage.addTodo('First', 'id-1');
      storage.addTodo('Second', 'id-2');

      const message = commands.handleList(true);
      const parsed = JSON.parse(message);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({
        id: 'id-1',
        title: 'First',
        state: 'pending',
        createdAt: expect.any(Number),
        dueDate: null,
      });
      expect(parsed[1].id).toBe('id-2');
      expect(message).toBe(JSON.stringify(parsed, null, 2));
    });

    test('with json=true, todos are grouped and sorted the same as the text output', () => {
      storage.addTodo('Zebra', 'id-1');
      storage.markTodoDone('id-1');
      storage.addTodo('Apple', 'id-2');

      const message = commands.handleList(true);
      const parsed = JSON.parse(message);
      expect(parsed.map((t: storage.Todo) => t.id)).toEqual(['id-2', 'id-1']);
    });

    test('includes "due: YYYY-MM-DD" in the row when a due date is set', () => {
      storage.addTodo('Test', 'id-1', '2026-08-15');

      const message = commands.handleList();
      expect(message).toContain('due: 2026-08-15');
    });

    test('omits "due:" from the row when no due date is set', () => {
      storage.addTodo('Test', 'id-1');

      const message = commands.handleList();
      expect(message).not.toContain('due:');
    });

    test('due date does not change sort order', () => {
      storage.addTodo('Banana', 'id-1', '2026-01-01');
      storage.addTodo('Apple', 'id-2', '2030-01-01');

      const message = commands.handleList();
      const lines = message.split('\n');
      expect(lines[0]).toContain('Apple');
      expect(lines[1]).toContain('Banana');
    });

    test('with json=true, includes dueDate field (string when set)', () => {
      storage.addTodo('Test', 'id-1', '2026-08-15');

      const message = commands.handleList(true);
      const parsed = JSON.parse(message);
      expect(parsed[0].dueDate).toBe('2026-08-15');
    });

    test('with json=true, includes dueDate field (null when not set)', () => {
      storage.addTodo('Test', 'id-1');

      const message = commands.handleList(true);
      const parsed = JSON.parse(message);
      expect(parsed[0].dueDate).toBeNull();
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

  describe('handleReopen', () => {
    test('moves a done todo back to pending and returns message', () => {
      storage.addTodo('Test', 'id-1');
      commands.handleDone('id-1');
      const message = commands.handleReopen('id-1');
      expect(message).toContain('Reopened:');
      expect(message).toContain('id-1'.substring(0, 8));
      expect(message).toContain('Test');

      const todo = storage.findTodoById('id-1');
      expect(todo?.state).toBe('pending');
    });

    test('no-ops on an already-pending todo with the same success message', () => {
      storage.addTodo('Test', 'id-1');
      const message = commands.handleReopen('id-1');
      expect(message).toContain('Reopened:');
      expect(message).toContain('Test');

      const todo = storage.findTodoById('id-1');
      expect(todo?.state).toBe('pending');
    });

    test('throws when todo not found', () => {
      expect(() => commands.handleReopen('nonexistent')).toThrow('Todo with id nonexistent not found');
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

    test('sorts matches by title, case-insensitively, ascending', () => {
      storage.addTodo('Avocado', 'id-1');
      storage.addTodo('Apple', 'id-2');
      storage.addTodo('Apricot', 'id-3');

      const message = commands.handleFilter('a');
      const lines = message.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('Apple');
      expect(lines[1]).toContain('Apricot');
      expect(lines[2]).toContain('Avocado');
    });

    test('groups pending matches before done matches', () => {
      storage.addTodo('Apple', 'id-1');
      storage.markTodoDone('id-1');
      storage.addTodo('Avocado', 'id-2');

      const message = commands.handleFilter('a');
      const lines = message.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('Avocado');
      expect(lines[0]).toContain('pending');
      expect(lines[1]).toContain('Apple');
      expect(lines[1]).toContain('done');
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

    test('throws when neither name nor state is provided', () => {
      expect(() => commands.handleFilter(undefined)).toThrow(
        'Provide a name or --state to filter by'
      );
    });

    test('throws on invalid state value', () => {
      expect(() => commands.handleFilter(undefined, 'bogus')).toThrow(
        'Invalid state. Valid values: pending, done'
      );
      expect(() => commands.handleFilter('buy', 'bogus')).toThrow(
        'Invalid state. Valid values: pending, done'
      );
    });

    test('filters by name and state together', () => {
      storage.addTodo('Buy milk', 'id-1');
      storage.addTodo('Buy eggs', 'id-2');
      storage.markTodoDone('id-1');

      const message = commands.handleFilter('buy', 'done');
      const lines = message.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Buy milk');
    });

    test('filters by state only when no name is provided', () => {
      storage.addTodo('Buy milk', 'id-1');
      storage.addTodo('Buy eggs', 'id-2');
      storage.markTodoDone('id-1');

      const message = commands.handleFilter(undefined, 'pending');
      const lines = message.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Buy eggs');
    });

    test('filters by state only when name is an empty string', () => {
      storage.addTodo('Buy milk', 'id-1');
      storage.addTodo('Buy eggs', 'id-2');
      storage.markTodoDone('id-1');

      const message = commands.handleFilter('', 'done');
      const lines = message.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Buy milk');
    });

    test('returns no-match message when state filter matches nothing', () => {
      storage.addTodo('Buy milk', 'id-1');

      const message = commands.handleFilter(undefined, 'done');
      expect(message).toBe('No todos with state "done".');
    });

    test('returns no-match message when name and state combined match nothing', () => {
      storage.addTodo('Buy milk', 'id-1');

      const message = commands.handleFilter('buy', 'done');
      expect(message).toBe('No todos match "buy" with state "done".');
    });

    test('sorts by title when filtering by state', () => {
      storage.addTodo('Avocado', 'id-1');
      storage.addTodo('Apple', 'id-2');
      storage.addTodo('Apricot', 'id-3');

      const message = commands.handleFilter(undefined, 'pending');
      const lines = message.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('Apple');
      expect(lines[1]).toContain('Apricot');
      expect(lines[2]).toContain('Avocado');
    });

    test('with json=true and no matches returns "[]"', () => {
      storage.addTodo('Buy milk', 'id-1');

      const message = commands.handleFilter('xyz', undefined, true);
      expect(message).toBe('[]');
    });

    test('with json=true returns raw matching todo objects, pretty-printed', () => {
      storage.addTodo('Buy groceries', 'id-1');
      storage.addTodo('Walk dog', 'id-2');

      const message = commands.handleFilter('buy', undefined, true);
      const parsed = JSON.parse(message);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({
        id: 'id-1',
        title: 'Buy groceries',
        state: 'pending',
        createdAt: expect.any(Number),
        dueDate: null,
      });
      expect(message).toBe(JSON.stringify(parsed, null, 2));
    });

    test('with json=true still validates state and throws on invalid value', () => {
      expect(() => commands.handleFilter(undefined, 'bogus', true)).toThrow(
        'Invalid state. Valid values: pending, done'
      );
    });

    test('with json=true, matches are grouped and sorted the same as the text output', () => {
      storage.addTodo('Apple', 'id-1');
      storage.markTodoDone('id-1');
      storage.addTodo('Avocado', 'id-2');

      const message = commands.handleFilter('a', undefined, true);
      const parsed = JSON.parse(message);
      expect(parsed.map((t: storage.Todo) => t.id)).toEqual(['id-2', 'id-1']);
    });

    test('--due matches todos with the exact due date', () => {
      storage.addTodo('Buy milk', 'id-1', '2026-08-15');
      storage.addTodo('Walk dog', 'id-2', '2026-08-16');
      storage.addTodo('No due', 'id-3');

      const message = commands.handleFilter(undefined, undefined, false, '2026-08-15');
      const lines = message.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Buy milk');
    });

    test('--due is combinable with name and --state', () => {
      storage.addTodo('Buy milk', 'id-1', '2026-08-15');
      storage.addTodo('Buy eggs', 'id-2', '2026-08-15');
      storage.markTodoDone('id-1');

      const message = commands.handleFilter('buy', 'done', false, '2026-08-15');
      const lines = message.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Buy milk');
    });

    test('--due with an invalid value throws', () => {
      expect(() => commands.handleFilter(undefined, undefined, false, '2026-13-40')).toThrow(
        'Invalid due date. Expected format: YYYY-MM-DD'
      );
    });

    test('--due with no matches returns a due-date-specific message', () => {
      storage.addTodo('Buy milk', 'id-1', '2026-08-15');

      const message = commands.handleFilter(undefined, undefined, false, '2026-09-01');
      expect(message).toBe('No todos match due date "2026-09-01".');
    });

    test('--overdue matches only pending todos with a due date before today', () => {
      storage.addTodo('Overdue pending', 'id-1', '2000-01-01');
      storage.addTodo('Overdue but done', 'id-2', '2000-01-01');
      storage.markTodoDone('id-2');
      storage.addTodo('Future pending', 'id-3', '2999-01-01');
      storage.addTodo('No due date', 'id-4');

      const message = commands.handleFilter(undefined, undefined, false, undefined, true);
      const lines = message.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Overdue pending');
    });

    test('--overdue with no matches returns an overdue-specific message', () => {
      storage.addTodo('Future pending', 'id-1', '2999-01-01');

      const message = commands.handleFilter(undefined, undefined, false, undefined, true);
      expect(message).toBe('No overdue todos.');
    });

    test('--overdue works standalone without name or --state', () => {
      storage.addTodo('Overdue pending', 'id-1', '2000-01-01');

      const message = commands.handleFilter(undefined, undefined, false, undefined, true);
      expect(message).toContain('Overdue pending');
    });

    test('with json=true, --due filters and includes dueDate field', () => {
      storage.addTodo('Buy milk', 'id-1', '2026-08-15');
      storage.addTodo('Walk dog', 'id-2', '2026-08-16');

      const message = commands.handleFilter(undefined, undefined, true, '2026-08-15');
      const parsed = JSON.parse(message);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].dueDate).toBe('2026-08-15');
    });
  });

  describe('handleClear', () => {
    test('throws on invalid state value', () => {
      expect(() => commands.handleClear('bogus')).toThrow(
        'Invalid state. Valid values: pending, done'
      );
    });

    test('with no state deletes all todos and returns count message', () => {
      storage.addTodo('Buy milk', 'id-1');
      storage.addTodo('Walk dog', 'id-2');

      const message = commands.handleClear();
      expect(message).toBe('Cleared 2 todo(s).');
      expect(storage.getTodos()).toHaveLength(0);
    });

    test('with --state done deletes only done todos and returns count message', () => {
      storage.addTodo('Buy milk', 'id-1');
      storage.addTodo('Walk dog', 'id-2');
      storage.markTodoDone('id-1');

      const message = commands.handleClear('done');
      expect(message).toBe('Cleared 1 done todo(s).');
      const remaining = storage.getTodos();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('id-2');
    });

    test('with --state pending deletes only pending todos and returns count message', () => {
      storage.addTodo('Buy milk', 'id-1');
      storage.addTodo('Walk dog', 'id-2');
      storage.markTodoDone('id-1');

      const message = commands.handleClear('pending');
      expect(message).toBe('Cleared 1 pending todo(s).');
      const remaining = storage.getTodos();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('id-1');
    });

    test('returns "No todos to clear." when nothing matches', () => {
      storage.addTodo('Buy milk', 'id-1');

      const message = commands.handleClear('done');
      expect(message).toBe('No todos to clear.');
      expect(storage.getTodos()).toHaveLength(1);
    });

    test('returns "No todos to clear." when there are no todos at all', () => {
      const message = commands.handleClear();
      expect(message).toBe('No todos to clear.');
    });

    test('does not prompt for confirmation, executes immediately', () => {
      storage.addTodo('Buy milk', 'id-1');

      const message = commands.handleClear();
      expect(message).toBe('Cleared 1 todo(s).');
    });
  });

  describe('handleExport', () => {
    test('with no file, returns the todos array as JSON', () => {
      const todo = storage.addTodo('Buy milk', 'id-1');
      const result = commands.handleExport();
      expect(JSON.parse(result)).toEqual([todo]);
    });

    test('with no todos, returns "[]"', () => {
      const result = commands.handleExport();
      expect(JSON.parse(result)).toEqual([]);
    });

    test('with --file, writes JSON to the path and returns a confirmation message', () => {
      storage.addTodo('Buy milk', 'id-1');
      const exportPath = path.join(TEST_DIR, 'export.json');

      const message = commands.handleExport(exportPath);

      expect(message).toContain('Exported 1 todo(s)');
      expect(message).toContain(exportPath);
      const written = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
      expect(written).toHaveLength(1);
      expect(written[0].title).toBe('Buy milk');
    });
  });

  describe('handleImport', () => {
    function importFile(data: unknown): string {
      const filePath = path.join(TEST_DIR, `import-${Math.random()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
      return filePath;
    }

    test('merges valid todos, skips id collisions, and reports counts', () => {
      storage.addTodo('Existing', 'dup-id');
      const payload = [
        { id: 'dup-id', title: 'Existing (imported copy)', state: 'pending', createdAt: 1, dueDate: null },
        { id: 'new-id', title: 'New todo', state: 'done', createdAt: 2, dueDate: null },
      ];

      const message = commands.handleImport(importFile(payload));

      expect(message).toContain('Imported 1');
      expect(message).toContain('skipped 1 (id collision)');
      const todos = storage.getTodos();
      expect(todos).toHaveLength(2);
      expect(todos.find((t) => t.id === 'dup-id')?.title).toBe('Existing');
    });

    test('--replace wholesale replaces the existing todos', () => {
      storage.addTodo('Old', 'old-id');
      const payload = [{ id: 'new-id', title: 'New', state: 'pending', createdAt: 1, dueDate: null }];

      commands.handleImport(importFile(payload), true);

      const todos = storage.getTodos();
      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe('new-id');
    });

    test('skips invalid entries, counted separately from id collisions', () => {
      const payload = [
        { id: 'ok-id', title: 'Valid', state: 'pending', createdAt: 1, dueDate: null },
        { id: 'bad-state', title: 'Bad state', state: 'nope', createdAt: 1, dueDate: null },
        { title: 'Missing id', state: 'pending', createdAt: 1, dueDate: null },
        { id: 'bad-due', title: 'Bad due', state: 'pending', createdAt: 1, dueDate: 'not-a-date' },
        { id: 123, title: 'Non-string id', state: 'pending', createdAt: 1, dueDate: null },
      ];

      const message = commands.handleImport(importFile(payload));

      expect(message).toContain('Imported 1');
      expect(message).toContain('skipped 4 invalid');
      expect(storage.getTodos()).toHaveLength(1);
    });

    test('never auto-generates a missing id — it always counts as invalid', () => {
      const payload = [{ title: 'No id', state: 'pending', createdAt: 1, dueDate: null }];

      const message = commands.handleImport(importFile(payload));

      expect(message).toContain('Imported 0');
      expect(message).toContain('skipped 1 invalid');
      expect(storage.getTodos()).toHaveLength(0);
    });

    test('aborts entirely when the top-level payload is not a JSON array', () => {
      expect(() => commands.handleImport(importFile({ id: 'not-an-array' }))).toThrow(
        'Invalid import data: expected a JSON array'
      );
      expect(storage.getTodos()).toHaveLength(0);
    });

    test('aborts entirely on malformed JSON', () => {
      const filePath = path.join(TEST_DIR, 'bad.json');
      fs.writeFileSync(filePath, '{not valid json', 'utf-8');

      expect(() => commands.handleImport(filePath)).toThrow('Invalid import data: not valid JSON');
      expect(storage.getTodos()).toHaveLength(0);
    });

    test('accepts a valid dueDate and rejects a malformed one', () => {
      const payload = [
        { id: 'due-ok', title: 'Has due', state: 'pending', createdAt: 1, dueDate: '2026-08-15' },
        { id: 'due-bad', title: 'Bad calendar date', state: 'pending', createdAt: 1, dueDate: '2026-13-40' },
      ];

      const message = commands.handleImport(importFile(payload));

      expect(message).toContain('Imported 1');
      expect(message).toContain('skipped 1 invalid');
      expect(storage.getTodos()[0].dueDate).toBe('2026-08-15');
    });
  });
});

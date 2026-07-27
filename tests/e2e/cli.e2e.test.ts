import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI_PATH = path.join(__dirname, '..', '..', 'dist', 'index.js');

function runCli(args: string[], home: string) {
  return spawnSync('node', [CLI_PATH, ...args], {
    encoding: 'utf-8',
    env: { ...process.env, HOME: home },
  });
}

describe('CLI e2e', () => {
  let TEST_HOME: string;

  beforeEach(() => {
    TEST_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'simple-todo-e2e-'));
  });

  afterEach(() => {
    if (fs.existsSync(TEST_HOME)) {
      fs.rmSync(TEST_HOME, { recursive: true });
    }
  });

  test('happy path: add, list, done, list, update, list, delete, list', () => {
    const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
    expect(add1.status).toBe(0);
    expect(add1.stdout).toContain('Added:');
    expect(add1.stdout).toContain('pending');
    expect(add1.stdout).toContain('Buy milk');
    const id1 = add1.stdout.trim().split(' ')[1];

    const add2 = runCli(['add', 'Walk dog'], TEST_HOME);
    expect(add2.status).toBe(0);
    const id2 = add2.stdout.trim().split(' ')[1];

    const list1 = runCli(['list'], TEST_HOME);
    expect(list1.status).toBe(0);
    const list1Lines = list1.stdout.trim().split('\n');
    expect(list1Lines).toHaveLength(2);
    expect(list1Lines[0]).toContain(id1);
    expect(list1Lines[0]).toContain('pending');
    expect(list1Lines[0]).toContain('Buy milk');
    expect(list1Lines[0]).toMatch(/\(created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);
    expect(list1Lines[1]).toContain(id2);
    expect(list1Lines[1]).toContain('pending');
    expect(list1Lines[1]).toContain('Walk dog');
    expect(list1Lines[1]).toMatch(/\(created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);

    const done = runCli(['done', id1], TEST_HOME);
    expect(done.status).toBe(0);
    expect(done.stdout).toContain('Done:');
    expect(done.stdout).toContain(id1);
    expect(done.stdout).toContain('Buy milk');
    expect(done.stdout).not.toMatch(/\(created:/);

    const list2 = runCli(['list'], TEST_HOME);
    const list2Lines = list2.stdout.trim().split('\n');
    expect(list2Lines[0]).toContain('pending');
    expect(list2Lines[0]).toContain('Walk dog');
    expect(list2Lines[1]).toContain('done');
    expect(list2Lines[1]).toContain('Buy milk');

    const update = runCli(['update', id2, 'Walk the dog outside'], TEST_HOME);
    expect(update.status).toBe(0);
    expect(update.stdout).toContain('Updated:');
    expect(update.stdout).toContain(id2);
    expect(update.stdout).toContain('Walk the dog outside');
    expect(update.stdout).not.toMatch(/\(created:/);

    const list3 = runCli(['list'], TEST_HOME);
    expect(list3.stdout).toContain('Walk the dog outside');
    expect(list3.stdout).toMatch(/\(created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);

    const del = runCli(['delete', id1], TEST_HOME);
    expect(del.status).toBe(0);
    expect(del.stdout).toContain('Deleted');
    expect(del.stdout).toContain(id1);
    expect(del.stdout).not.toMatch(/\(created:/);

    const list4 = runCli(['list'], TEST_HOME);
    const list4Lines = list4.stdout.trim().split('\n');
    expect(list4Lines).toHaveLength(1);
    expect(list4Lines[0]).toContain(id2);
    expect(list4Lines[0]).toContain('Walk the dog outside');
    expect(list4Lines[0]).toMatch(/\(created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);
  });

  test('list groups pending before done and sorts by title within each group', () => {
    const add1 = runCli(['add', 'Zebra task'], TEST_HOME);
    const id1 = add1.stdout.trim().split(' ')[1];
    runCli(['done', id1], TEST_HOME);
    runCli(['add', 'Cherry task'], TEST_HOME);
    runCli(['add', 'Apple task'], TEST_HOME);

    const result = runCli(['list'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('pending');
    expect(lines[0]).toContain('Apple task');
    expect(lines[1]).toContain('pending');
    expect(lines[1]).toContain('Cherry task');
    expect(lines[2]).toContain('done');
    expect(lines[2]).toContain('Zebra task');
  });

  test('list shows "No todos." when empty', () => {
    const list = runCli(['list'], TEST_HOME);
    expect(list.status).toBe(0);
    expect(list.stdout.trim()).toBe('No todos.');
  });

  test('rejects an empty title on add', () => {
    const result = runCli(['add', ''], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Error:');
    expect(result.stderr).toContain('Todo title cannot be empty');
  });

  test('errors when marking a non-existent id as done', () => {
    const result = runCli(['done', 'nonexistent'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Todo with id nonexistent not found');
  });

  test('errors when updating a non-existent id', () => {
    const result = runCli(['update', 'nonexistent', 'New title'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Todo with id nonexistent not found');
  });

  test('errors when deleting a non-existent id', () => {
    const result = runCli(['delete', 'nonexistent'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Todo with id nonexistent not found');
  });

  test('errors on an ambiguous id prefix collision', () => {
    const storageDir = path.join(TEST_HOME, '.simple-todo');
    fs.mkdirSync(storageDir, { recursive: true });
    const todos = [
      { id: 'aaaa1111-0000-0000-0000-000000000001', title: 'First', state: 'pending', createdAt: 1 },
      { id: 'aaaa2222-0000-0000-0000-000000000002', title: 'Second', state: 'pending', createdAt: 2 },
    ];
    fs.writeFileSync(path.join(storageDir, 'todos.json'), JSON.stringify(todos, null, 2), 'utf-8');

    const result = runCli(['done', 'aaaa'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Ambiguous todo id prefix "aaaa" matches 2 todos');
  });

  test('filter returns matching todos case-insensitive', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);
    runCli(['add', 'Walk dog'], TEST_HOME);
    runCli(['add', 'Buy groceries'], TEST_HOME);

    const result = runCli(['filter', 'buy'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Buy groceries');
    expect(lines[0]).toMatch(/\(created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);
    expect(lines[1]).toContain('Buy milk');
    expect(lines[1]).toMatch(/\(created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);
  });

  test('filter groups pending before done and sorts by title within each group', () => {
    const add1 = runCli(['add', 'Zebra task'], TEST_HOME);
    const id1 = add1.stdout.trim().split(' ')[1];
    runCli(['done', id1], TEST_HOME);
    runCli(['add', 'Zephyr task'], TEST_HOME);

    const result = runCli(['filter', 'z'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('pending');
    expect(lines[0]).toContain('Zephyr task');
    expect(lines[1]).toContain('done');
    expect(lines[1]).toContain('Zebra task');
  });

  test('filter shows "No todos match" message when nothing matches', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);
    runCli(['add', 'Walk dog'], TEST_HOME);

    const result = runCli(['filter', 'xyz'], TEST_HOME);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('No todos match "xyz".');
  });

  test('filter errors when search term is empty', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);

    const result = runCli(['filter', ''], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Filter term cannot be empty');
  });

  test('filter errors when search term is whitespace only', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);

    const result = runCli(['filter', '   '], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Filter term cannot be empty');
  });

  test('filter --state <state> combined with name filters by both', () => {
    const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
    const id1 = add1.stdout.trim().split(' ')[1];
    runCli(['add', 'Buy eggs'], TEST_HOME);
    runCli(['done', id1], TEST_HOME);

    const result = runCli(['filter', 'buy', '--state', 'done'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Buy milk');
  });

  test('filter --state <state> with no name returns all todos with that state', () => {
    const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
    const id1 = add1.stdout.trim().split(' ')[1];
    runCli(['add', 'Walk dog'], TEST_HOME);
    runCli(['done', id1], TEST_HOME);

    const result = runCli(['filter', '--state', 'pending'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Walk dog');
  });

  test('filter with neither name nor --state errors', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);

    const result = runCli(['filter'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Provide a name or --state to filter by');
  });

  test('filter --state <invalid> errors', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);

    const result = runCli(['filter', '--state', 'bogus'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid state. Valid values: pending, done');
  });

  test('clear with no flag deletes all todos', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);
    runCli(['add', 'Walk dog'], TEST_HOME);

    const result = runCli(['clear'], TEST_HOME);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('Cleared 2 todo(s).');

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout.trim()).toBe('No todos.');
  });

  test('clear --state done deletes only done todos', () => {
    const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
    const id1 = add1.stdout.trim().split(' ')[1];
    runCli(['add', 'Walk dog'], TEST_HOME);
    runCli(['done', id1], TEST_HOME);

    const result = runCli(['clear', '--state', 'done'], TEST_HOME);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('Cleared 1 done todo(s).');

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout).toContain('Walk dog');
    expect(list.stdout).not.toContain('Buy milk');
  });

  test('clear returns "No todos to clear." when nothing matches', () => {
    const result = runCli(['clear', '--state', 'done'], TEST_HOME);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('No todos to clear.');
  });

  test('list --json emits raw todo objects, pretty-printed', () => {
    const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
    const idPrefix1 = add1.stdout.trim().split(' ')[1];
    const add2 = runCli(['add', 'Walk dog'], TEST_HOME);
    const idPrefix2 = add2.stdout.trim().split(' ')[1];

    const result = runCli(['list', '--json'], TEST_HOME);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(parsed[0].id.startsWith(idPrefix1)).toBe(true);
    expect(parsed[0]).toMatchObject({ title: 'Buy milk', state: 'pending', createdAt: expect.any(Number) });
    expect(parsed[1].id.startsWith(idPrefix2)).toBe(true);
    expect(parsed[1]).toMatchObject({ title: 'Walk dog', state: 'pending', createdAt: expect.any(Number) });
    expect(result.stdout).toBe(JSON.stringify(parsed, null, 2) + '\n');
  });

  test('list --json emits "[]" when empty', () => {
    const result = runCli(['list', '--json'], TEST_HOME);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('[]');
  });

  test('filter --json emits matching raw todo objects', () => {
    const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
    const idPrefix1 = add1.stdout.trim().split(' ')[1];
    runCli(['add', 'Walk dog'], TEST_HOME);

    const result = runCli(['filter', 'buy', '--json'], TEST_HOME);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id.startsWith(idPrefix1)).toBe(true);
    expect(parsed[0]).toMatchObject({ title: 'Buy milk', state: 'pending', createdAt: expect.any(Number) });
  });

  test('filter --json with no matches emits "[]"', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);

    const result = runCli(['filter', 'xyz', '--json'], TEST_HOME);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('[]');
  });

  test('filter --json --state <invalid> still errors as plain text', () => {
    const result = runCli(['filter', '--state', 'bogus', '--json'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid state. Valid values: pending, done');
  });

  test('add, done, update, delete, clear remain human-readable without --json flag', () => {
    const program = runCli(['add', '--help'], TEST_HOME);
    expect(program.stdout).not.toContain('--json');
  });

  test('clear --state <invalid> errors', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);

    const result = runCli(['clear', '--state', 'bogus'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid state. Valid values: pending, done');
  });

  describe('interactive mode', () => {
    function runInteractive(input: string, home: string) {
      return spawnSync('node', [CLI_PATH, 'interactive'], {
        encoding: 'utf-8',
        input,
        env: { ...process.env, HOME: home },
      });
    }

    test('happy path: add, list, done <id>, exit', () => {
      const addResult = runCli(['add', 'Buy milk'], TEST_HOME);
      const id = addResult.stdout.trim().split(' ')[1];

      const result = runInteractive(
        ['list', `done ${id}`, 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('pending');
      expect(result.stdout).toContain(`Done: ${id}`);
      expect(result.stdout).toMatch(new RegExp(`${id} done`));
    });

    test('multi-word add and update without quotes', () => {
      const result = runInteractive(
        ['add Buy milk and eggs', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Buy milk and eggs');

      const listAfter = runCli(['list'], TEST_HOME);
      const id = listAfter.stdout.trim().split(' ')[0];

      const updateResult = runInteractive(
        [`update ${id} Buy milk eggs and bread`, 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );
      expect(updateResult.status).toBe(0);
      expect(updateResult.stdout).toContain('Buy milk eggs and bread');
    });

    test('unknown command prints error and loop continues', () => {
      const result = runInteractive(
        ['bogus', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Error: Unknown command: bogus');
      expect(result.stdout).toContain('No todos.');
    });

    test('handler error prints error and loop continues (no process exit)', () => {
      const result = runInteractive(
        ['done badid', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Error: Todo with id badid not found');
      expect(result.stdout).toContain('No todos.');
    });

    test('help prints available commands', () => {
      const result = runInteractive(['help', 'exit', ''].join('\n'), TEST_HOME);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('add');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('done');
      expect(result.stdout).toContain('update');
      expect(result.stdout).toContain('delete');
      expect(result.stdout).toContain('filter');
      expect(result.stdout).toContain('clear');
      expect(result.stdout).toContain('exit');
      expect(result.stdout).toContain('quit');
    });

    test('quit ends the REPL cleanly (exit code 0)', () => {
      const result = runInteractive(['quit', ''].join('\n'), TEST_HOME);
      expect(result.status).toBe(0);
    });

    test('EOF (stdin close) ends the REPL cleanly without a stack trace', () => {
      const result = runInteractive('list\n', TEST_HOME);
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
    });

    test('REPL state persists in the same storage file used by the one-shot CLI', () => {
      const result = runInteractive(['add From REPL', 'exit', ''].join('\n'), TEST_HOME);
      expect(result.status).toBe(0);

      const list = runCli(['list'], TEST_HOME);
      expect(list.stdout).toContain('From REPL');
    });

    test('filter <name> returns matching todos case-insensitively', () => {
      runCli(['add', 'Buy milk'], TEST_HOME);
      runCli(['add', 'Walk dog'], TEST_HOME);

      const result = runInteractive(
        ['filter MILK', 'filter nope', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Buy milk');
      expect(result.stdout).not.toContain('Walk dog');
      expect(result.stdout).toContain('No todos match "nope".');
    });

    test('filter <name> --state <state> parses correctly', () => {
      const addResult = runCli(['add', 'Buy milk'], TEST_HOME);
      const id = addResult.stdout.trim().split(' ')[1];
      runCli(['add', 'Buy eggs'], TEST_HOME);
      runCli(['done', id], TEST_HOME);

      const result = runInteractive(
        ['filter buy --state done', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Buy milk');
      expect(result.stdout).not.toContain('Buy eggs');
    });

    test('filter --state <state> with no name returns all todos with that state', () => {
      const addResult = runCli(['add', 'Buy milk'], TEST_HOME);
      const id = addResult.stdout.trim().split(' ')[1];
      runCli(['add', 'Walk dog'], TEST_HOME);
      runCli(['done', id], TEST_HOME);

      const result = runInteractive(
        ['filter --state pending', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Walk dog');
      expect(result.stdout).not.toContain('Buy milk');
    });

    test('delete <id> removes the todo from the shared storage file', () => {
      const add = runCli(['add', 'Buy milk'], TEST_HOME);
      const id = add.stdout.trim().split(' ')[1];

      const result = runInteractive(
        [`delete ${id}`, 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`Deleted todo ${id.substring(0, 8)}`);
      expect(result.stdout).toContain('No todos.');
    });

    test('clear with no flag deletes all todos', () => {
      runCli(['add', 'Buy milk'], TEST_HOME);
      runCli(['add', 'Walk dog'], TEST_HOME);

      const result = runInteractive(
        ['clear', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Cleared 2 todo(s).');
      expect(result.stdout).toContain('No todos.');
    });

    test('clear --state done deletes only done todos', () => {
      const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
      const id1 = add1.stdout.trim().split(' ')[1];
      runCli(['add', 'Walk dog'], TEST_HOME);
      runCli(['done', id1], TEST_HOME);

      const result = runInteractive(
        ['clear --state done', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Cleared 1 done todo(s).');
      expect(result.stdout).toContain('Walk dog');
      expect(result.stdout).not.toContain('Buy milk');
    });
  });
});

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

function runCliWithStdin(args: string[], input: string, home: string) {
  return spawnSync('node', [CLI_PATH, ...args], {
    encoding: 'utf-8',
    input,
    env: { ...process.env, HOME: home },
  });
}

function readStorage(home: string) {
  const file = path.join(home, '.simple-todo', 'todos.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  test('reopen moves a done todo back to pending', () => {
    const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
    const id1 = add1.stdout.trim().split(' ')[1];
    runCli(['done', id1], TEST_HOME);

    const reopen = runCli(['reopen', id1], TEST_HOME);
    expect(reopen.status).toBe(0);
    expect(reopen.stdout).toContain('Reopened:');
    expect(reopen.stdout).toContain(id1);
    expect(reopen.stdout).toContain('Buy milk');

    const list = runCli(['list'], TEST_HOME);
    const listLines = list.stdout.trim().split('\n');
    expect(listLines[0]).toContain('pending');
    expect(listLines[0]).toContain('Buy milk');
  });

  test('reopen on an already-pending todo is a no-op with the same success message', () => {
    const add1 = runCli(['add', 'Buy milk'], TEST_HOME);
    const id1 = add1.stdout.trim().split(' ')[1];

    const reopen = runCli(['reopen', id1], TEST_HOME);
    expect(reopen.status).toBe(0);
    expect(reopen.stdout).toContain('Reopened:');
    expect(reopen.stdout).toContain('Buy milk');

    const list = runCli(['list'], TEST_HOME);
    const listLines = list.stdout.trim().split('\n');
    expect(listLines[0]).toContain('pending');
  });

  test('errors when reopening a non-existent id', () => {
    const result = runCli(['reopen', 'nonexistent'], TEST_HOME);
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

  test('add --due <date> sets a due date shown in list and --json', () => {
    const add = runCli(['add', 'Buy milk', '--due', '2026-08-15'], TEST_HOME);
    expect(add.status).toBe(0);

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout).toContain('due: 2026-08-15');

    const listJson = runCli(['list', '--json'], TEST_HOME);
    const parsed = JSON.parse(listJson.stdout);
    expect(parsed[0].dueDate).toBe('2026-08-15');
  });

  test('add without --due creates a todo with no due date', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout).not.toContain('due:');

    const listJson = runCli(['list', '--json'], TEST_HOME);
    const parsed = JSON.parse(listJson.stdout);
    expect(parsed[0].dueDate).toBeNull();
  });

  test('add --due <invalid> errors and does not create the todo', () => {
    const result = runCli(['add', 'Buy milk', '--due', 'not-a-date'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid due date. Expected format: YYYY-MM-DD');

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout.trim()).toBe('No todos.');
  });

  test('add --due <past date> is allowed', () => {
    const result = runCli(['add', 'Buy milk', '--due', '2000-01-01'], TEST_HOME);
    expect(result.status).toBe(0);

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout).toContain('due: 2000-01-01');
  });

  test('filter --due <date> matches todos with that exact due date', () => {
    runCli(['add', 'Buy milk', '--due', '2026-08-15'], TEST_HOME);
    runCli(['add', 'Walk dog', '--due', '2026-08-16'], TEST_HOME);

    const result = runCli(['filter', '--due', '2026-08-15'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Buy milk');
  });

  test('filter --overdue matches only pending todos with a past due date', () => {
    runCli(['add', 'Overdue pending', '--due', '2000-01-01'], TEST_HOME);
    const add2 = runCli(['add', 'Overdue but done', '--due', '2000-01-01'], TEST_HOME);
    const id2 = add2.stdout.trim().split(' ')[1];
    runCli(['done', id2], TEST_HOME);
    runCli(['add', 'Future pending', '--due', '2999-01-01'], TEST_HOME);
    runCli(['add', 'No due date'], TEST_HOME);

    const result = runCli(['filter', '--overdue'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Overdue pending');
  });

  test('filter --due <invalid> errors', () => {
    const result = runCli(['filter', '--due', 'nope'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid due date. Expected format: YYYY-MM-DD');
  });

  test('filter --json includes dueDate field', () => {
    runCli(['add', 'Buy milk', '--due', '2026-08-15'], TEST_HOME);

    const result = runCli(['filter', '--due', '2026-08-15', '--json'], TEST_HOME);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed[0].dueDate).toBe('2026-08-15');
  });

  test('add --priority <priority> sets the priority, shown in list and --json', () => {
    const add = runCli(['add', 'Buy milk', '--priority', 'high'], TEST_HOME);
    expect(add.status).toBe(0);

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout).toContain('priority: high');

    const listJson = runCli(['list', '--json'], TEST_HOME);
    const parsed = JSON.parse(listJson.stdout);
    expect(parsed[0].priority).toBe('high');
  });

  test('add without --priority defaults to mid', () => {
    runCli(['add', 'Buy milk'], TEST_HOME);

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout).toContain('priority: mid');

    const listJson = runCli(['list', '--json'], TEST_HOME);
    const parsed = JSON.parse(listJson.stdout);
    expect(parsed[0].priority).toBe('mid');
  });

  test('add --priority <invalid> errors and does not create the todo', () => {
    const result = runCli(['add', 'Buy milk', '--priority', 'urgent'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid priority. Valid values: low, mid, high');

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout.trim()).toBe('No todos.');
  });

  test('filter --priority <priority> matches todos with that priority', () => {
    runCli(['add', 'Buy milk', '--priority', 'high'], TEST_HOME);
    runCli(['add', 'Walk dog', '--priority', 'low'], TEST_HOME);

    const result = runCli(['filter', '--priority', 'high'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Buy milk');
  });

  test('filter --priority combines with --state using AND logic', () => {
    const add1 = runCli(['add', 'Buy milk', '--priority', 'high'], TEST_HOME);
    const id1 = add1.stdout.trim().split(' ')[1];
    runCli(['add', 'Buy eggs', '--priority', 'high'], TEST_HOME);
    runCli(['done', id1], TEST_HOME);

    const result = runCli(['filter', '--priority', 'high', '--state', 'done'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Buy milk');
  });

  test('filter --priority <invalid> errors', () => {
    const result = runCli(['filter', '--priority', 'urgent'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid priority. Valid values: low, mid, high');
  });

  test('filter --json includes priority field', () => {
    runCli(['add', 'Buy milk', '--priority', 'high'], TEST_HOME);

    const result = runCli(['filter', '--priority', 'high', '--json'], TEST_HOME);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed[0].priority).toBe('high');
  });

  test('filter --due-before <date> matches todos with a due date strictly before it', () => {
    runCli(['add', 'Earlier', '--due', '2026-08-14'], TEST_HOME);
    runCli(['add', 'Boundary', '--due', '2026-08-15'], TEST_HOME);
    runCli(['add', 'Later', '--due', '2026-08-16'], TEST_HOME);

    const result = runCli(['filter', '--due-before', '2026-08-15'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Earlier');
  });

  test('filter --due-before <invalid> errors', () => {
    const result = runCli(['filter', '--due-before', 'nope'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid due date. Expected format: YYYY-MM-DD');
  });

  test('filter --due-after <date> matches todos with a due date strictly after it', () => {
    runCli(['add', 'Earlier', '--due', '2026-07-14'], TEST_HOME);
    runCli(['add', 'Boundary', '--due', '2026-07-15'], TEST_HOME);
    runCli(['add', 'Later', '--due', '2026-07-16'], TEST_HOME);

    const result = runCli(['filter', '--due-after', '2026-07-15'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Later');
  });

  test('filter --due-after <invalid> errors', () => {
    const result = runCli(['filter', '--due-after', 'nope'], TEST_HOME);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Invalid due date. Expected format: YYYY-MM-DD');
  });

  test('filter --due-before and --due-after combine to express a range', () => {
    runCli(['add', 'Too early', '--due', '2026-06-30'], TEST_HOME);
    runCli(['add', 'In range', '--due', '2026-07-15'], TEST_HOME);
    runCli(['add', 'Too late', '--due', '2026-08-01'], TEST_HOME);

    const result = runCli(['filter', '--due-before', '2026-08-01', '--due-after', '2026-07-01'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('In range');
  });

  test('filter --due-today matches todos due today regardless of state', () => {
    const today = getTodayDateString();
    runCli(['add', 'Due today', '--due', today], TEST_HOME);
    runCli(['add', 'Due later', '--due', '2999-01-01'], TEST_HOME);
    runCli(['add', 'No due date'], TEST_HOME);

    const result = runCli(['filter', '--due-today'], TEST_HOME);
    expect(result.status).toBe(0);
    const lines = result.stdout.trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Due today');
  });

  test('filter --due-before/--due-after/--due-today with no matches return distinct messages', () => {
    runCli(['add', 'Some todo', '--due', '2026-08-15'], TEST_HOME);

    const before = runCli(['filter', '--due-before', '2000-01-01'], TEST_HOME);
    expect(before.stdout.trim()).toBe('No todos due before "2000-01-01".');

    const after = runCli(['filter', '--due-after', '2999-01-01'], TEST_HOME);
    expect(after.stdout.trim()).toBe('No todos due after "2999-01-01".');

    const today = runCli(['filter', '--due-today'], TEST_HOME);
    expect(today.stdout.trim()).toBe('No todos due today.');
  });

  test('filter --json includes dueDate field with --due-before/--due-after/--due-today', () => {
    const today = getTodayDateString();
    runCli(['add', 'Due today', '--due', today], TEST_HOME);

    const result = runCli(['filter', '--due-today', '--json'], TEST_HOME);
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].dueDate).toBe(today);
  });

  test('a stored todo with no priority field (legacy data) is treated as mid in list', () => {
    const storageDir = path.join(TEST_HOME, '.simple-todo');
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(
      path.join(storageDir, 'todos.json'),
      JSON.stringify([{ id: 'legacy-1', title: 'Legacy todo', state: 'pending', createdAt: Date.now(), dueDate: null }]),
      'utf-8'
    );

    const list = runCli(['list'], TEST_HOME);
    expect(list.stdout).toContain('priority: mid');

    const listJson = runCli(['list', '--json'], TEST_HOME);
    expect(JSON.parse(listJson.stdout)[0].priority).toBe('mid');
  });

  describe('export / import', () => {
    test('export with no flags prints the full todos array as JSON to stdout', () => {
      runCli(['add', 'Buy milk'], TEST_HOME);
      runCli(['add', 'Walk dog'], TEST_HOME);

      const result = runCli(['export'], TEST_HOME);
      expect(result.status).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveLength(2);
      expect(parsed.map((t: { title: string }) => t.title).sort()).toEqual(['Buy milk', 'Walk dog']);
    });

    test('export with no todos prints "[]"', () => {
      const result = runCli(['export'], TEST_HOME);
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual([]);
    });

    test('export --file <path> writes the JSON to <path> instead of stdout', () => {
      runCli(['add', 'Buy milk'], TEST_HOME);
      const exportPath = path.join(TEST_HOME, 'export.json');

      const result = runCli(['export', '--file', exportPath], TEST_HOME);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Exported 1 todo(s)');
      const written = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
      expect(written).toHaveLength(1);
      expect(written[0].title).toBe('Buy milk');
    });

    test('import with no flags reads JSON from stdin and merges by default', () => {
      runCli(['add', 'Existing'], TEST_HOME);
      const existing = readStorage(TEST_HOME)[0];
      const payload = JSON.stringify([
        { ...existing, title: 'Existing (dup)' },
        { id: 'new-id-1', title: 'Imported todo', state: 'pending', createdAt: Date.now(), dueDate: null },
      ]);

      const result = runCliWithStdin(['import'], payload, TEST_HOME);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Imported 1');
      expect(result.stdout).toContain('skipped 1 (id collision)');
      const todos = readStorage(TEST_HOME);
      expect(todos).toHaveLength(2);
      expect(todos.find((t: { id: string }) => t.id === existing.id).title).toBe('Existing');
    });

    test('import --file <path> reads JSON from <path> instead of stdin', () => {
      const importPath = path.join(TEST_HOME, 'in.json');
      fs.writeFileSync(
        importPath,
        JSON.stringify([{ id: 'file-id', title: 'From file', state: 'pending', createdAt: Date.now(), dueDate: null }]),
        'utf-8'
      );

      const result = runCli(['import', '--file', importPath], TEST_HOME);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Imported 1');
      const todos = readStorage(TEST_HOME);
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('From file');
    });

    test('import --replace replaces the existing list wholesale', () => {
      runCli(['add', 'Old todo'], TEST_HOME);
      const importPath = path.join(TEST_HOME, 'in.json');
      fs.writeFileSync(
        importPath,
        JSON.stringify([{ id: 'new-id', title: 'New', state: 'pending', createdAt: Date.now(), dueDate: null }]),
        'utf-8'
      );

      const result = runCli(['import', '--file', importPath, '--replace'], TEST_HOME);
      expect(result.status).toBe(0);
      const todos = readStorage(TEST_HOME);
      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe('new-id');
    });

    test('export | import round-trips without any flags', () => {
      runCli(['add', 'Round trip'], TEST_HOME);

      const exportResult = runCli(['export'], TEST_HOME);
      expect(exportResult.status).toBe(0);

      const importResult = runCliWithStdin(['import'], exportResult.stdout, TEST_HOME);
      expect(importResult.status).toBe(0);
      expect(importResult.stdout).toContain('Imported 0');
      expect(importResult.stdout).toContain('skipped 1 (id collision)');
      expect(readStorage(TEST_HOME)).toHaveLength(1);
    });

    test('aborts entirely with an error when the payload is not a JSON array', () => {
      const result = runCliWithStdin(['import'], JSON.stringify({ not: 'an array' }), TEST_HOME);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('expected a JSON array');
      expect(readStorage(TEST_HOME)).toEqual([]);
    });

    test('aborts entirely with an error on malformed JSON', () => {
      const result = runCliWithStdin(['import'], '{not valid json', TEST_HOME);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('not valid JSON');
      expect(readStorage(TEST_HOME)).toEqual([]);
    });

    test('skips invalid entries and counts them separately from id collisions', () => {
      const payload = JSON.stringify([
        { id: 'ok-1', title: 'Valid', state: 'pending', createdAt: Date.now(), dueDate: null },
        { id: 'bad-1', title: 'Bad state', state: 'nope', createdAt: Date.now(), dueDate: null },
        { title: 'No id', state: 'pending', createdAt: Date.now(), dueDate: null },
      ]);

      const result = runCliWithStdin(['import'], payload, TEST_HOME);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Imported 1');
      expect(result.stdout).toContain('skipped 2 invalid');
      expect(readStorage(TEST_HOME)).toHaveLength(1);
    });

    test('export includes priority for every todo, and export | import round-trips it', () => {
      runCli(['add', 'Buy milk', '--priority', 'high'], TEST_HOME);

      const exportResult = runCli(['export'], TEST_HOME);
      const exported = JSON.parse(exportResult.stdout);
      expect(exported[0].priority).toBe('high');

      runCli(['clear'], TEST_HOME);
      const importResult = runCliWithStdin(['import'], exportResult.stdout, TEST_HOME);
      expect(importResult.status).toBe(0);
      expect(importResult.stdout).toContain('Imported 1');
      expect(readStorage(TEST_HOME)[0].priority).toBe('high');
    });

    test('importing an entry with no priority field treats it as mid, not invalid', () => {
      const payload = JSON.stringify([{ id: 'no-priority', title: 'Legacy', state: 'pending', createdAt: Date.now(), dueDate: null }]);

      const result = runCliWithStdin(['import'], payload, TEST_HOME);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Imported 1');
      expect(result.stdout).toContain('skipped 0 invalid');
      expect(readStorage(TEST_HOME)[0].priority).toBe('mid');
    });

    test('importing an entry with an invalid priority is skipped as invalid', () => {
      const payload = JSON.stringify([
        { id: 'bad-priority', title: 'Bad priority', state: 'pending', createdAt: Date.now(), dueDate: null, priority: 'urgent' },
      ]);

      const result = runCliWithStdin(['import'], payload, TEST_HOME);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Imported 0');
      expect(result.stdout).toContain('skipped 1 invalid');
      expect(readStorage(TEST_HOME)).toHaveLength(0);
    });
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

    test('happy path: add, done <id>, reopen <id>, list, exit', () => {
      const addResult = runCli(['add', 'Buy milk'], TEST_HOME);
      const id = addResult.stdout.trim().split(' ')[1];

      const result = runInteractive(
        [`done ${id}`, `reopen ${id}`, 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`Reopened: ${id}`);
      expect(result.stdout).toMatch(new RegExp(`${id} pending`));
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

    test('add <title> --due <date> sets a due date', () => {
      const result = runInteractive(
        ['add Buy milk --due 2026-08-15', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Buy milk');
      expect(result.stdout).toContain('due: 2026-08-15');
    });

    test('add <title> --due <invalid> prints error and does not create the todo', () => {
      const result = runInteractive(
        ['add Buy milk --due nope', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Error: Invalid due date. Expected format: YYYY-MM-DD');
      expect(result.stdout).toContain('No todos.');
    });

    test('filter --due <date> matches todos with that exact due date', () => {
      runCli(['add', 'Buy milk', '--due', '2026-08-15'], TEST_HOME);
      runCli(['add', 'Walk dog', '--due', '2026-08-16'], TEST_HOME);

      const result = runInteractive(
        ['filter --due 2026-08-15', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Buy milk');
      expect(result.stdout).not.toContain('Walk dog');
    });

    test('filter --overdue matches only pending todos with a past due date', () => {
      runCli(['add', 'Overdue pending', '--due', '2000-01-01'], TEST_HOME);
      runCli(['add', 'Future pending', '--due', '2999-01-01'], TEST_HOME);

      const result = runInteractive(
        ['filter --overdue', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Overdue pending');
      expect(result.stdout).not.toContain('Future pending');
    });

    test('add <title> --priority <priority> sets the priority', () => {
      const result = runInteractive(
        ['add Buy milk --priority high', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Buy milk');
      expect(result.stdout).toContain('priority: high');
    });

    test('add <title> --priority <invalid> prints error and does not create the todo', () => {
      const result = runInteractive(
        ['add Buy milk --priority urgent', 'list', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Error: Invalid priority. Valid values: low, mid, high');
      expect(result.stdout).toContain('No todos.');
    });

    test('filter --priority <priority> matches todos with that priority', () => {
      runCli(['add', 'Buy milk', '--priority', 'high'], TEST_HOME);
      runCli(['add', 'Walk dog', '--priority', 'low'], TEST_HOME);

      const result = runInteractive(
        ['filter --priority high', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Buy milk');
      expect(result.stdout).not.toContain('Walk dog');
    });

    test('filter --due-before <date> parses correctly', () => {
      runCli(['add', 'Earlier', '--due', '2026-08-14'], TEST_HOME);
      runCli(['add', 'Later', '--due', '2026-08-16'], TEST_HOME);

      const result = runInteractive(
        ['filter --due-before 2026-08-15', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Earlier');
      expect(result.stdout).not.toContain('Later');
    });

    test('filter --due-after <date> parses correctly', () => {
      runCli(['add', 'Earlier', '--due', '2026-07-14'], TEST_HOME);
      runCli(['add', 'Later', '--due', '2026-07-16'], TEST_HOME);

      const result = runInteractive(
        ['filter --due-after 2026-07-15', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Later');
      expect(result.stdout).not.toContain('Earlier');
    });

    test('filter --due-today matches todos due today', () => {
      const today = getTodayDateString();
      runCli(['add', 'Due today', '--due', today], TEST_HOME);
      runCli(['add', 'Due later', '--due', '2999-01-01'], TEST_HOME);

      const result = runInteractive(
        ['filter --due-today', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Due today');
      expect(result.stdout).not.toContain('Due later');
    });

    test('filter --json emits raw todo objects', () => {
      runCli(['add', 'Buy milk', '--priority', 'high'], TEST_HOME);
      runCli(['add', 'Walk dog', '--priority', 'low'], TEST_HOME);

      const result = runInteractive(
        ['filter --priority high --json', 'exit', ''].join('\n'),
        TEST_HOME,
      );

      expect(result.status).toBe(0);
      const parsed = JSON.parse(result.stdout.slice(result.stdout.indexOf('[')).split('todo> ')[0]);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe('Buy milk');
    });

    test('list --json emits raw todo objects', () => {
      runCli(['add', 'Buy milk'], TEST_HOME);

      const result = runInteractive(['list --json', 'exit', ''].join('\n'), TEST_HOME);

      expect(result.status).toBe(0);
      const parsed = JSON.parse(result.stdout.slice(result.stdout.indexOf('[')).split('todo> ')[0]);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe('Buy milk');
    });

    test('help lists --json, --priority, and the date-range flags on filter, and --json on list', () => {
      const result = runInteractive(['help', 'exit', ''].join('\n'), TEST_HOME);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('--json');
      expect(result.stdout).toContain('--priority');
      expect(result.stdout).toContain('--due-before');
      expect(result.stdout).toContain('--due-after');
      expect(result.stdout).toContain('--due-today');
    });
  });
});

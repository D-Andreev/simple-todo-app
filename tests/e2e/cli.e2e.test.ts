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
    expect(list2Lines[0]).toContain('done');
    expect(list2Lines[1]).toContain('pending');

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
    expect(lines[0]).toContain('Buy milk');
    expect(lines[0]).toMatch(/\(created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);
    expect(lines[1]).toContain('Buy groceries');
    expect(lines[1]).toMatch(/\(created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);
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
});

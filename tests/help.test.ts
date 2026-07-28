import { BANNER, renderHelp } from '../src/help';

describe('help', () => {
  test('BANNER is a plain-text, multi-line ASCII banner with no color codes', () => {
    expect(BANNER).toContain('\n');
    expect(BANNER).not.toMatch(/\x1b\[/);
    expect(BANNER.split('\n').length).toBeGreaterThan(1);
  });

  test('cli help includes the banner, group headers, and interactive-only entry, but not exit/quit/help', () => {
    const output = renderHelp('cli');
    expect(output).toContain(BANNER);
    expect(output).toContain('Manage todos:');
    expect(output).toContain('Find & filter:');
    expect(output).toContain('Data:');
    expect(output).toContain('Session:');
    expect(output).toContain('interactive');
    expect(output).not.toMatch(/^\s*exit\s/m);
    expect(output).not.toMatch(/^\s*quit\s/m);
  });

  test('interactive help includes the banner, group headers, and help/exit/quit, but not the interactive command', () => {
    const output = renderHelp('interactive');
    expect(output).toContain(BANNER);
    expect(output).toContain('Manage todos:');
    expect(output).toContain('Find & filter:');
    expect(output).toContain('Data:');
    expect(output).toContain('Session:');
    expect(output).toMatch(/^\s*help\s/m);
    expect(output).toMatch(/^\s*exit\s/m);
    expect(output).toMatch(/^\s*quit\s/m);
    expect(output).not.toMatch(/^\s*interactive\s/m);
  });

  test('cli help includes at least one usage example line', () => {
    const output = renderHelp('cli');
    expect(output).toContain('add "Buy milk"');
  });
});

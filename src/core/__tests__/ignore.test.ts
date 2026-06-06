import { describe, it, expect } from 'vitest';
import { parseIgnore, isExcluded, applyIgnore } from '../ignore.js';

describe('parseIgnore (EARS-024)', () => {
  it('drops blank lines and comments, retaining real patterns', () => {
    const patterns = parseIgnore('# comment\n\nsecrets.env\n');
    expect(patterns.map((p) => p.source)).toEqual(['secrets.env']);
  });

  it('treats an indented leading-hash line as a comment (EARS-024 unhappy)', () => {
    const patterns = parseIgnore('   # not a pattern\nreal.env\n');
    expect(patterns.map((p) => p.source)).toEqual(['real.env']);
  });

  it('returns no patterns for an all-comment / all-blank file', () => {
    expect(parseIgnore('# a\n\n   \n# b')).toEqual([]);
  });

  it('trims trailing whitespace from a pattern line', () => {
    const patterns = parseIgnore('a.env   \n');
    expect(patterns[0]!.source).toBe('a.env');
  });

  it('records a negation pattern with its negate flag set (EARS-026)', () => {
    const patterns = parseIgnore('tests/**\n!tests/keep.sh\n');
    expect(patterns[0]!.negate).toBe(false);
    expect(patterns[1]!.negate).toBe(true);
    expect(patterns[1]!.source).toBe('tests/keep.sh');
  });
});

describe('isExcluded — glob semantics (EARS-025)', () => {
  it('single-star does not cross a directory separator', () => {
    const p = parseIgnore('tests/*.env');
    expect(isExcluded('tests/a.env', p)).toBe(true);
    expect(isExcluded('tests/sub/b.env', p)).toBe(false);
  });

  it('double-star matches across directory separators', () => {
    const p = parseIgnore('corpus/**');
    expect(isExcluded('corpus/x/y/evil.sh', p)).toBe(true);
  });

  it('a bare double-star pattern matches everything', () => {
    const p = parseIgnore('**');
    expect(isExcluded('anything/at/all.txt', p)).toBe(true);
  });

  it('leading slash anchors to root', () => {
    const p = parseIgnore('/build.sh');
    expect(isExcluded('build.sh', p)).toBe(true);
    expect(isExcluded('nested/build.sh', p)).toBe(false);
  });

  it('trailing slash matches a directory and everything beneath it', () => {
    const p = parseIgnore('fixtures/');
    expect(isExcluded('fixtures/mal/install.sh', p)).toBe(true);
    expect(isExcluded('fixtures', p)).toBe(false);
  });

  it('single-char wildcard matches exactly one character', () => {
    const p = parseIgnore('a?.sh');
    expect(isExcluded('ab.sh', p)).toBe(true);
    expect(isExcluded('abc.sh', p)).toBe(false);
  });

  it('a bare filename pattern matches that file at any depth (unanchored)', () => {
    const p = parseIgnore('secrets.env');
    expect(isExcluded('secrets.env', p)).toBe(true);
    expect(isExcluded('deep/nested/secrets.env', p)).toBe(true);
  });

  it('an embedded-slash pattern is anchored to root', () => {
    const p = parseIgnore('a/b.txt');
    expect(isExcluded('a/b.txt', p)).toBe(true);
    expect(isExcluded('x/a/b.txt', p)).toBe(false);
  });

  it('escapes regex metacharacters in literal pattern text', () => {
    const p = parseIgnore('weird+name(1).txt');
    expect(isExcluded('weird+name(1).txt', p)).toBe(true);
    expect(isExcluded('weirdXnameX1Y.txt', p)).toBe(false);
  });

  it('returns false when no patterns are supplied', () => {
    expect(isExcluded('anything.txt', [])).toBe(false);
  });
});

describe('isExcluded — negation (EARS-026)', () => {
  it('re-includes a file a previous pattern excluded', () => {
    const p = parseIgnore('tests/**\n!tests/keep.sh');
    expect(isExcluded('tests/keep.sh', p)).toBe(false);
    expect(isExcluded('tests/other.sh', p)).toBe(true);
  });

  it('last matching pattern wins (exclude after negate)', () => {
    const p = parseIgnore('!keep.sh\nkeep.sh');
    expect(isExcluded('keep.sh', p)).toBe(true);
  });

  it('a negation that matches nothing leaves other exclusions intact', () => {
    const p = parseIgnore('*.env\n!nothing-here.txt');
    expect(isExcluded('a.env', p)).toBe(true);
  });
});

describe('applyIgnore — provenance summary (EARS-029/030)', () => {
  it('partitions paths into kept + excluded and counts per pattern', () => {
    const { kept, summary } = applyIgnore(
      ['keep.md', 'a.env', 'b.env', 'sub/c.env'],
      '*.env',
    );
    expect(kept).toEqual(['keep.md']);
    expect(summary.excludedCount).toBe(3);
    expect(summary.patterns).toEqual([{ pattern: '*.env', count: 3 }]);
  });

  it('reports zero excluded and an empty pattern list when nothing matches (EARS-030)', () => {
    const { kept, summary } = applyIgnore(['a.md', 'b.md'], '*.env');
    expect(kept).toEqual(['a.md', 'b.md']);
    expect(summary.excludedCount).toBe(0);
    expect(summary.patterns).toEqual([]);
  });

  it('only lists patterns that actually excluded a file', () => {
    const { summary } = applyIgnore(['a.env'], '*.env\n*.key');
    expect(summary.patterns).toEqual([{ pattern: '*.env', count: 1 }]);
  });

  it('attributes a re-included file to neither pattern (negation)', () => {
    const { kept, summary } = applyIgnore(
      ['tests/keep.sh', 'tests/drop.sh'],
      'tests/**\n!tests/keep.sh',
    );
    expect(kept).toEqual(['tests/keep.sh']);
    expect(summary.excludedCount).toBe(1);
    expect(summary.patterns).toEqual([{ pattern: 'tests/**', count: 1 }]);
  });

  it('empty ignore text excludes nothing', () => {
    const { kept, summary } = applyIgnore(['a.env'], '');
    expect(kept).toEqual(['a.env']);
    expect(summary.excludedCount).toBe(0);
  });
});

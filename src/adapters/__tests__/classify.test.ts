import { describe, it, expect } from 'vitest';
import { classify } from '../classify.js';
import type { ComponentKind } from '../../core/types.js';

describe('classify', () => {
  const cases: ReadonlyArray<[string, ComponentKind]> = [
    ['SKILL.md', 'skill'],
    ['skills/foo/SKILL.md', 'skill'],
    ['agents/reviewer.md', 'agent'],
    ['plugin.json', 'plugin-manifest'],
    ['settings.json', 'settings'],
    ['.claude/settings.json', 'settings'],
    ['hooks/post-tool.json', 'hook'],
    ['scripts/install.sh', 'script'],
    ['run.bash', 'script'],
    ['.mcp.json', 'mcp-config'],
    ['README.md', 'other'],
    ['src/index.ts', 'other'],
  ];

  for (const [path, kind] of cases) {
    // @EARS-010
    it(`classifies ${path} as ${kind}`, () => {
      expect(classify(path)).toBe(kind);
    });
  }
});

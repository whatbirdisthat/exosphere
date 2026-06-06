import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const coreDir = resolve(here, '..');

/** Recursively collect every .ts source file under src/core (excluding test dirs). */
function coreSources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === '__tests__') {
        continue;
      }
      coreSources(full, out);
    } else if (name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('ADR-001 layering guard — pure core never imports node:fs / node:crypto (EARS-077/088)', () => {
  it('no src/core/* source has an import statement pulling in a node: builtin', () => {
    const offenders: string[] = [];
    for (const file of coreSources(coreDir)) {
      const text = readFileSync(file, 'utf8');
      // Only IMPORT lines matter — a `node:` mention inside a comment/string is fine. An import of any
      // node builtin (fs, crypto, child_process, path, …) in the pure core breaks ADR-001.
      for (const line of text.split('\n')) {
        if (/^\s*import\b[^\n]*['"]node:/.test(line)) {
          offenders.push(`${file}: ${line.trim()}`);
        }
      }
    }
    expect(offenders, `core/* must not import any node: builtin (ADR-001)`).toEqual([]);
  });
});

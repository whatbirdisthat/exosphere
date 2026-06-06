// T1 intra-file shell taint/dataflow analyzer (R9b / ADR-006).
//
// Tracks tainted SOURCES (command substitution, network fetch, decode, sensitive-env read, stdin read)
// flowing across lines through variable assignments into dangerous SINKS (pipe-to-shell, eval/exec,
// source, write-to-autorun-location) — catching multi-line obfuscation the single-line T0 regex misses.
//
// SAFETY INVARIANT (SMU §6 / ADR-001 / ADR-006, EARS-066): this is a PURE function over the file's
// content STRING. It splits/tokenises/pattern-matches text and NOTHING ELSE. It never passes any part
// of the analysed script to a shell, `eval`, `Function`, `child_process`, or any execution sink — not
// even a base64 SOURCE is decoded (we only need to know a value is *tainted by* a decode, not its
// bytes). The analyzer completing at all is proof nothing in the script ran.

import type { FileRecord, RuleMatch } from '../types.js';

/** The component kinds that are bundled shell scripts (EARS-060). */
const SHELL_KINDS: ReadonlySet<FileRecord['kind']> = new Set(['script', 'hook'] as const);

/**
 * Strip a trailing `#` comment from a shell line, conservatively. A `#` starts a comment when it is at
 * the start of the (trimmed) line or preceded by whitespace AND not inside single/double quotes. We
 * scan left-to-right tracking quote state so a `#` inside a quoted string (or a `$#`/`${#x}`) is kept.
 */
export function stripComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] as string;
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === '#' && !inSingle && !inDouble) {
      const prev = i === 0 ? '' : (line[i - 1] as string);
      // a comment '#' is at column 0 or follows whitespace, and is not a parameter expansion ($#/${#}).
      if ((i === 0 || /\s/.test(prev)) && prev !== '$') {
        return line.slice(0, i);
      }
    }
  }
  return line;
}

/** Sensitive env-var names whose read is treated as a tainted SOURCE. */
const SENSITIVE_ENV =
  /\b(?:printenv|env)\s+\w*(?:SECRET|TOKEN|KEY|PASSWORD|CRED|EVIL)\w*|\$\{?\w*(?:SECRET|TOKEN|KEY|PASSWORD|CRED)\w*\}?/i;

/**
 * Does a right-hand side contain a tainted SOURCE? (EARS-060)
 *  - command substitution `$(...)` or backticks
 *  - a network fetch (curl/wget/fetch)
 *  - a decode (base64 -d / --decode / -D, xxd, openssl ... -d/enc -d)
 *  - a read of a sensitive environment variable
 * (the `read VAR` stdin SOURCE is handled separately, since it has no RHS).
 */
export function rhsHasSource(rhs: string): boolean {
  if (/\$\([^)]*\)/.test(rhs) || /`[^`]*`/.test(rhs)) {
    return true; // command substitution
  }
  if (/\b(?:curl|wget|fetch)\b/.test(rhs)) {
    return true; // network fetch
  }
  if (/\bbase64\s+(?:-d|--decode|-D)\b/.test(rhs) || /\bxxd\b/.test(rhs) || /\bopenssl\b[^\n]*\s-d\b/.test(rhs)) {
    return true; // decode
  }
  if (SENSITIVE_ENV.test(rhs)) {
    return true; // sensitive env read
  }
  return false;
}

/** Parse an assignment line into `{ name, rhs }`, or undefined if it is not a simple assignment. */
export function parseAssignment(line: string): { name: string; rhs: string } | undefined {
  // forms: NAME=..., export NAME=..., local NAME=..., declare NAME=...
  const m = /^(?:export\s+|local\s+|declare\s+(?:-\w+\s+)?)?([A-Za-z_]\w*)=(.*)$/.exec(line.trim());
  if (!m) {
    return undefined;
  }
  return { name: m[1] as string, rhs: m[2] as string };
}

/** The variable names referenced (`$VAR` / `${VAR}`) within a string. */
export function referencedVars(text: string): string[] {
  const names = new Set<string>();
  const re = /\$\{?([A-Za-z_]\w*)\}?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    names.add(m[1] as string);
  }
  return [...names];
}

/** Autorun locations: writing into any of these is a dangerous SINK (EARS-062). */
const AUTORUN_LOCATION =
  /(?:~\/\.bashrc|~\/\.bash_profile|~\/\.profile|~\/\.zshrc|\/etc\/cron|crontab\b|\bsystemd\b|\.config\/systemd|authorized_keys|\.ssh\/authorized_keys)/;

/**
 * Given a line and the current taint set, return the SINK kind reached by a tainted variable, or
 * undefined. A SINK only fires when a TAINTED variable participates (EARS-062). Sink shapes:
 *  - pipe into a shell: `... "$VAR" | sh|bash|zsh`
 *  - eval / exec / source / `.` of a tainted value
 *  - write/append a tainted value into an autorun location
 */
export function sinkForLine(line: string, tainted: ReadonlySet<string>): boolean {
  const refs = referencedVars(line);
  const usesTainted = refs.some((r) => tainted.has(r));
  if (!usesTainted) {
    return false;
  }
  // pipe to a shell
  if (/\|\s*(?:sh|bash|zsh|dash|ksh)\b/.test(line)) {
    return true;
  }
  // eval / exec
  if (/\b(?:eval|exec)\b/.test(line)) {
    return true;
  }
  // source / dot-source of a tainted target
  if (/(?:^|\s)(?:source|\.)\s+["']?\$/.test(line)) {
    return true;
  }
  // write/append a tainted value into an autorun location
  if (/>>?/.test(line) && AUTORUN_LOCATION.test(line)) {
    return true;
  }
  return false;
}

/**
 * The T1 analyzer: a single forward pass over the script's lines. Seeds + propagates taint through
 * assignments and reports a finding at each SINK line a tainted variable reaches.
 */
export function shellTaintToSink(file: FileRecord): RuleMatch[] {
  if (!SHELL_KINDS.has(file.kind)) {
    return [];
  }
  const matches: RuleMatch[] = [];
  const tainted = new Set<string>();
  const rawLines = file.content.split('\n');
  let lineNo = 0;
  for (const raw of rawLines) {
    lineNo++;
    const line = stripComment(raw);
    if (line.trim() === '') {
      continue;
    }

    // A SINK check runs BEFORE we mutate taint for this line, so a tainted var reaching a sink on the
    // same line it is (re)assigned still counts via its referenced vars.
    if (sinkForLine(line, tainted)) {
      // `sinkForLine` only returns true when a tainted var is referenced, so there is always at least
      // one tainted name to cite in the excerpt.
      const named = referencedVars(line).filter((r) => tainted.has(r));
      matches.push({ line: lineNo, excerpt: `${line.trim()} ($${named[0]})` });
    }

    const assign = parseAssignment(line);
    if (assign) {
      const taintedByRef = referencedVars(assign.rhs).some((r) => tainted.has(r));
      if (rhsHasSource(assign.rhs) || taintedByRef) {
        tainted.add(assign.name);
      } else {
        // reassigned from a clean RHS — it is no longer tainted going forward.
        tainted.delete(assign.name);
      }
    } else if (/^\s*read\s+([A-Za-z_]\w*)/.test(line)) {
      // `read VAR` is a stdin SOURCE (EARS-060) — taint the read variable.
      const rm = /^\s*read\s+([A-Za-z_]\w*)/.exec(line);
      tainted.add(rm![1] as string);
    }
  }
  return matches;
}

// The ruleset COMPILER (ADR-005 / R4): turns declarative rule DATA (`RuleSpec`) into the runtime
// `Rule` the engine applies. This is the single place where rule data becomes a runtime matcher.
//
// LOAD-BEARING SAFETY INVARIANT (SMU §6 / ADR-001 / ADR-005, EARS-051): rule DATA is never executed.
//   • a `line-pattern` source is only ever passed to `new RegExp(source, flags)` — a RegExp MATCHES
//     text, it does not run it. There is NO `eval`, NO `Function`/`new Function`, NO dynamic
//     `require`/`import`, and NO shell anywhere in this module.
//   • a `builtin` matcher name only ever indexes the closed `BUILTIN_MATCHERS` registry — data selects
//     a pre-existing vetted function, it cannot define new behaviour.
// A contributed rule-data file that tries to smuggle executable code is therefore structurally inert:
// at worst its pattern is an invalid/literal regex (rejected at load — EARS-052) or its builtin name is
// unknown (rejected at load — EARS-053). It can never run.

import type { FileRecord, MatcherSpec, Rule, RuleMatch, RuleSpec } from './types.js';
import { RulesetError } from './types.js';
import {
  BUILTIN_MATCHERS,
  CROSSFILE_BUILTIN_MATCHERS,
  type BuiltinMatcher,
  type CrossFileBuiltinMatcher,
} from './matchers/builtins.js';

/** Build a per-line regex matcher from a `line-pattern` matcher spec. */
function compileLinePattern(
  ruleId: string,
  spec: Extract<MatcherSpec, { kind: 'line-pattern' }>,
): (file: FileRecord) => RuleMatch[] {
  let linePattern: RegExp;
  try {
    // The ONLY thing done with rule-supplied pattern text: compile it to a matcher. A RegExp tests
    // text; it never executes it. The 'g' flag is stripped so `.test` is stateless per line.
    linePattern = new RegExp(spec.pattern, (spec.flags ?? '').replace('g', ''));
  } catch {
    throw new RulesetError(
      'INVALID_PATTERN',
      ruleId,
      `rule "${ruleId}" has an invalid line-pattern regex source: ${spec.pattern}`,
    );
  }
  const appliesTo = spec.appliesTo ? new Set(spec.appliesTo) : undefined;
  return (file: FileRecord): RuleMatch[] => {
    if (appliesTo && !appliesTo.has(file.kind)) {
      return [];
    }
    const matches: RuleMatch[] = [];
    let lineNo = 0;
    for (const line of file.content.split('\n')) {
      lineNo++;
      if (linePattern.test(line)) {
        matches.push({ line: lineNo, excerpt: line.trim() });
      }
    }
    return matches;
  };
}

/**
 * The compiled matcher channels for a `builtin` spec. A per-file builtin populates `detect` only. A
 * CROSS-FILE builtin (ADR-007 / R9b.1) populates BOTH: `detectCrossFile` (the full pass over the file
 * set, used by the engine) and `detect` (the same analyzer over a singleton set — so the per-file
 * channel still catches single-file-decidable cases like a path-traversal include, which keeps the
 * precision-budget guard, that calls `detect`, honest).
 */
interface CompiledBuiltin {
  readonly detect: (file: FileRecord) => RuleMatch[];
  readonly detectCrossFile?: (file: FileRecord, files: readonly FileRecord[]) => RuleMatch[];
}

/** Resolve a `builtin` matcher spec to its named structural matcher(s) (closed registries). */
function compileBuiltin(
  ruleId: string,
  spec: Extract<MatcherSpec, { kind: 'builtin' }>,
): CompiledBuiltin {
  const appliesTo = spec.appliesTo ? new Set(spec.appliesTo) : undefined;
  const inScope = (file: FileRecord): boolean => !appliesTo || appliesTo.has(file.kind);

  if (Object.prototype.hasOwnProperty.call(CROSSFILE_BUILTIN_MATCHERS, spec.name)) {
    // A cross-file builtin: route the whole-set pass to `detectCrossFile`; the per-file `detect` runs
    // the same analyzer over a singleton set (catches single-file-decidable cases, e.g. an escape).
    const crossFile = (CROSSFILE_BUILTIN_MATCHERS as Record<string, CrossFileBuiltinMatcher>)[spec.name]!;
    return {
      detect: (file: FileRecord): RuleMatch[] => (inScope(file) ? crossFile(file, [file]) : []),
      detectCrossFile: (file: FileRecord, files: readonly FileRecord[]): RuleMatch[] =>
        inScope(file) ? crossFile(file, files) : [],
    };
  }

  const builtin = (BUILTIN_MATCHERS as Record<string, BuiltinMatcher>)[spec.name];
  if (builtin === undefined) {
    throw new RulesetError(
      'UNKNOWN_BUILTIN',
      ruleId,
      `rule "${ruleId}" references an unknown builtin matcher "${spec.name}"`,
    );
  }
  // A builtin already enforces its own kind scope; an optional `appliesTo` narrows it further.
  return {
    detect: (file: FileRecord): RuleMatch[] => (inScope(file) ? builtin(file) : []),
  };
}

/** Compile one declarative `RuleSpec` (data) into the runtime `Rule` the engine applies. */
export function compileRule(spec: RuleSpec): Rule {
  if (spec.matcher.kind === 'line-pattern') {
    const detect = compileLinePattern(spec.id, spec.matcher);
    return {
      id: spec.id,
      detectionClass: spec.detectionClass,
      severity: spec.severity,
      why: spec.why,
      tier: spec.tier,
      framework: spec.framework,
      detect,
    };
  }
  const compiled = compileBuiltin(spec.id, spec.matcher);
  return {
    id: spec.id,
    detectionClass: spec.detectionClass,
    severity: spec.severity,
    why: spec.why,
    tier: spec.tier,
    framework: spec.framework,
    detect: compiled.detect,
    ...(compiled.detectCrossFile ? { detectCrossFile: compiled.detectCrossFile } : {}),
  };
}

/** Compile a whole declarative ruleset (data) into runtime rules. Throws `RulesetError` on a bad spec. */
export function compileRuleset(specs: readonly RuleSpec[]): readonly Rule[] {
  return specs.map(compileRule);
}

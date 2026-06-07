import type { Rule, RuleSpec } from './types.js';
/** Compile one declarative `RuleSpec` (data) into the runtime `Rule` the engine applies. */
export declare function compileRule(spec: RuleSpec): Rule;
/** Compile a whole declarative ruleset (data) into runtime rules. Throws `RulesetError` on a bad spec. */
export declare function compileRuleset(specs: readonly RuleSpec[]): readonly Rule[];

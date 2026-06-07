import type { Rule, RuleSpec } from './types.js';
import { compileRuleset } from './compile.js';
import { dangerousBashRules } from './rules/dangerous-bash.rules.js';
import { promptInjectionRules } from './rules/prompt-injection.rules.js';
import { overBroadPermsRules } from './rules/over-broad-perms.rules.js';
import { committedSecretsRules } from './rules/committed-secrets.rules.js';
import { toolDescriptionPoisoningRules } from './rules/tool-description-poisoning.rules.js';
import { dataflowTaintRules } from './rules/dataflow-taint.rules.js';
import { resourceExhaustionRules } from './rules/resource-exhaustion.rules.js';
import { auditEvasionRules } from './rules/audit-evasion.rules.js';

/**
 * The version of the rule-DATA SCHEMA / matcher vocabulary (ADR-005 / R4, EARS-054). Bumped only on a
 * breaking change to the `RuleSpec` shape or the matcher vocabulary — the stable contract a contributor
 * targets. `1.0.0` is the first externalised schema.
 */
export const RULESET_SCHEMA_VERSION = '1.0.0';

/**
 * The version of the curated rule CONTENT (EARS-054). R4 externalised the rules into declarative data
 * (0.3.0); R9b added the T1 intra-file `dataflow-taint` rule (0.4.0); R9b.1 added the T1 CROSS-FILE
 * `dataflow-taint` rule (0.5.0); the threat-map slice annotated every rule with its STRIDE portal /
 * agentic axis (0.6.0); the gap ritual's first two ABSENT-cell classes — `resource-exhaustion`
 * (STRIDE D) and `audit-evasion` (STRIDE R) — add new detection content, so the content version steps
 * to `0.7.0`. The SCHEMA version is unchanged — new detection classes are data additions, not a
 * breaking change to the `RuleSpec` contract (ADR-005).
 */
export const RULESET_VERSION = '0.7.0';

/**
 * The SCHEMA version of the `.skillsentry.lock` approval baseline (R9d / ADR-008). Bumped only on a
 * breaking change to the `LockFile` shape. `1.0.0` is the first temporal-tier lock schema. The lockfile
 * is DATA the tool reads, never executes — same boundary as the ruleset data (EARS-088).
 */
export const LOCKFILE_SCHEMA_VERSION = '1.0.0';

/**
 * The full curated ruleset as DECLARATIVE DATA (ADR-005 / R4, extended by ADR-006 / R9b): the union of
 * all detection-class rule-data modules. This is the externally-declared, contributable artefact — each
 * entry is a self-describing `RuleSpec`. The ruleset is DATA, never code (EARS-051): nothing here is
 * executed. R9b adds the T1 `dataflow-taint` rules ADDITIVELY — T0 rules are unchanged and still run
 * always (EARS-058).
 */
export const ruleSpecs: readonly RuleSpec[] = [
  ...dangerousBashRules,
  ...promptInjectionRules,
  ...overBroadPermsRules,
  ...committedSecretsRules,
  ...toolDescriptionPoisoningRules,
  ...dataflowTaintRules,
  ...resourceExhaustionRules,
  ...auditEvasionRules,
];

/**
 * The compiled runtime ruleset the engine applies. `compileRuleset` turns each `RuleSpec` (data) into
 * a runtime `Rule` by building a matching `RegExp` for line-patterns or selecting a named builtin —
 * never by executing rule content. A malformed spec is rejected here at load time with a typed
 * `RulesetError` (EARS-052/053), not mid-scan.
 */
export const ruleset: readonly Rule[] = compileRuleset(ruleSpecs);

import type { Rule } from './types.js';
import { dangerousBashRules } from './scanners/dangerous-bash.js';
import { promptInjectionRules } from './scanners/prompt-injection.js';
import { overBroadPermsRules } from './scanners/over-broad-perms.js';
import { committedSecretsRules } from './scanners/committed-secrets.js';
import { toolDescriptionPoisoningRules } from './scanners/tool-description-poisoning.js';

/** The curated, versioned ruleset version. R9a widens detection breadth (framework mapping,
 *  encoding-evasion, tool-description poisoning) — all tier T0 (deterministic + offline). */
export const RULESET_VERSION = '0.2.0';

/** The full curated ruleset: the union of all five detection-class rule modules. */
export const ruleset: readonly Rule[] = [
  ...dangerousBashRules,
  ...promptInjectionRules,
  ...overBroadPermsRules,
  ...committedSecretsRules,
  ...toolDescriptionPoisoningRules,
];

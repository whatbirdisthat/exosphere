import type { Rule } from './types.js';
import { dangerousBashRules } from './scanners/dangerous-bash.js';
import { promptInjectionRules } from './scanners/prompt-injection.js';
import { overBroadPermsRules } from './scanners/over-broad-perms.js';
import { committedSecretsRules } from './scanners/committed-secrets.js';

/** The curated, versioned ruleset version. */
export const RULESET_VERSION = '0.1.0';

/** The full curated ruleset: the union of all four detection-class rule modules. */
export const ruleset: readonly Rule[] = [
  ...dangerousBashRules,
  ...promptInjectionRules,
  ...overBroadPermsRules,
  ...committedSecretsRules,
];

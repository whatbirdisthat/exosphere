import type { FileRecord, Finding, Rule } from './types.js';
/** Apply a ruleset to in-memory files, producing findings. Pure — no IO. */
export declare function scan(files: readonly FileRecord[], rules: readonly Rule[]): Finding[];

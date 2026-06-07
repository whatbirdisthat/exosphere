import type { Capability, CapabilitySet, Finding, LockFile } from './types.js';
/**
 * Project the fresh scan findings to a CAPABILITY SET — the trust-relevant fingerprint the drift diff
 * keys on (EARS-075/080). The key is the STABLE structural identity of a finding
 * (rule/class/severity/file/line) and deliberately omits `excerpt`/`why`/`owasp`/`atlas`: those can
 * change under a benign reword or framework-id refresh without the capability itself changing. Keying
 * on the set (not raw bytes) is what makes a doc edit benign drift and a new sink an escalation.
 */
export declare function extractCapabilitySet(findings: readonly Finding[]): CapabilitySet;
/** A stable, comparable string key for a capability (used for set membership + deterministic ordering). */
export declare function capabilitySetKey(c: Capability): string;
/**
 * Serialise a `LockFile` to BYTE-STABLE deterministic JSON (EARS-076): object keys are sorted
 * recursively, the per-file hash map is emitted in sorted path order, the capability array is emitted in
 * sorted-key order, and the output ends with exactly one trailing newline. Re-approving an identical
 * target state therefore yields byte-identical lock contents regardless of in-memory ordering.
 */
export declare function serialiseLock(lock: LockFile): string;

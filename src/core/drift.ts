// R9d / ADR-008 — PURE core of the T3 temporal diff. Per ADR-001 this module imports only
// `core/types` (+ the pure `core/lock`); it NEVER touches `node:fs`/`node:crypto`/`child_process`/the
// network. It is a pure function over ALREADY-PARSED in-memory records (the fresh findings, the fresh
// per-file hashes, and the parsed lockfile) — the IO that produced those lives in the adapter layer.
//
// The diff keys on the CAPABILITY SET, not raw byte hashes (the load-bearing FP-line decision): a file
// whose bytes changed but whose capability set is unchanged is BENIGN drift (an informational note, no
// finding); a capability that GREW since approval is an ESCALATION (the rug-pull); an approved file
// whose bytes changed re-surfaces as approval-invalidation.

import type {
  CapabilitySet,
  DriftFinding,
  DriftSummary,
  Finding,
  LockFile,
} from './types.js';
import { capabilitySetKey, extractCapabilitySet } from './lock.js';

/** A MITRE ATLAS technique id for agentic supply-chain compromise (reused from the cross-file taint rule). */
const DRIFT_ATLAS = 'AML.T0011';
/** OWASP Agentic Supply-Chain Compromise — the framework anchor for every T3 drift finding. */
const DRIFT_OWASP = 'ASI04';

/**
 * Diff the fresh scan against an approval lockfile and classify drift (EARS-079–085). Pure: no IO.
 *
 * @param freshFindings the T0/T1 findings from the current scan.
 * @param freshHashes   the current per-file sha256 map (computed in the adapter, passed in).
 * @param lock          the parsed approval baseline.
 */
export function diffCapabilities(
  freshFindings: readonly Finding[],
  freshHashes: Readonly<Record<string, string>>,
  lock: LockFile,
): DriftSummary {
  const freshCaps = extractCapabilitySet(freshFindings);
  const approvedKeys = new Set(lock.capabilities.map(capabilitySetKey));

  const findings: DriftFinding[] = [];

  // 1 · ESCALATION — a fresh capability NOT present in the approved set (the set grew since approval).
  for (const finding of freshFindings) {
    const cap = extractCapabilitySet([finding])[0]!;
    if (!approvedKeys.has(capabilitySetKey(cap))) {
      findings.push(escalation(finding));
    }
  }

  // 2 · APPROVAL INVALIDATION — an approved capability whose underlying file's bytes changed since
  //     approval (an approval is only as durable as the bytes it approved). Surfaced once per changed
  //     approved file that still carries the approved capability.
  for (const cap of lock.capabilities) {
    const oldHash = lock.fileHashes[cap.file];
    const newHash = freshHashes[cap.file];
    const fileChanged = oldHash !== undefined && newHash !== undefined && oldHash !== newHash;
    if (fileChanged && approvedKeys.has(capabilitySetKey(cap)) && stillPresent(cap, freshCaps)) {
      findings.push(invalidation(cap.file, cap.line, cap.severity, cap.rule, cap.detectionClass));
    }
  }

  // 3 · BENIGN DRIFT note — count files whose hash changed (informational only; never a finding here).
  const changedSinceApproval = countChangedFiles(lock.fileHashes, freshHashes);

  // 4 · Anti-laundering disclosure — how many HIGH-severity findings the lock recorded as approved.
  const approvedHighCount = lock.capabilities.filter((c) => c.severity === 'high').length;

  return { changedSinceApproval, approvedHighCount, findings };
}

function stillPresent(cap: CapabilitySet[number], freshCaps: CapabilitySet): boolean {
  const key = capabilitySetKey(cap);
  return freshCaps.some((c) => capabilitySetKey(c) === key);
}

function countChangedFiles(
  oldHashes: Readonly<Record<string, string>>,
  newHashes: Readonly<Record<string, string>>,
): number {
  let changed = 0;
  for (const [path, oldHash] of Object.entries(oldHashes)) {
    const newHash = newHashes[path];
    if (newHash !== undefined && newHash !== oldHash) {
      changed++;
    }
  }
  return changed;
}

function escalation(source: Finding): DriftFinding {
  return {
    driftKind: 'escalation',
    rule: 'lockfile-drift/capability-escalation',
    detectionClass: 'version-drift',
    severity: source.severity,
    file: source.file,
    line: source.line,
    excerpt: source.excerpt,
    why: `capability escalation since approval: a ${source.detectionClass} finding (${source.rule}) appeared at ${source.file}:${source.line} that was not present in the .skillsentry.lock baseline`,
    tier: 'T3',
    owasp: DRIFT_OWASP,
    atlas: DRIFT_ATLAS,
  };
}

function invalidation(
  file: string,
  line: number,
  severity: Finding['severity'],
  approvedRule: string,
  approvedClass: Finding['detectionClass'],
): DriftFinding {
  return {
    driftKind: 'approval-invalidation',
    rule: 'lockfile-drift/approval-invalidation',
    detectionClass: 'version-drift',
    severity,
    file,
    line,
    excerpt: `${approvedRule} (${approvedClass})`,
    why: `approval invalidated: ${file} carried an approved finding at line ${line} but has changed since it was approved (its sha256 differs from the .skillsentry.lock baseline)`,
    tier: 'T3',
    owasp: DRIFT_OWASP,
    atlas: DRIFT_ATLAS,
  };
}

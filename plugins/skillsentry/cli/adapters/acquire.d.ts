import type { InputKind } from '../core/types.js';
export interface Acquisition {
    readonly kind: InputKind;
    /** Absolute path to the audited root (the temp clone for git-url, the dir for local-dir). */
    readonly root: string;
    /** Remove any temporary resources created by this acquisition. Idempotent. */
    readonly cleanup: () => Promise<void>;
}
/** Classify a raw target as a git-url or local-dir (or throw AuditError). */
export declare function resolveInput(target: string | undefined): Promise<InputKind>;
/** Acquire the audited source read-only. git-url → hostile shallow clone; local-dir → in place. */
export declare function acquire(target: string): Promise<Acquisition>;

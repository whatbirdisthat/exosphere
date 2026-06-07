import type { ComponentKind } from '../core/types.js';
/** Classify a POSIX-relative path into a ComponentKind. Pure — no IO. */
export declare function classify(relPath: string): ComponentKind;

// Domain types for the pure scan core. No IO — these are plain data shapes and typed errors.
// Per ADR-001, `core/*` depends on this module only and never imports node:fs / node:child_process.
export class AuditError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'AuditError';
        this.code = code;
    }
}
export class RulesetError extends Error {
    code;
    /** The id of the offending rule. */
    ruleId;
    constructor(code, ruleId, message) {
        super(message);
        this.name = 'RulesetError';
        this.code = code;
        this.ruleId = ruleId;
    }
}

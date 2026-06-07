const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };
/** Aggregate findings to a verdict: PASS (none) / REVIEW (low–med) / BLOCK (any high). */
export function aggregate(findings) {
    if (findings.length === 0) {
        return 'PASS';
    }
    const maxRank = Math.max(...findings.map((f) => SEVERITY_RANK[f.severity]));
    return maxRank === SEVERITY_RANK.high ? 'BLOCK' : 'REVIEW';
}
/** Exit code for a verdict: non-zero only on BLOCK. */
export function exitCodeFor(verdict) {
    return verdict === 'BLOCK' ? 1 : 0;
}

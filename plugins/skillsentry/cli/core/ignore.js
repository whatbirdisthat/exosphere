// Pure gitignore-subset matcher for `.skillsentryignore` (R3). No IO — operates on the ignore-file
// text and candidate root-relative path strings. Per ADR-002 this lives in `core/*` (depends only
// on `core/types`) so it is fully unit-pinnable as coordinates; the filesystem read of the ignore
// file happens in the `enumerate` adapter at the edge.
//
// Supported gitignore subset (ADR-002): `#` comments, blank lines, `*` (non-`/`), `**` (cross-`/`),
// `?` (single non-`/` char), leading `/` (root anchor), trailing `/` (directory + contents),
// embedded `/` (root anchor), and `!` negation (last matching pattern wins).
/** Parse `.skillsentryignore` text into ordered patterns, dropping blanks and `#` comments. */
export function parseIgnore(text) {
    const patterns = [];
    for (const rawLine of text.split('\n')) {
        const line = rawLine.replace(/\s+$/, '');
        const trimmed = line.trimStart();
        if (trimmed === '' || trimmed.startsWith('#')) {
            continue;
        }
        const negate = trimmed.startsWith('!');
        const body = negate ? trimmed.slice(1) : trimmed;
        patterns.push({ source: body, negate, regex: compile(body) });
    }
    return patterns;
}
/** Compile one gitignore-subset pattern body into an anchored RegExp over a root-relative path. */
function compile(body) {
    // A trailing slash means "this directory and everything under it".
    const isDir = body.endsWith('/');
    let pattern = isDir ? body.slice(0, -1) : body;
    // Leading slash, or any embedded slash, anchors the pattern to the root.
    // An unanchored bare name (no internal slash) may match at any depth.
    const rooted = pattern.startsWith('/');
    if (rooted) {
        pattern = pattern.slice(1);
    }
    const anchored = rooted || pattern.includes('/');
    // Translate glob tokens to regex, escaping every other metacharacter.
    let re = '';
    for (let i = 0; i < pattern.length; i++) {
        const ch = pattern[i];
        if (ch === '*') {
            if (pattern[i + 1] === '*') {
                re += '.*'; // ** crosses separators
                i++;
            }
            else {
                re += '[^/]*'; // * stays within a segment
            }
        }
        else if (ch === '?') {
            re += '[^/]'; // single non-separator char
        }
        else {
            re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }
    const prefix = anchored ? '^' : '^(?:.*/)?';
    // A directory pattern matches the dir and its contents; a file pattern matches exactly.
    const suffix = isDir ? '/.*$' : '$';
    return new RegExp(prefix + re + suffix);
}
/** True if `path` (POSIX, root-relative) is excluded by the patterns. Last match wins (negation). */
export function isExcluded(path, patterns) {
    let excluded = false;
    for (const p of patterns) {
        if (p.regex.test(path)) {
            excluded = !p.negate;
        }
    }
    return excluded;
}
/**
 * Partition paths into kept vs excluded and build the transparency summary.
 * `patterns` in the summary lists only patterns that actually excluded a file; a path
 * re-included by a negation is attributed to no pattern.
 */
export function applyIgnore(paths, ignoreText) {
    const patterns = parseIgnore(ignoreText);
    const kept = [];
    const counts = new Map();
    let excludedCount = 0;
    for (const path of paths) {
        const blamed = blame(path, patterns);
        if (blamed === undefined) {
            kept.push(path);
        }
        else {
            excludedCount++;
            counts.set(blamed, (counts.get(blamed) ?? 0) + 1);
        }
    }
    const summary = {
        excludedCount,
        patterns: [...counts.entries()].map(([pattern, count]) => ({ pattern, count })),
    };
    return { kept, summary };
}
/** Return the source text of the pattern responsible for excluding `path`, or undefined if kept. */
function blame(path, patterns) {
    let blamed;
    for (const p of patterns) {
        if (p.regex.test(path)) {
            blamed = p.negate ? undefined : p.source;
        }
    }
    return blamed;
}

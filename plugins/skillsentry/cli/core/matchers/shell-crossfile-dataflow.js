// T1 CROSS-FILE shell taint/dataflow analyzer (R9b.1 / ADR-007).
//
// Extends the R9b intra-file analyzer to be cross-file WITHIN the audited target: when a shell script
// `source`s/`. `-includes a sibling script shipped in the same target, taint that flows from the
// sibling into a dangerous SINK in the analysed file is detected. Closes ADR-006 residual #1.
//
// SAFETY INVARIANT (SMU §6 / ADR-001 / ADR-006 / ADR-007, EARS-074): this is a PURE function over the
// already-enumerated in-memory `FileRecord[]`. "Resolving an include" means looking a sibling up by
// path in an array ALREADY IN MEMORY — it NEVER reads the filesystem, NEVER opens a network connection
// or fetches a URL, and NEVER passes any part of any script to a shell / `eval` / `Function` /
// `child_process`. An include that escapes the target root is REPORTED, never read (refusal +
// disclosure). The include resolver is a hand-written POSIX path-string normaliser — NOT `node:path`
// reaching disk — so `core/*` still imports only `core/types` (ADR-001).
import { SHELL_KINDS, forwardPass } from './shell-dataflow.js';
/**
 * Parse `source <path>` / `. <path>` directives whose target is a LITERAL relative path (EARS-067).
 * A dynamic target (`source "$F"`, `source $F`, `. "${LIB}"`) is NOT a resolvable literal include —
 * it is the R9b *intra-file* "source of a tainted target" SINK and is left to that analyzer. A
 * process-substitution / remote target (`source <(curl …)`) likewise names no literal sibling path.
 * Comment lines are ignored.
 */
export function parseIncludes(content) {
    const includes = [];
    let lineNo = 0;
    for (const raw of content.split('\n')) {
        lineNo++;
        const line = raw.trim();
        if (line.startsWith('#')) {
            continue;
        }
        // `source PATH` or `. PATH` at the start of the (trimmed) line; PATH optionally single/double quoted.
        const m = /^(?:source|\.)\s+(?:"([^"]+)"|'([^']+)'|(\S+))/.exec(line);
        if (!m) {
            continue;
        }
        const rawPath = (m[1] ?? m[2] ?? m[3]);
        // a literal include path does not begin with `$` (variable), `<` (process substitution), or look
        // like a URL scheme — those name no static sibling and are left to the intra-file sink.
        if (rawPath.startsWith('$') || rawPath.startsWith('<') || /^[a-z][a-z0-9+.-]*:\/\//i.test(rawPath)) {
            continue;
        }
        includes.push({ line: lineNo, rawPath });
    }
    return includes;
}
/**
 * Resolve a literal include path against the analysed file's directory, in PURE STRING SPACE (EARS-067/
 * 069). Returns the normalised in-tree POSIX path, or `{ kind: 'escape' }` when the path leaves the
 * audited root (a `..` that climbs above the root, or an absolute path). Never touches the filesystem.
 */
export function resolveInclude(fromPath, includePath) {
    // an absolute include leaves the relative audited tree entirely.
    if (includePath.startsWith('/')) {
        return { kind: 'escape' };
    }
    const dirSegments = fromPath.split('/').slice(0, -1); // the analysed file's directory segments
    const out = [...dirSegments];
    for (const seg of includePath.split('/')) {
        if (seg === '' || seg === '.') {
            continue;
        }
        if (seg === '..') {
            if (out.length === 0) {
                return { kind: 'escape' }; // climbing above the audited root
            }
            out.pop();
            continue;
        }
        out.push(seg);
    }
    return { kind: 'in-tree', path: out.join('/') };
}
/** A sibling's EXPORTED tainted variable names: the final taint set after the R9b forward pass (EARS-068). */
export function exportedTaint(file) {
    return forwardPass(file).tainted;
}
/**
 * Collect the taint a file imports from the siblings it `source`s, transitively (one or more hops),
 * guarded against cycles by a visited set (EARS-068/070). Escapes encountered along the way are
 * collected as findings (EARS-069). Returns the merged imported taint plus any escape matches found
 * IN THE ANALYSED FILE (escapes deeper in the chain belong to those files' own analyses).
 */
function gatherImports(file, byPath) {
    const imported = new Set();
    const escapes = [];
    const visited = new Set([file.path]);
    // resolve THIS file's direct includes: record escapes here; recurse into in-tree siblings for taint.
    for (const inc of parseIncludes(file.content)) {
        const resolved = resolveInclude(file.path, inc.rawPath);
        if (resolved.kind === 'escape') {
            escapes.push({ line: inc.line, excerpt: `source ${inc.rawPath} (path traversal escapes the target root)` });
            continue;
        }
        collectSiblingTaint(resolved.path, byPath, visited, imported);
    }
    return { imported, escapes };
}
/**
 * Recursively merge a sibling's exported taint into `imported`, following its own (in-tree) includes
 * transitively. Cycle-safe via `visited`. A missing/ignored sibling contributes nothing (EARS-070).
 */
function collectSiblingTaint(path, byPath, visited, imported) {
    if (visited.has(path)) {
        return;
    }
    visited.add(path);
    const sibling = byPath.get(path);
    if (sibling === undefined || !SHELL_KINDS.has(sibling.kind)) {
        return; // missing/ignored or non-shell: import nothing
    }
    for (const v of exportedTaint(sibling)) {
        imported.add(v);
    }
    // follow the sibling's own includes so a one-hop+ chain (a→b→c) propagates taint (EARS-070).
    for (const inc of parseIncludes(sibling.content)) {
        const resolved = resolveInclude(sibling.path, inc.rawPath);
        if (resolved.kind === 'in-tree') {
            collectSiblingTaint(resolved.path, byPath, visited, imported);
        }
    }
}
/**
 * The T1 cross-file analyzer (R9b.1). Given the analysed file and the whole in-memory file set, it:
 *  1. reports any include that escapes the audited root as a path-traversal finding (EARS-069);
 *  2. imports the tainted exports of the in-tree siblings it `source`s, transitively (EARS-068/070);
 *  3. runs the R9b forward pass with that imported seed and reports the sinks that fire ONLY because
 *     of the imported taint — the cross-file flow the intra-file pass misses (EARS-071/072). Sinks
 *     that would fire without any import are the R9b rule's job and are NOT duplicated here.
 * Pure string space over in-memory records; never executes, reads disk, or fetches (EARS-074).
 */
export function shellCrossfileTaintToSink(file, files) {
    if (!SHELL_KINDS.has(file.kind)) {
        return [];
    }
    const byPath = new Map(files.map((f) => [f.path, f]));
    const { imported, escapes } = gatherImports(file, byPath);
    const matches = [...escapes];
    if (imported.size > 0) {
        // sinks that fire WITH the imported taint…
        const seeded = forwardPass(file, imported).matches;
        // …minus the sinks that already fire WITHOUT it (those are the intra-file R9b rule's findings).
        const baselineLines = new Set(forwardPass(file).matches.map((m) => m.line));
        const sourcedFiles = sourcedSiblingNames(file, byPath);
        for (const m of seeded) {
            if (!baselineLines.has(m.line)) {
                matches.push({ line: m.line, excerpt: `${m.excerpt} [via ${sourcedFiles}]` });
            }
        }
    }
    return matches;
}
/** A human label of the in-tree siblings this file directly sources, for the finding excerpt. */
function sourcedSiblingNames(file, byPath) {
    const names = [];
    for (const inc of parseIncludes(file.content)) {
        const resolved = resolveInclude(file.path, inc.rawPath);
        if (resolved.kind === 'in-tree' && byPath.has(resolved.path)) {
            names.push(resolved.path);
        }
    }
    return names.join(', ');
}

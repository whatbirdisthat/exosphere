# ADR-004: Tier-pluggable rule record + framework-mapping metadata

**Status:** Accepted
**Date:** 2026-06-06
**Roadmap item:** ROADMAP R9a (Detection breadth — framework mapping + encoding-evasion + tool-description poisoning)
**Spawning agent:** lifecycle-orchestrator (embodying handler-architect) at run top
**Supersedes/extends:** ADR-001 (Pipeline + pure-scan-core). The pure-core / never-execute boundary is unchanged.

## Context

R9a widens detection with three additions (framework mapping, encoding/obfuscation evasion,
tool/skill-description poisoning) under the binding decisions signed off in
`doc/research/deeper-detection-plan.md` §7 and the ROADMAP "Binding decisions" note:

1. **Deterministic default, T0 only.** Every default rule is 100% deterministic + offline. No
   runtime LLM/network dependency may be introduced. The architecture must leave room for an
   **opt-in semantic tier (T2) later without rework** — but T2 is NOT built now.
2. **Framework mapping = OWASP (ASI/MCP/LLM) + MITRE ATLAS** technique IDs per rule, from the
   start. Every existing and new rule carries both, surfaced per-finding in md + JSON.
3. The detection engine must stay **tier-pluggable**: the rule/scanner interface must be shaped so
   a future T2 tier can be added without reshaping the `Rule` record or the engine.

The load-bearing question this ADR records: **what shape does the `Rule`/`Finding` record take so
that (a) every rule carries framework IDs, and (b) a future opt-in tier is a pure additive extension
rather than a rewrite?**

## Decision

**Extend the `Rule` record with three new readonly metadata fields and a `tier` discriminator; carry
the framework IDs through to `Finding`. Make none of it require new runtime dependencies.**

```ts
type RuleTier = 'T0';                       // only T0 exists now; the union is the extension point

interface FrameworkMapping {
  readonly owasp: string;                   // OWASP ASI/MCP/LLM id, e.g. "ASI04", "MCP-T01", "LLM01"
  readonly atlas: string;                   // MITRE ATLAS technique id, e.g. "AML.T0051"
}

interface Rule {
  // …existing fields (id, detectionClass, severity, why, detect)…
  readonly tier: RuleTier;                  // T0 today; opt-in T2 added to the union later
  readonly framework: FrameworkMapping;     // every rule MUST carry both ids
}

interface Finding {
  // …existing fields…
  readonly tier: RuleTier;
  readonly owasp: string;
  readonly atlas: string;
}
```

### Why this shape makes the engine tier-pluggable WITHOUT rework

- **The tier is data on the rule, not a code branch.** The engine (`scan`) iterates rules
  uniformly; it does not know or care which tier a rule belongs to. Adding T2 later is: (1) widen the
  `RuleTier` union to `'T0' | 'T2'`, (2) author T2 rules that set `tier: 'T2'`, (3) gate them behind
  an opt-in flag at the **adapter/CLI edge** (e.g. `--tier t2`) that filters the ruleset before it
  reaches the pure engine. **No change to the `Rule` interface, the engine, or any existing rule.**
- **The opt-in lives at the edge, the offline guarantee lives in the core.** Because T0 rules are
  pure functions over an in-memory `FileRecord` (ADR-001), they are structurally incapable of a
  network/LLM call. A future T2 rule that needs an LLM would do its IO in an **adapter** (like
  `acquire`/`enumerate`), never in `core/*` — so the never-execute + offline-by-default guarantees
  remain structural, and the default ruleset stays deterministic.
- **Framework IDs are mandatory metadata, not optional.** Making `framework` a required field of
  `Rule` means the type system forces every rule (existing four classes + the new class) to declare
  its OWASP + ATLAS mapping. A rule that omits it does not compile — coverage of the mapping is a
  compile-time invariant, not a review checklist item.

### Encoding-evasion: decode defensively, never execute

The encoding/obfuscation rules (base64/hex-decoded instruction payloads, homoglyph normalisation,
ANSI-escape stripping) **decode text in pure string space only**. Decoding is `Buffer.from(…,
'base64').toString` / `String.fromCharCode` / regex stripping over the file content already in
memory — it produces a *string* that is then pattern-matched. Nothing decoded is ever passed to a
shell, `eval`, `Function`, or any execution sink. This preserves the never-execute invariant
(ADR-001 / SMU §6) while letting the matcher see through the obfuscation.

### Tool/skill-description poisoning: a new detection class, same record

`tool-description-poisoning` is added to the `DetectionClass` union and gets its own disjoint scanner
module (`src/core/scanners/tool-description-poisoning.ts`), exactly like the existing four classes
(ADR-001 rejected-alternative: classes stay disjoint, parallel-safe modules). It reads instruction
**descriptions** the model sees but the user doesn't: SKILL.md frontmatter `description:`, agent
`description` fields, and MCP tool `description` fields in config — flagging injected directives /
tool-coercion there.

## Consequences

### No new runtime dependency

All three additions use only the standard library already available to the pure core: `Buffer`
(global), string/regex operations, and Unicode-range character classes. **Zero runtime dependencies
added** — consistent with ADR-002/ADR-003 and the FOSS/no-backend thesis. If a future tier ever
needs a dependency, that is a separate ADR at that time.

### Backfill obligation

Every existing rule across the four shipped classes (`dangerous-bash`, `prompt-injection`,
`over-broad-perms`, `committed-secrets`) MUST be backfilled with a correct `tier: 'T0'` + OWASP +
ATLAS mapping. This is a required-field type change, so the backfill is enforced by the compiler.

### Report surface

Both reporters (`renderMarkdown`, `renderJson`) surface the framework IDs per finding. JSON carries
`owasp`/`atlas`/`tier` as machine-readable fields; markdown shows them inline on the finding line so
a security team reads a standard ID it already tracks.

### Rejected alternatives

- **Optional `framework?` field** — rejected: optionality lets a rule silently ship without a
  mapping, defeating "framework mapping from the start." Required field + compiler enforcement is the
  whole point.
- **A separate side-table mapping rule-id → framework ids** — rejected: it splits a rule's identity
  across two files, invites drift, and a community-contributed rule (R4) could land without its
  mapping. Co-locating the mapping on the rule record keeps a rule self-describing (the R4 prereq).
- **A `tier` enum with T1/T2/T3 declared now** — rejected: YAGNI. Declaring `'T0'` as the only
  member today, with the union as the documented extension point, is the minimal tier-pluggable
  shape. Widening a union later is non-breaking.

## Downstream instructions

- TEST-AGENT: add per-addition corpus fixtures (malicious → BLOCK citing file:line + rule + the
  OWASP/ATLAS ids; benign near-misses → PASS). Unit-pin each new rule and the decode helpers as pure
  coordinates with in-memory `FileRecord` inputs. Assert findings now carry `tier`/`owasp`/`atlas`.
- IMPLEMENT-AGENT: change `types.ts` first (required fields), then backfill the four existing scanner
  modules, then add the `tool-description-poisoning` module, then the encoding-evasion rules on
  `prompt-injection`, then thread `tier`/`owasp`/`atlas` through `engine.ts` and both reporters. The
  decode helpers live in the pure core (`core/scanners/`), never touch IO, and never reach an
  execution sink.
- STORY-AGENT: prove each addition through the built CLI over the corpus; assert the BLOCK output
  cites the framework IDs; assert the benign near-misses PASS; assert the aggregate corpus stays
  ≥90% accuracy / ≤10% FP and that `skillsentry .` on this repo stays PASS.

## Revision history

| Date | Change | Reason |
|---|---|---|
| 2026-06-06 | Initial decision | FOUNDRY cycle R9a — tier-pluggable rule record + framework mapping |
</content>
</invoke>

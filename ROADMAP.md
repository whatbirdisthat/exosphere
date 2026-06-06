# ROADMAP — skillsentry

> Agent-readable, tiered backlog. Source of truth for the IDEA: `doc/idea/exosphere-audit/brief.md`
> (+ `smu-seed.md`, `first-slice.md`, `handoff.md`). FOUNDRY ingests this; builder-lead tiers it.

## Tier 1 — FIRST VERTICAL SLICE (build now)

### R1 · `skillsentry` CLI — static supply-chain auditor (v1 slice)
- **STATUS:** ✅ COMPLETE — merged via PR #1 (merge `93d8bf0`, 2026-06-06). 100% coverage, corpus 100%/0%-FP, SENTINEL PASS. DELIVERY_COMPLETE.
- **PRIORITY:** P0 (the slice that proves the whole thesis end-to-end)
- **STACK:** TypeScript / Node → `handler-js`. Distributed as `npx skillsentry`.
- **OBJECTIVE:** A FOSS CLI `npx skillsentry <git-url | local-dir>` that fetches the source
  **read-only** (shallow clone to a temp dir; **never** runs build/install/post-install hooks),
  statically scans it across **four detection classes**, and emits an explained **PASS / REVIEW / BLOCK**
  verdict (markdown + JSON; **non-zero exit on BLOCK** for CI).
- **DETECTION CLASSES (v1):**
  1. `dangerous-bash` — exfiltration / RCE patterns (`curl … | sh`, `/dev/tcp` reverse shells,
     `cat ~/.aws` & secret reads, base64-piped payloads, writes outside the tree).
  2. `prompt-injection` — coercive/hidden instructions in SKILL.md / agent / CLAUDE.md bodies
     ("ignore previous instructions", tool-coercion, zero-width unicode, instructions in HTML comments).
  3. `over-broad-perms` — `"Bash(*)"` allow-all, hooks running network commands, MCP servers combining
     filesystem + network + secrets in one scope.
  4. `committed-secrets` — API keys / tokens / private keys committed in the audited files.
- **VERDICT MODEL:** per-finding `{rule, severity, file, line, excerpt, why}`; aggregate to
  PASS (no findings) / REVIEW (low–med) / BLOCK (any high → exit non-zero).
- **DESIGN VALUES (tie-breakers, in order):** (1) low false-positives (precision over recall at BLOCK);
  (2) explainability (every finding cites file:line + rule + why); (3) frictionless reach (`npx`, open
  ruleset); (4) the auditor never executes what it audits.
- **SUCCESS GATE (testable):** a labelled fixture corpus (malicious + benign): malicious → BLOCK with the
  correct file:line + rule; benign → PASS; aggregate **≥ 90% correct at ≤ 10% false-positive**. This
  corpus is built test-first alongside the scanner.
- **OUT-OF-SCOPE (v1 — do NOT build):** README trust-badge; hosted registry / continuous monitoring;
  runtime/execution-time guarding; auto-fix / remediation; spec/quality "drift" checks; non-Claude-Code
  harnesses (Cursor / Codex / Gemini).
- **ACCEPTED RISKS (do NOT re-litigate):** platform absorption (Anthropic may ship native review);
  existing incumbents (Sentry/AgentShield/Repello; Snyk researching). Objective is **reach & reputation**,
  FOSS/$0 — not a defended moat. Win on craft + distribution + native fit.

## Tier 1b — SHIPPED SLICES (R3, R2 — ✅ complete)

### R3 · `.skillsentryignore` / self-exclusion convention
- **STATUS:** ✅ COMPLETE — merged via PR #2 (merge `2948f48`, 2026-06-06). 128 tests / 100% coverage.
  Zero new runtime deps (ADR-002). Self-scan `skillsentry .` → PASS with files excluded-and-disclosed
  (R1 residual resolved). Security-gate PASS. DELIVERY_COMPLETE.
- **PRIORITY:** P0 (unblocks R2; resolves the R1 accepted residual — the tool BLOCKs its own repo)
- **STACK:** TypeScript / Node → `handler-js` (extends the R1 codebase).
- **OBJECTIVE:** Let an audited target declare paths the scan should exclude, so a repo that legitimately
  contains rule patterns / security fixtures / docs can earn a clean verdict.
- **IN-SCOPE:**
  - Read an optional **`.skillsentryignore`** file at the target root: gitignore-style globs, one per line,
    `#` comments, blank lines ignored. Matched files are excluded from enumeration (never scanned).
  - **Provenance is preserved in the report:** the verdict notes how many files were excluded and by which
    patterns (so an ignore file can't silently hide a finding — transparency over trust).
  - A `--no-ignore` flag to force a full scan (audit-the-auditor / CI override).
  - The skillsentry repo ships its own `.skillsentryignore` (excludes `tests/corpus/**` and the rule sources)
    so `skillsentry .` on this repo returns PASS — proving the convention end-to-end.
- **OUT-OF-SCOPE:** remote-fetched ignore trust policies; per-rule inline suppression comments (later).
- **SUCCESS GATE:** new fixtures — a target with `.skillsentryignore` excluding a planted malicious file →
  PASS (with the exclusion noted in the report); the same target with `--no-ignore` → BLOCK. Running
  `skillsentry .` on the skillsentry repo itself → **PASS**. 100% coverage floor held.
- **SECURITY NOTE (load-bearing):** the ignore file must NOT be able to suppress a finding without the
  report disclosing that an exclusion happened — an attacker shipping a permissive `.skillsentryignore`
  must be visible, not invisible.

### R2 · Author self-audit + README trust-badge
- **STATUS:** ✅ COMPLETE — merged via PR #3 (merge `b372896`, 2026-06-06). 151 tests / 100% coverage.
  Zero new runtime deps (ADR-003 — hand-generated static SVG). `--badge` emits a deterministic,
  offline, byte-stable trust snippet (md + raw SVG) on PASS; no badge + reason on REVIEW/BLOCK.
  `--ci` gates on BLOCK and respects `.skillsentryignore` (`--no-ignore` overrides). Transparency
  carry-over proven: a badge earned via exclusions still discloses them. Security-gate PASS.
- **PRIORITY:** P1 (the viral distribution loop — every badge advertises the tool)
- **STACK:** TypeScript / Node → `handler-js`.
- **OBJECTIVE:** A skill/plugin author self-audits their repo and earns a shareable trust signal.
- **IN-SCOPE:**
  - `skillsentry . --badge` → on PASS, emit a Markdown/SVG **badge snippet** (e.g.
    `![audited by skillsentry](…)`) the author pastes into their README; on REVIEW/BLOCK, no badge +
    a clear reason.
  - A `--ci` convenience for the author's GitHub Action (non-zero exit gates the PR; respects R3 ignore).
  - Deterministic, offline badge generation (no hosted endpoint in v1 — consistent with FOSS/no-backend).
- **OUT-OF-SCOPE:** hosted/dynamic badge endpoint; a public registry (that's the parked platform play).
- **SUCCESS GATE:** PASS repo → valid badge snippet emitted; BLOCK repo → no badge + reason; badge
  output is byte-stable for a given verdict. 100% coverage floor held.
- **DEPENDS ON:** R3 (so the author's own repo can earn a clean PASS to badge).

## Tier 1c — DETECTION + RULESET (R9a, R4 — ✅ complete)

> **Binding decisions** (from the research-plan sign-off, `doc/research/deeper-detection-plan.md` §7):
> (1) **Deterministic default** — every default is 100% deterministic + offline; the architecture leaves
> room for an **opt-in semantic tier (T2) later**, but T2 is NOT built now. (2) **Framework mapping =
> OWASP (ASI/MCP/LLM) + MITRE ATLAS** technique IDs per rule, from the start. (3) Ruleset externalisation
> (R4) comes **after** R9a. (4) npm publish deferred. (5) The **rename is committed** (R10 below).

### R9a · Detection breadth — framework mapping + encoding-evasion + tool-description poisoning
- **STATUS:** ✅ COMPLETE — merged via PR #4 (merge `b931538`, 2026-06-06). 188 tests / 100% coverage.
  5 detection classes, each rule tagged OWASP + MITRE ATLAS (surfaced in md + JSON). Encoding-evasion +
  tool-description-poisoning added. Engine tier-pluggable (ADR-004). Zero new runtime deps. DELIVERY_COMPLETE.
- **PRIORITY:** P0
- **STACK:** TypeScript / Node → `handler-js`. **Tier T0 only** (deterministic/offline).
- **OBJECTIVE:** Widen detection with three additions, each rule tagged with its **OWASP + MITRE ATLAS**
  IDs, holding the never-execute / low-FP / transparency invariants and 100% coverage.
- **IN-SCOPE:**
  1. **Framework mapping** — every existing + new rule carries `owasp:` and `atlas:` IDs; surfaced in the
     report (md + JSON) per finding. Refactor the rule record to hold this metadata.
  2. **Encoding/obfuscation evasion** (strengthens `prompt-injection`) — homoglyphs, base64/hex-encoded
     instructions, ANSI-escape "line jumping" (deepen the existing zero-width-unicode handling).
  3. **Tool/skill-description poisoning** (new class) — malicious instructions hidden in tool/skill
     **descriptions** the model reads but the user doesn't (MCP tool descriptions, skill frontmatter).
- **ARCHITECTURE CONSTRAINT (load-bearing):** keep the detection engine **tier-pluggable** — the rule/
  scanner interface must be shaped so an **opt-in T2 semantic tier** can be added later without rework,
  while T0 stays the deterministic default. No runtime LLM dependency introduced.
- **OUT-OF-SCOPE:** the T2 semantic tier itself; AST/dataflow (T1, later); rug-pull/version-diff.
- **SUCCESS GATE:** new corpus fixtures per addition (malicious→BLOCK with correct file:line+rule+framework
  IDs; benign near-misses→PASS); existing corpus still 100%/≤10%-FP; 100% coverage floor held.

### R4 · Externalise the community ruleset
- **STATUS:** ✅ COMPLETE — merged via PR #6 (merge `0e383b1`, 2026-06-06). 241 tests / 100% coverage.
  Rules externalised into declarative DATA (`src/core/rules/**`) compiled by `src/core/compile.ts`; pure
  data, never executed (ADR-005). Parity proven vs the compiled-in baseline; precision-budget guard
  enforced; schema versioned; contribution workflow in `doc/RULESET.md`. Zero new runtime deps.
  DELIVERY_COMPLETE. Residual (future slice): on-disk contributor ruleset loader.
- **PRIORITY:** P1 (turns "my tool" into "the ecosystem's ruleset" — reach compounding)
- **OBJECTIVE:** Move rules out of compiled code into a **versioned, contributable ruleset**; each rule a
  self-describing record (`id · owasp/atlas mapping · severity · rationale · tier · pass/fail fixtures ·
  precision-budget`). A rule that regresses corpus FP is reverted, not merged.

### R9b · T1 deterministic dataflow/taint detection for bundled shell scripts
- **STATUS:** ✅ COMPLETE — merged via PR #9 (merge `79cd73e`, 2026-06-06). 300 tests / 100% coverage.
  T1 intra-file shell taint/dataflow; catches multi-line obfuscation T0 misses. Zero new deps (ADR-006).
  DELIVERY_COMPLETE.
- **PRIORITY:** P1 (closes the bundled-script dataflow gap named in `deeper-detection-plan.md` §1).
- **OBJECTIVE:** Add the **T1 tier** — deterministic, offline, never-executing **intra-file taint/dataflow
  analysis** for bundled shell scripts (`install.sh`, hooks, bundled `*.sh`/`*.bash`). Track tainted
  SOURCES (command substitution, network fetch, decode, sensitive env, stdin) flowing **across lines**
  through variable assignments into dangerous SINKS (pipe-to-shell, `eval`/`exec`, `source`, autorun
  locations) — catching multi-line obfuscation the single-line T0 regex provably misses (e.g.
  `URL=$(get_secret); PAYLOAD=$(curl "$URL"); echo "$PAYLOAD" | sh`). T1 is **additive** (T0 stays the
  always-on default) and labelled `tier:'T1'` per finding, carrying OWASP+ATLAS like T0.
- **DESIGN:** ADR-006. New detection class `dataflow-taint`; new closed-registry builtin
  `shell-taint-to-sink` (the analyzer is dependency-free, line/token-structured — NOT an external
  parser); `RuleTier` widened `'T0'`→`'T0'|'T1'` (the ADR-004 extension point, used as designed).
  **Dependency decision:** zero new runtime deps; a JS/shell **AST parser** was deliberately NOT added —
  the JS-AST taint case is recorded as a **deferred opt-in future slice** (provisionally R9c). New
  benign near-miss fixtures (pinned hash-verified download; captured value only echoed) hold the
  precision line. EARS-058–066.

### R9b.1 · T1 CROSS-FILE shell dataflow/taint within the audited target
- **STATUS:** ✅ COMPLETE — merged via PR #11 (merge `e4375fd`, 2026-06-06). 349 tests / 100% coverage.
  Cross-file `source` taint within the target; path-traversal-safe; never-executes/never-fetches. Zero
  new deps (ADR-007). DELIVERY_COMPLETE.
- **PRIORITY:** P1 (closes ADR-006 residual #1 — cross-file `source` taint was OUT of R9b's intra-file scope).
- **OBJECTIVE:** Extend the R9b T1 analyzer to be **cross-file WITHIN the audited target**: when a
  bundled shell script `source`s/`. `-includes a sibling shipped in the same target, resolve that include
  **path-safely, in pure string space, never executing and never fetching** and track tainted SOURCES
  that flow from one file into dangerous SINKS in another — catching a payload split across FILES that
  R9b's intra-file pass provably misses (`lib.sh` sets `URL=$(get_secret)`; `install.sh` does
  `source ./lib.sh` then `curl "$URL" | sh`). An include that escapes the target root (path traversal)
  is itself flagged and never followed (refusal + disclosure). Stays tier T1; OWASP ASI04 + ATLAS
  AML.T0011; low-FP (benign multi-file bundles that source a helper + pin a hash-verified download PASS).
- **DESIGN:** ADR-007. New cross-file builtin `shell-crossfile-taint-to-sink`; new optional
  `Rule.detectCrossFile?` channel (additive — existing rules + the line-pattern path byte-unchanged);
  the engine uses the cross-file channel when present. Include resolution is a hand-written POSIX
  path-string normaliser (NOT `node:path` reaching disk); siblings resolved by in-memory lookup against
  the enumerator's already-read `FileRecord[]`. **Zero new runtime deps.** EARS-067–074.
- **SUCCESS GATE:** new corpus fixtures — split-across-files malicious → BLOCK citing tier T1 + the SINK
  file:line (noting the source file) + OWASP/ATLAS; include-escape → BLOCK at the source line; benign
  multi-file near-misses → PASS; a test proving the intra-file analysis MISSES it but cross-file catches
  it; full corpus 100%/0%-FP; 100% coverage; `skillsentry .` stays PASS. ✅ all met.
- **ACCEPTED RESIDUALS (deferred, recorded in ADR-007):** deep interprocedural function-scope dataflow
  across files (taint through shell function *parameters*) not modelled — one-hop+ transitive `source`
  chains ARE handled (cycle-guarded); JS/TS cross-file dataflow stays deferred to the opt-in parser slice
  (R9c per ADR-006).

## Tier 1d — NEXT SLICE (active)

> **Strategy sign-off (2026-06-07):** north-star = **differentiated depth that EXTENDS the thesis**
> (not depth that spends a trust pillar). Of the parked depth candidates, R9c needs a parser dep
> (spends zero-deps) and R9e needs an LLM (spends determinism/offline) — both fight the thesis. **R9d
> alone buys differentiation while spending nothing**, so it is promoted to the active next slice.
> **npm publish is gated on R9d** — shipping the rug-pull detector IS the launch milestone (the
> capability no incumbent one-shot scanner has). R7 (hosted platform) is explicitly NOT pursued now.

### R9d · T3 rug-pull / version-diff — approval-lockfile drift detection
- **STATUS:** 🎯 ACTIVE NEXT SLICE — design agreed + pressure-tested to knowledge-parity (2026-06-07).
  **Build-ready IDEA package: `doc/idea/r9d-rugpull/`** (brief · smu-seed · first-slice · handoff;
  discovery exit gate ✅). Awaiting FOUNDRY EARS → build.
- **PRIORITY:** P0 (the differentiator + the npm-publish gate).
- **STACK:** TypeScript / Node → `handler-js`. **New tier T3** (temporal); deterministic/offline.
- **OBJECTIVE:** Detect the **rug-pull** — a skill/plugin that was clean when a user approved it and
  has since mutated to gain dangerous capability. Compare the target's current **trust-relevant
  surface** against a previously-approved baseline recorded in a committed **`.skillsentry.lock`**,
  and flag capability ESCALATION (not benign drift). The lockfile is a second viral artifact (like
  the R2 badge) and a recurring CI ritual one-shot scanners structurally cannot offer.
- **BASELINE MODEL (decided — approval lockfile, NOT git-ref diffing):**
  - `skillsentry <target> --approve` writes a deterministic, byte-stable **`.skillsentry.lock`**:
    schema version · per-file content hash (**sha256 via `node:crypto` — no new dep**) · the **capability
    fingerprint** (findings + verdict at approval + declared perms / allow-lists / MCP scope combos /
    hooks / bundled-script inventory) · disclosed `.skillsentryignore` exclusions (R3 carry-over).
  - **Diff basis = capability fingerprint, NOT raw byte-hash** (decided): T3 re-scans fresh and diffs the
    **capability SET**. **Benign drift** (file hash changed, capability set unchanged — doc edit, version
    bump, reorder) → **PASS** + an informational "changed since approval" note (the FP line that must
    hold). **Capability escalation** (set GREW — new `curl|sh`, broadened perms, a script that gained a
    sink, a new hook) → rug-pull signal → **REVIEW/BLOCK**, `tier:'T3'`, OWASP **ASI04** + MITRE ATLAS,
    citing the escalated file:line + lockfile delta. **Approval invalidation** (a previously-accepted
    file changed) → re-surface. Per-file hashes feed only the note, never a BLOCK on their own.
- **SECURITY — ADDITIVE-ONLY invariant (load-bearing; decided):** `verdict = max(fresh T0/T1 scan, T3
  drift signal)`. The lockfile can only **ADD** findings, **never subtract** — the fresh deterministic
  scan always runs and sets the floor, so a HIGH finding BLOCKs regardless of any lockfile. **Laundering
  a BLOCK through a permissive `.skillsentry.lock` is therefore structurally impossible**, and a lockfile
  that recorded approved-HIGH findings is itself flagged-and-disclosed (mirrors R3's ignore-file rule).
  Cryptographic signing is **deferred to a later slice** — additive-only already defeats laundering.
- **ARCHITECTURE:** T3 is **NOT a `Rule`** — every matcher (`detect`/`detectCrossFile`) only sees current
  state; drift needs `(freshScan, lockfile)`, so T3 is a new **temporal pass** wired at the engine/adapter
  edge (lockfile read in IO/adapter per ADR-001; diff pure in core). Widen `RuleTier` `'T0'|'T1'` → add
  **`'T3'`** (T2 semantic stays deliberately unbuilt — ADR-008 notes T3 ships before T2 by design, since
  T3 holds the deterministic/offline invariant and T2 would break it). New detection class
  `version-drift`; new closed-registry builtin `lockfile-drift`. **Zero new runtime deps**; never-execute.
- **OUT-OF-SCOPE:** hosted/remote baseline trust policies; git-ref `--since` diffing (rejected in favour
  of the offline lockfile); signing the lockfile (cryptographic provenance is a later slice); the T2
  semantic tier.
- **SUCCESS GATE:** new corpus fixtures — approved-then-escalated target → BLOCK citing tier T3 + the
  escalated file:line + OWASP/ATLAS + the lockfile delta; benign drift (doc edit, version bump,
  reordered files) → PASS; a permissive/laundering lockfile → flagged-and-disclosed, never silent; full
  corpus 100%/≤10%-FP; 100% coverage floor held; `skillsentry .` stays PASS.

## Tier 2 — Backlog (parked; not now)
- R5 · Spec/quality drift checks.
- R6 · Cross-harness support (Cursor/Codex/Gemini instruction files).
- R7 · Hosted registry / continuous monitoring (the platform play).
- R8 · Runtime/execution-time guard.
- R9c · JS-AST dataflow (opt-in, needs a parser dep — deferred per ADR-006). Parked: spends the
  zero-deps trust pillar.
- R9e · opt-in T2 semantic ("claims-vs-behaviour" LLM judge). Parked: spends the determinism/offline
  pillar; never default (see `doc/research/deeper-detection-plan.md` §6).
  (**R9d — T3 rug-pull/version-diff — promoted to Tier 1d, ACTIVE NEXT SLICE.** R9b/R9b.1 — T1 shell
  dataflow — shipped in Tier 1c.)
- **R10 · Rename `exosphere-audit` → `skillsentry`** — ✅ COMPLETE — merged via PR #7 (merge `428b28c`, 2026-06-06).
  Product/package/CLI renamed to **`skillsentry`** (`npx skillsentry`); the self-exclusion convention is now
  **`.skillsentryignore`**; badge text "audited by skillsentry"; code, tests, active docs + specs updated.
  GitHub repo also **renamed to `skillsentry`** (git remote + active doc/badge/package URLs swept; 2026-06-06).
  Historical discovery artifacts (`doc/idea/`, `docs/marketing/`, `doc/research/`, foundry plans) left as a
  point-in-time record. 241 tests / 100% coverage held. Name verified npm-free + clean in
  `docs/marketing/name-availability-report.md`. Precedes npm publish.

> Shipped: R1, R3, R2, R9a, R4, CI-fix, **R10 rename**, **R9b — T1 intra-file shell dataflow** (PR #9),
> **R9b.1 — T1 CROSS-FILE shell dataflow** (PR #11). **ACTIVE next slice: R9d — T3 rug-pull/version-diff
> (approval-lockfile model)** — the differentiator and the npm-publish gate (publish ships behind R9d).
> Tier-2 (R5–R8, R9c, R9e, R4.1 loader) stays parked. R7 hosted platform explicitly not pursued now.

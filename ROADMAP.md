# ROADMAP — exosphere

> Agent-readable, tiered backlog. Source of truth for the IDEA: `doc/idea/exosphere-audit/brief.md`
> (+ `smu-seed.md`, `first-slice.md`, `handoff.md`). FOUNDRY ingests this; builder-lead tiers it.

## Tier 1 — FIRST VERTICAL SLICE (build now)

### R1 · `exosphere-audit` CLI — static supply-chain auditor (v1 slice)
- **STATUS:** ✅ COMPLETE — merged via PR #1 (merge `93d8bf0`, 2026-06-06). 100% coverage, corpus 100%/0%-FP, SENTINEL PASS. DELIVERY_COMPLETE.
- **PRIORITY:** P0 (the slice that proves the whole thesis end-to-end)
- **STACK:** TypeScript / Node → `handler-js`. Distributed as `npx exosphere-audit`.
- **OBJECTIVE:** A FOSS CLI `npx exosphere-audit <git-url | local-dir>` that fetches the source
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

### R3 · `.exosphereignore` / self-exclusion convention
- **STATUS:** ✅ COMPLETE — merged via PR #2 (merge `2948f48`, 2026-06-06). 128 tests / 100% coverage.
  Zero new runtime deps (ADR-002). Self-scan `exosphere-audit .` → PASS with files excluded-and-disclosed
  (R1 residual resolved). Security-gate PASS. DELIVERY_COMPLETE.
- **PRIORITY:** P0 (unblocks R2; resolves the R1 accepted residual — the tool BLOCKs its own repo)
- **STACK:** TypeScript / Node → `handler-js` (extends the R1 codebase).
- **OBJECTIVE:** Let an audited target declare paths the scan should exclude, so a repo that legitimately
  contains rule patterns / security fixtures / docs can earn a clean verdict.
- **IN-SCOPE:**
  - Read an optional **`.exosphereignore`** file at the target root: gitignore-style globs, one per line,
    `#` comments, blank lines ignored. Matched files are excluded from enumeration (never scanned).
  - **Provenance is preserved in the report:** the verdict notes how many files were excluded and by which
    patterns (so an ignore file can't silently hide a finding — transparency over trust).
  - A `--no-ignore` flag to force a full scan (audit-the-auditor / CI override).
  - The exosphere repo ships its own `.exosphereignore` (excludes `tests/corpus/**` and the rule sources)
    so `exosphere-audit .` on this repo returns PASS — proving the convention end-to-end.
- **OUT-OF-SCOPE:** remote-fetched ignore trust policies; per-rule inline suppression comments (later).
- **SUCCESS GATE:** new fixtures — a target with `.exosphereignore` excluding a planted malicious file →
  PASS (with the exclusion noted in the report); the same target with `--no-ignore` → BLOCK. Running
  `exosphere-audit .` on the exosphere repo itself → **PASS**. 100% coverage floor held.
- **SECURITY NOTE (load-bearing):** the ignore file must NOT be able to suppress a finding without the
  report disclosing that an exclusion happened — an attacker shipping a permissive `.exosphereignore`
  must be visible, not invisible.

### R2 · Author self-audit + README trust-badge
- **STATUS:** ✅ COMPLETE — merged via PR #3 (merge `b372896`, 2026-06-06). 151 tests / 100% coverage.
  Zero new runtime deps (ADR-003 — hand-generated static SVG). `--badge` emits a deterministic,
  offline, byte-stable trust snippet (md + raw SVG) on PASS; no badge + reason on REVIEW/BLOCK.
  `--ci` gates on BLOCK and respects `.exosphereignore` (`--no-ignore` overrides). Transparency
  carry-over proven: a badge earned via exclusions still discloses them. Security-gate PASS.
- **PRIORITY:** P1 (the viral distribution loop — every badge advertises the tool)
- **STACK:** TypeScript / Node → `handler-js`.
- **OBJECTIVE:** A skill/plugin author self-audits their repo and earns a shareable trust signal.
- **IN-SCOPE:**
  - `exosphere-audit . --badge` → on PASS, emit a Markdown/SVG **badge snippet** (e.g.
    `![audited by exosphere-audit](…)`) the author pastes into their README; on REVIEW/BLOCK, no badge +
    a clear reason.
  - A `--ci` convenience for the author's GitHub Action (non-zero exit gates the PR; respects R3 ignore).
  - Deterministic, offline badge generation (no hosted endpoint in v1 — consistent with FOSS/no-backend).
- **OUT-OF-SCOPE:** hosted/dynamic badge endpoint; a public registry (that's the parked platform play).
- **SUCCESS GATE:** PASS repo → valid badge snippet emitted; BLOCK repo → no badge + reason; badge
  output is byte-stable for a given verdict. 100% coverage floor held.
- **DEPENDS ON:** R3 (so the author's own repo can earn a clean PASS to badge).

## Tier 1c — NEXT SLICES (build now, in order: R9a → R4)

> **Binding decisions** (from the research-plan sign-off, `doc/research/deeper-detection-plan.md` §7):
> (1) **Deterministic default** — every default is 100% deterministic + offline; the architecture leaves
> room for an **opt-in semantic tier (T2) later**, but T2 is NOT built now. (2) **Framework mapping =
> OWASP (ASI/MCP/LLM) + MITRE ATLAS** technique IDs per rule, from the start. (3) Ruleset externalisation
> (R4) comes **after** R9a. (4) npm publish deferred. (5) The **rename is committed** (R10 below).

### R9a · Detection breadth — framework mapping + encoding-evasion + tool-description poisoning
- **STATUS:** ⏳ AWAITING MERGE — on branch `slice/r9a-detection-breadth` (off main `c5916f5`). 188 tests /
  100% coverage (stmts/branches/funcs/lines). Corpus 100% accuracy / 0% FP across 18 fixtures (12
  malicious + 9 benign incl. 3 new near-misses). Zero new runtime deps (ADR-004 — Buffer/regex only).
  Engine kept tier-pluggable (ADR-004: `tier` union + `framework` metadata on `Rule`; opt-in T2 added
  later by widening the union + edge-gating, no rule/engine rework). Every rule (5 classes) carries
  OWASP + MITRE ATLAS ids, surfaced per-finding in md + JSON. Self-scan `exosphere-audit .` → PASS
  (113 files excluded-and-disclosed; no `.exosphereignore` change needed — new sources/fixtures fall
  under existing globs). Security-gate PASS. Awaiting human review + merge (pr-approval governance).
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
- **STATUS:** BLOCKED-BY R9a
- **PRIORITY:** P1 (turns "my tool" into "the ecosystem's ruleset" — reach compounding)
- **OBJECTIVE:** Move rules out of compiled code into a **versioned, contributable ruleset**; each rule a
  self-describing record (`id · owasp/atlas mapping · severity · rationale · tier · pass/fail fixtures ·
  precision-budget`). A rule that regresses corpus FP is reverted, not merged.

## Tier 2 — Backlog (parked; not now)
- R5 · Spec/quality drift checks.
- R6 · Cross-harness support (Cursor/Codex/Gemini instruction files).
- R7 · Hosted registry / continuous monitoring (the platform play).
- R8 · Runtime/execution-time guard.
- R9b–e · Further deeper-detection tiers — T1 AST/dataflow, rug-pull/version-diff, opt-in T2 semantic
  (see `doc/research/deeper-detection-plan.md` §6).
- **R10 · Rename to final brand** — the user has committed to renaming away from the `exosphere-audit`
  placeholder regardless of npm timing. Leading candidate **`skillsentry`** (verified npm-free + clean
  brand/TM/GitHub in `docs/marketing/name-availability-report.md`); final name confirmed at rename time.
  Do BEFORE npm publish. A mechanical rename slice (package.json, bin, badge text, docs, repo refs).

> Build order now: **R9a → R4**. npm publish + R10 rename precede public launch; Tier-2 stays parked.

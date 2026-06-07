# threat-stack — adversarial review uplift backlog

_Produced by a fan-out adversarial review of branch `feat/threat-stack-stride-data` (PR #16): four
hostile reviewer lenses — (A) over-claims/hype/hypocrisy, (B) inconsistency/contradiction, (C) technical
coverage-gaps/correctness, (D) token-waste/nagging/redundancy — each prompted to **refute** the work.
Findings deduped and severity-ranked below. IDs map to the lens (A–D) for traceability._

**Exit threshold (met):** all seven named lenses applied across every component; findings deduped and
ranked; a meta-completeness pass found no new CRITICAL/HIGH *category*. Three findings were caught
independently by multiple lenses (cross-plugin path, gaps.json↔rules atlas mismatch, the over-claims) —
strong convergence ⇒ reviewers broadly satisfied.

**How to use:** each item is a checkbox with file:line + a concrete fix. Kick off a follow-up loop to
work the list top-down (CRITICAL → HIGH → MEDIUM → LOW). Re-run `npm run test:cov`, `node dist/bin.js .`,
and `node plugins/threat-modeler/scripts/coverage-matrix.mjs` after each change; re-run
`npm run build:plugin` whenever `dist` changes.

> ⚠️ Theme: the three things sold hardest — **offline/air-gapped**, **zero-dependency**, **provably-
> untouched core** — are the three most over-claimed; and the two new detection classes pass their own
> corpus largely because **the failFixtures are the only inputs the regexes can catch**. The honesty
> artifacts (GAP_ANALYSIS.md / gaps.json) currently *overstate* coverage. Fix the claims and the recall
> together.

---

## CRITICAL

- [x] **U1 · over-claim (A-C1)** — "offline / air-gapped" is false for the headline git-URL audit:
  `src/adapters/acquire.ts` shells `git clone` over the network for a git-URL target. Files:
  `plugins/skillsentry/knowledge/trust-pillars.md:12`, `plugins/skillsentry/skills/audit/SKILL.md:21`,
  `plugins/supersize-semgrep/knowledge/trust-statement.md`. **Fix:** scope the claim — "deterministic +
  offline *in the scan path*; acquiring a git-URL target performs one `git clone`." Drop "air-gapped" or
  restrict it to local-dir audits.
- [x] **U2 · over-claim (A-C2)** — "zero runtime dependencies / no supply chain of its own" omits the
  required external **`git`** binary for git-URL audits. `trust-pillars.md:9` + every manifest. **Fix:**
  "zero npm/runtime-package dependencies; git-URL acquisition requires a `git` binary on the host."
- [x] **U3 · over-claim + hypocrisy (A-C3, A-H4)** — marketplace headline "a self-reflecting security
  platform whose deterministic core is **provably untouched** by the agentic layer"
  (`.claude-plugin/marketplace.json:4`) is contradicted by `propose-rule.md:24-31`, which has the agent
  edit `src/core/types.ts`, `src/core/ruleset.ts`, and add `src/core/rules/*`. The core IS touched (on a
  branch, behind gates). **Fix:** "the core's guarantees are *enforced by CI gates the agentic layer
  cannot bypass*." Drop "provably untouched" + "self-reflecting." Update the covenant wording from
  "drafts RuleSpec *data*" to "authors rule modules and registers them (type union + ruleset)" so prose
  matches the actual act step.
- [x] **U4 · inconsistency (B-C1)** — `gaps.json` SHIPPED entries cite ATLAS ids that don't match the
  shipped rules: `gaps.json:24` resource-exhaustion `AML.T0049` vs rule `AML.T0011`; `gaps.json:35`
  audit-evasion `AML.T0051` vs rule `AML.T0011` (and `AML.T0051` collides with the prompt-injection
  family). **Fix:** set both SHIPPED gaps' `atlas` to `AML.T0011` to match `src/core/rules/*`.
- [x] **U5 · inconsistency (B-C2)** — `gaps.json:17,19` advertise tar-bomb + `yes |` / `while true`
  shapes under a `status: SHIPPED` that only delivered 3 rules (recursive-delete, fork-bomb, raw-disk).
  **Fix:** remove the un-shipped shapes from the SHIPPED card/sketch, or reopen them as a separate
  un-shipped gap. Don't fold deferred work under a SHIPPED status.
- [x] **U6 · coverage gap + undisclosed (C-C1)** — `resource-exhaustion/recursive-delete-root`
  (`src/core/rules/resource-exhaustion.rules.ts:26`) catches only `/`, `/*`, `~`, bare `$HOME`. **Misses**
  `rm -rf /etc|/usr|/var|/boot`, `-R`/`-Rf` (uppercase recursive), split `-r -f`, quoted `"$HOME"` /
  `${HOME}`, `/home/*`. GAP_ANALYSIS/gaps.json claim D "covered" with **no residual-evasion note**.
  **Fix:** broaden targets to top-level system dirs + optional `/*`; accept quoted/braced `$HOME`/`~`;
  case-insensitive recursive flag; split/long flags in any order; add the missed strings as failFixtures.
  And add a "known residual evasions" section to GAP_ANALYSIS so coverage isn't overstated.
- [x] **U7 · token-waste (D-C1, D-C2)** — the covenant line is copy-pasted into **10 files** (verbatim in
  8); the 8-point gate list is triplicated; the gate bash command is duplicated in `propose-rule` SKILL
  and command. **Fix:** make `plugins/threat-modeler/knowledge/covenant-governance.md` the single source
  of truth; everywhere else replace the restated block with a one-line reference. Est. ~40–55% prose
  reduction across the branch's agent-facing files with no fact lost.

## HIGH

- [x] **U8 · coverage gap (C-H1)** — `fork-bomb` hard-codes the `:` glyph; renaming the function
  (`b(){ b|b& };b`) or a `perl -e 'fork while fork'` / Python `os.fork()` bomb all bypass it.
  `resource-exhaustion.rules.ts:52`. **Fix:** generalise to a captured identifier (self-pipe-to-background
  + re-invocation); add a probe for `fork while fork` / `os.fork()` loops.
- [x] **U9 · coverage gap (C-H2)** — `raw-disk-destroy` misses partitions (`/dev/sda1`, `nvme0n1p2`),
  `shred`/`wipefs`/`blkdiscard`, shell-redirect overwrite `>/dev/sda`, spaced `of = `, and cloud disks
  `vd[a-z]`/`xvd[a-z]`. `resource-exhaustion.rules.ts:76`. **Fix:** add those verbs/forms + device classes.
- [x] **U10 · coverage gap (C-H3)** — `history-clearing` misses `ln -sf /dev/null ~/.bash_history`,
  `shred`/`truncate -s0 …_history`, bare `HISTFILE=/dev/null` (no `export`). `audit-evasion.rules.ts:24`.
  **Fix:** add those forms; unify the `_history` suffix list across branches.
- [x] **U11 · coverage gap (C-H4)** — `log-tampering` misses `rm -rf /var/log` (no trailing slash → whole
  dir), `chattr +i/+a`, `auditctl -e 0/-D`. `audit-evasion.rules.ts:50`. **Fix:** make the trailing slash
  optional; add `chattr`/`auditctl`; record any cross-platform (Windows) decisions as out-of-scope in gaps.json.
- [x] **U12 · broken promise (C-H5, D-L2)** — `plugins/supersize-semgrep/commands/sast.md:14` resolves
  skillsentry via `${CLAUDE_PLUGIN_ROOT}/../skillsentry/cli/bin.js`, which won't exist when plugins
  install as isolated cache subtrees; the "deterministic verdict from the pure auditor" step then silently
  degrades to a buried JSON note. **Fix:** resolve skillsentry via a stable mechanism (declared dependency
  / `command -v skillsentry` / instruct the user to run `/skillsentry:audit` separately) and make the
  miss loud, not silent.
- [x] **U13 · stale docs (B-H4)** — `README.md` / `CHANGELOG.md` / `ROADMAP.md` still describe a single
  npx CLI: no marketplace, no threat-modeler, and the detector table omits `resource-exhaustion` /
  `audit-evasion`. README and marketplace.json describe two different products. **Fix:** add a
  marketplace/platform section + the two new detector rows; add a CHANGELOG entry for the 0.7.0 content bump.
- [x] **U14 · inconsistency (B-H2)** — `README.md:69` calls the class `description-poisoning` (real name
  `tool-description-poisoning`); `README.md:71` lists `version-drift | T3` as a detector row, contradicting
  the architecture (it's the temporal pass, not a Rule). **Fix:** correct the name; footnote version-drift
  as the T3 pass.
- [x] **U15 · inconsistency (B-H3)** — `ROADMAP.md:14` "four detection classes" / `:95` "5" vs the 8 now in
  `types.ts`. **Fix:** mark those as historical v1/R9a scope, not present capability.
- [x] **U16 · over-claim contradiction (A-H6)** — `audit.md:36` says "PASS → safe to proceed" two lines
  below "PASS = no rule matched (not a proof of safety)." **Fix:** "PASS → no rule matched (not a safety
  proof); proceed with normal judgement."
- [x] **U17 · hype in a "mechanical" doc (A-H5)** — `doc/threat-model/GAP_ANALYSIS.md:28` calls the
  cognitive axis "the product's moat" inside a doc that bills itself as mechanical/not-an-opinion. **Fix:**
  delete "— the product's moat" (the count of 9 carries the fact).
- [x] **U18 · token-waste (D-H1, B-M3)** — every plugin description is stored twice (marketplace.json +
  plugin.json): `supersize-semgrep` 100% identical (~63 words), the other three 73–88% overlap (~280
  words duplicated); the threat-modeler keyword lists *drift* between the two. **Fix:** canonical long
  description in `plugin.json`; marketplace.json carries the one-line `displayName` tagline only. Sync
  keywords.
- [x] **U19 · token-waste (D-H2, D-H3, D-H4)** — descriptions are 80+ word paragraphs; SKILL `description`
  frontmatter is 76–84 words (loaded for every trigger-match) and restates the covenant; "never-executing"
  appears in 13 files, "zero-dependency" in 11, the STRIDE "never a brand" disclaimer in 7. **Fix:** cut
  descriptions to ~25–35 words; trigger lists to 3–4 phrases; assert each pillar/disclaimer once in its
  home doc and reference.

## MEDIUM

- [x] **U20 · correctness (B/C-M1)** — the matrix says "probes tabulated: 26" but the STRIDE columns sum
  to 28 (rules carry multiple portals). `coverage-matrix.mjs:29`, `GAP_ANALYSIS.md:8`. **Fix:** label the
  column counts "portal tags (rules may carry several)" and/or print both 26 (rules) and 28 (tags).
- [x] **U21 · correctness (C-M3)** — density label cliff (`THIN ≤ 3`) is arbitrary and the HEAVY cells are
  inflated by the double-count (U20), which can suppress a real gap in the "next action." `coverage-matrix.mjs:26`.
  **Fix:** compute density over distinct rules whose *primary* portal is that cell, or drop the qualitative
  label for raw counts.
- [x] **U22 · correctness (C-M2)** — `coverage-matrix.mjs:30` seeds `byTier {T0,T1,T3}`, emitting a phantom
  `T3:0` on every row (T3 is engine-side, never a RuleSpec). **Fix:** derive tier keys from data.
- [x] **U23 · undisclosed limit (C-M4)** — line-pattern matching is per-line (`compile.ts:47`), so
  line-continuation (`rm -rf \`⏎`/etc`), heredocs, and variable indirection (`T=/; rm -rf "$T"`) evade the
  whole T0 tier. **Fix:** note these as known T0 limits in GAP_ANALYSIS; consider a `\`-continuation join
  pass before per-line matching.
- [x] **U24 · inconsistency (B-M1)** — three names (repo `exosphere`, product/CLI `skillsentry`,
  marketplace `threat-stack`) are never tied together in any top-level doc. **Fix:** one naming line in
  README.
- [x] **U25 · dangling claim (B-M2)** — `eop-deck.md:32` lists a "cognitive DoS" card as "→ no probe" that
  is neither a gaps.json entry nor marked out-of-scope. **Fix:** mark it out-of-scope (runtime-only),
  consistent with GAP_ANALYSIS.md's out-of-scope section.
- [x] **U26 · hypocrisy (A-M10)** — `stride-portals.md:2` says STRIDE is "never a brand" while `:26`
  prescribes a "Branding line for the platform: 'STRIDE + 2 agentic axes'", and STRIDE is in plugin
  displayNames + keywords. **Fix:** either own STRIDE as the organising brand or genuinely demote it — not both.
- [x] **U27 · nagging (D-M1)** — `plugins/threat-stack/hooks/greet.sh` prints two lines on **every**
  SessionStart. **Fix:** one line, or fire once (guard on a sentinel file); the content is already on
  demand via `/threat-stack` and `/threat-stack:help`.
- [x] **U28 · token-waste (D-M2)** — the gap-acceptance phrase "static · pre-execution · deterministic ·
  never-executing" is repeated in 7 files. **Fix:** define once (covenant-governance or eop-deck) and reference.
- [x] **U29 · token-waste + drift (D-M3)** — `stride-portals.md` / `eop-deck.md` / gap-ritual SKILL
  **hardcode** the current density (T/I/E heavy, R/D absent) which is already computed by
  `coverage-matrix.mjs` — and has already drifted (eop-deck still says R/D "ABSENT" though they shipped).
  **Fix:** the matrix script is the source of truth for coverage status; docs describe portals, not current density.
- [x] **U30 · token-waste (D-M4)** — `platform-map.md`, `flow.md`, `help.md`, `threat-stack.md` circle the
  same AUDIT▸MODEL▸EXTEND diagram/lists. **Fix:** platform-map is the source; the commands render slices.
- [x] **U31 · hype (A-M7, A-M8, A-M9)** — repeated brand mantras: "trust anchor" (5+), "load-bearing",
  "supersize", "growing/evolves toward greater threat intelligence". **Fix:** define once; lead supersize
  prose with "Semgrep SAST extension," not "supersize."

## LOW / SUGGESTION

- [x] **U32 · nagging/noise (C-L1)** — the opt-in `hooks.json.example` re-audits the whole repo on **every**
  Bash call and swallows output (`2>/dev/null || true`), so a BLOCK is invisible. **Fix:** if advisory,
  surface stderr; if gating, drop `|| true`; reconsider per-Bash whole-repo re-scan.
- [x] **U33 · classification smell (C-L2)** — `set +o history` lives in `log-tampering` but belongs in
  `history-clearing`. Cosmetic (both are audit-evasion). **Fix:** move it.
- [x] **U34 · over-engineering (D-L1)** — `linddun.md` is PARKED yet read by 4 files every gap ritual; the
  ritual cross-checks 4 framework docs (maestro/mcp-38/owasp-agentic/linddun) each run. **Fix for v1:**
  drop or de-list linddun until there's corpus evidence; keep STRIDE/eop-deck + the OWASP id-mapping as
  load-bearing, demote the rest to optional references.
- [x] **U35 · honesty polish (A-L11, A-L12, A-S14)** — "verdict mapped to frameworks" (findings are);
  unexplained 26-vs-28 column sum; "100% coverage" alongside a `v8 ignore` pragma in `acquire.ts`. **Fix:**
  "findings tagged to …"; add the column-sum note; "100% enforced coverage, with disclosed v8-ignore
  exclusions."
- [x] **U36 · disclosure (A-L13)** — `semgrep --config auto` fetches rules from the network; note it in
  `supersize-semgrep/knowledge/trust-statement.md`.

---

## Notes for the follow-up loop
- **Land coverage fixes (U6, U8–U11) with their evasions as new failFixtures** so recall can't regress —
  and update GAP_ANALYSIS/gaps.json honesty in the same change (U5, U6 residual note, U17).
- **Do the prose consolidation (U7, U18, U19, U28–U31) as one sweep** against the single-source-of-truth
  map: covenant→`covenant-governance.md`, pillars→`trust-pillars.md`, STRIDE→`stride-portals.md`,
  coverage status→the matrix script, value-flow→`platform-map.md`, descriptions→`plugin.json`.
- **Every change re-runs the gate:** `npm run test:cov` (100%), `node dist/bin.js .` (PASS),
  `npm run build:plugin` (vendored CLI in sync), and the matrix script. Per governance, propose via PR —
  never self-merge.

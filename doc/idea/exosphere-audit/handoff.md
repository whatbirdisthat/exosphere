# Handoff contract — exosphere-audit → FOUNDRY

- **OBJECTIVE (one sentence):** Build a FOSS TypeScript/Node CLI, `npx exosphere-audit <git-url|dir>`,
  that statically audits a Claude Code skill/plugin (fetched read-only, never executed) across four
  security detection classes and returns an explained PASS/REVIEW/BLOCK verdict (markdown + JSON, non-zero
  exit on BLOCK).

- **ARTIFACTS (paths):**
  - IDEA brief — `doc/idea/exosphere-audit/brief.md`
  - SMU-seed — `doc/idea/exosphere-audit/smu-seed.md`
  - First vertical slice — `doc/idea/exosphere-audit/first-slice.md`
  - Originating opportunity — `doc/opportunities/sentinel-for-skills.md`
  - Standing discovery goal + kill ledger — `.market-scanner/goal.md`

- **OPEN QUESTIONS / ACCEPTED RISKS:**
  1. **Platform absorption** *(accepted)* — Anthropic could ship native skill-security review. Accepted
     because the objective is reach/reputation, not a defended moat; a great FOSS tool + open ruleset has
     standalone value and can lead the platform.
  2. **Incumbents exist** *(accepted)* — Sentry Skill Security Scanner, AgentShield, Repello; Snyk
     researching. Accepted: win on craft + distribution (`npx`) + native fit with the idea-to-production
     marketplace, Trivy-style, not on exclusivity.
  3. **Detection signal quality** *(answered → build risk to manage)* — false-positives erode trust.
     Mitigation: precision-over-recall at the BLOCK threshold, a curated/versioned ruleset, REVIEW as the
     soft tier, and the labelled-corpus success gate (≥90% / ≤10% FP).
  4. **Naming** *(accepted, low-stakes)* — working name `exosphere-audit`; final npm package name TBD at
     build time.

- **NEXT-AGENT INSTRUCTIONS:** Ingest the brief as the source of truth. Cut the first vertical slice
  (`first-slice.md`) before anything else. Stack = handler-js. The fixture corpus IS the success gate —
  build it alongside the scanner (TDD: malicious/benign fixtures → expected verdicts). Do **not** add the
  out-of-scope items (badge/registry/runtime/auto-fix/cross-harness) until the slice ships green.

- **EXIT-GATE VERIFICATION (passed):** Problem actionable ✅ · Actors named ✅ · Scope explicit (in/out) ✅
  · Constraints concrete ✅ · Success metric testable ✅ · Open questions answered-or-accepted ✅.

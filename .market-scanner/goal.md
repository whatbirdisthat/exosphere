# Discovery Goal — exosphere

> The standing objective `/market-scan` and `/loop /market-scan` search within. Constraints on *what to
> discover*, not yet *what to build*. Tight enough to focus, loose enough to surprise. Refine with `/goal`.

| Field | Value | Source |
|---|---|---|
| **Domain / niche** | Developer & AI-agent tooling — **pivoted (pass 3) AWAY from the red oceans** (security, cost/observability, eval-runners, MCP inspection — all held by free OSS + funded vendors) toward emptier seams where the agentic-pipeline edge still applies: **authoring/scaffolding, cross-harness portability, spec-drift migration, and knowledge-sync (docs/memory-as-code) for agentic repos.** | pivoted (pass 3) |
| **Builder edge** | Deep Claude Code / agentic-AI expertise; authored the `idea-to-production` marketplace (skill/prompt engineering, markdown-driven test-first agent pipelines). Strong founder-market fit for dev & AI-agent products. | inferred (high confidence) |
| **Effort / time-to-MVP** | **Days — a sharp wedge.** Smallest shippable unit: one single-purpose tool, plugin, or CLI. Favors fast WTP signal and vertical-slice discipline. | chosen |
| **Stack-fit** | TS/JS and Python first (CLI, MCP server, plugin, small web) → FOUNDRY handlers `handler-js`, `handler-python`, `handler-fastapi`, `handler-react`/`handler-vanilla-js`. Rust optional (`handler-rust`) for perf-sensitive CLIs. | inferred — adjust if wrong |
| **Target price band** | **FOSS-first / open-core.** The core is free and open-source — success metric is **adoption/reach**, not direct WTP. Monetization is deferred and secondary: open-core (free CLI + paid hosted/CI/org-dashboard tier), GitHub Sponsors, or support — the **Semgrep / Trivy / Snyk / Gitleaks** shape. WTP reframes to "will enough adopt, and will a fraction convert to the paid layer / sponsor." | **retargeted by user** |
| **Hard constraints** | Solo-buildable; no regulated markets (health/finance/legal compliance), no hardware, no heavy data-acquisition moat. | inferred — adjust if wrong |

## Notes
- A blank/"open" field = "surprise me" (wider search). Stack is left open-ish so the scan can surprise.
- **FOSS retarget (pass 2):** prefer candidates whose distribution *is* the moat — free CLI that spreads
  through the ecosystem (awesome-lists, marketplaces, CI), monetised open-core *later*. This re-weights the
  taxonomy: the **C/WTP** gate becomes an **adoption + open-core-path** gate; **E/reachability** gains
  weight. It does *not* revive #1–#4 from pass 1 — those died on **D** (entrenched *free* incumbents),
  which FOSS retargeting does not change.
- If a scan keeps returning already-killed shapes, loosen one constraint here or shift the niche.

## Kill ledger (cross-pass memory)
- **sentinel-for-skills** — *PARKED in pass 2.* Symptom: looked like an empty "security vs quality" seam.
  Cause: deeper probe found free OSS incumbents (Sentry Skill Security Scanner, AgentShield, Repello) +
  Snyk's ToxicSkills research (funded vendor entering). Fix → guardrail: **shallow "no incumbent" findings
  are untrustworthy in the agent-tooling niche — it's moving weekly; re-probe deep before any keep, and
  treat a funded security vendor's *research* as a product pre-announcement.** Brief:
  `doc/opportunities/sentinel-for-skills.md`.
- **mcp-security-scanner**, **token/cost analytics**, **mcp-inspector**, **prompt-regression-CI**,
  **skill-quality-linter** — all KILLED on **D** (entrenched free OSS and/or funded incumbents). Pattern:
  *the obvious dev/AI-agent-tooling shapes are already red oceans by mid-2026.*
- **PASS 3 (pivoted niche) — also no keep:**
  - **plugin-update/lifecycle** — KILLED on **D / platform-absorption**: Anthropic shipped native
    per-marketplace auto-update in **Claude Code v2.0.70**; issue #31462 closed as duplicate.
  - **cross-harness-portability** — KILLED on **D**: vercel-labs/skills (16.9K★) + SKILL.md open standard.
  - **agent-docs-drift/sync** — KILLED on **D**: context-drift, Claude MD Auto-Updater, agent-sync.
- **META-GUARDRAIL (3 passes, ~13 candidates, zero keeps):** *the Claude-Code/agent-harness tooling
  ecosystem is saturating in mid-2026 from THREE directions at once — free OSS incumbents, funded
  security vendors, AND Anthropic shipping native features that absorb tool gaps weekly. For a
  moat-seeking build, this whole niche is a trap right now. The fix is not another pass at the same
  niche — it is to **shift the niche** (out of dev-tooling) or **reframe the objective** (FOSS-for-reach,
  where a contested moat is acceptable).*

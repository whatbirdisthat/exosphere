# Opportunity — SENTINEL-for-skills (FOSS, open-core)

> **Status: KEEP — un-parked under a REACH/REPUTATION objective (post pass-3 convergence).**
> Across 3 scan passes the whole dev/AI-agent-tooling niche proved saturated, so a *defensible moat* is off
> the table here. The user reframed the objective: **revenue isn't the point — craft, adoption, and
> ecosystem standing are.** Under that objective the contested **D gate stops being fatal**: incumbents
> exist (Sentry Skill Security Scanner, AgentShield, Repello; Snyk researching), but a FOSS tool wins on
> **craft + distribution + native fit**, not exclusivity — the way Trivy won a space that already had
> Clair/Anchore.
>
> **Differentiation under the reach objective (not a moat — a reason to be the one people reach for):**
> 1. **Native to the idea-to-production marketplace** — composes with the author's own **SENTINEL** plugin;
>    ships to an existing, trusting audience.
> 2. **Rides a live wave** — ClawHub malware + Snyk's ToxicSkills (36% prompt-injection, 1,467 payloads)
>    make this headline-relevant; everyone installing third-party skills is exposed *now*.
> 3. **Craft + UX + depth** — be the cleanest, most trustworthy, best-documented audit in the ecosystem.
>
> Carried to `/ideate` as the chosen opportunity. WTP is **deliberately not** the success metric; adoption
> is. (Earlier PARK rationale retained below for the record.)

## One sentence
A **free, open-source security & supply-chain auditor for Claude Code skills, subagents, and plugins** —
point it at a plugin/marketplace/skills directory (or an "awesome-list" repo) and it scans for *dangerous
permissions, prompt-injection payloads, secret-exfiltration Bash, and spec drift*, emitting a risk score
and report. **"`npm audit` / Semgrep for agent skills."**

## Scorecard (A–E taxonomy)

| Gate | Mark | Evidence / probe |
|---|---|---|
| **A — Demand & problem** | ✅ | The skill/plugin ecosystem is exploding *unvetted*: 337-skill and 154-subagent dumps, open marketplaces, skills that run arbitrary Bash on install. Supply-chain risk is real, severe (RCE/exfiltration), and recurs on **every install**. |
| **B — Market** | ✅ | Every team adopting Claude Code at work + every author publishing to a marketplace. Growing fast; **underserved with a named gap** — existing tools (SkillCheck, SKILL.md linters) score *quality*, not *safety*. |
| **C — Monetization (was WTP)** | ⚠️→✅ | Under the FOSS retarget, success = **adoption**, not direct WTP. Monetisation is open-core, deferred: free CLI → paid hosted org dashboard / CI gate / marketplace trust-badge. Proven shape: **Semgrep, Trivy, Snyk, Gitleaks**. Open question: which paid layer converts — resolve with a fake-door during `/ideate`. |
| **D — Competition & moat** | ✅ | Named, defensible wedge: **security, not quality** — a different axis than every incumbent found. Distribution *is* the moat (free CLI spreading through the ecosystem). Composes with the author's own **SENTINEL** plugin. No direct incumbent found in the scan. |
| **E — Reachability & fit** | ✅ | **Channel:** awesome-lists, marketplaces, the CC community, CI, *and the author's existing marketplace audience*. **Time-to-MVP:** days (static scanner over a plugin dir). **Stack:** TS/Python CLI → `handler-js` / `handler-python`. **Builder edge:** off-the-charts — the author built SENTINEL and the idea-to-production marketplace. |

## Verdict
**KEEP.** Four gates clear strongly; the wedge (D) and channel (E) are *named*, not hand-waved. The lone
⚠️ — *who pays* — is downgraded by the FOSS retarget to an open-core monetisation question, resolvable
cheaply during refinement.

## Open questions (carry into `/ideate`)
1. **Conversion path:** which paid layer (hosted org dashboard? CI gate? marketplace trust-badge/cert?) is
   the realistic open-core upsell — and to whom (security-conscious eng-orgs adopting agents at scale)?
2. **Detection surface for the first slice:** which risk classes ship first (see below)?
3. **Trust/positioning:** first-party vs community — does Anthropic ship native skill-signing that
   subsumes part of this? (Monitor; differentiate on *audit depth + CI*, not just signing.)

## First slice (days-to-MVP)
A CLI: `exosphere audit <plugin-or-skills-dir>` →
- enumerate skills/subagents/hooks/MCP servers + their declared permissions (a **skill SBOM**);
- static-scan instruction bodies & scripts for: dangerous Bash (exfil, `curl | sh`, secret reads),
  prompt-injection patterns, over-broad permissions, spec drift;
- emit a **risk score + findings report** (markdown + JSON), exit-non-zero for CI.

Adjacent shapes from pass 2 (provenance/signing, MCP-scope audit, SBOM) fold in as later roadmap slices,
not separate products.

## Stack-fit / handoff
`handler-js` or `handler-python` (CLI). Next step: **`/ideate`** to refine into the IDEA package
(pressure-testing open question #1), then **`/foundry:foundry`** to build test-first → SHIP.

> ⚠️ **SUPERSEDED — historical artifact.** Round 1 naming research; its then-top-pick `vouchsmith` was retired in Round 2.
> The current single source of truth is [`../naming-report.md`](../naming-report.md). Do not cite this as current.

# Naming Deep-Dive: A FOSS CLI for Auditing AI-Agent Skills

**Product:** a free, MIT-licensed command-line tool that **statically audits AI-agent "skills"/plugins** (Claude Code skills, MCP servers, etc.) for supply-chain attacks — dangerous bash, prompt-injection, over-broad permissions, committed secrets, description poisoning, taint/dataflow — and returns a **PASS / REVIEW / BLOCK** verdict *before* you install or run the skill. It never executes what it scans. Mental model: **"`npm audit` / Semgrep, but for AI-agent skills."**

**Goal of the rename:** the working name **`skillsentry`** sits in a saturated lexical neighbourhood (many repos/npm packages share or near-match it). We need a name with **no neighbours** — genuinely unique across npm (exact + hyphenated + close phonetic/spelling variants), GitHub (repos/orgs), and established brands/trademarks — that still *reads right* for a security auditor in the agent space.

**Date of research:** 2026-06-06. **Method:** npm registry API (`registry.npmjs.org/<name>` → HTTP 404 = name free, 200 = taken), GitHub search/users API (`api.github.com`), targeted web/brand searches, and DNS (`NXDOMAIN` = domain likely registrable). Where a check was rate-limited or ambiguous, it is flagged as **inconclusive** rather than asserted.

---

## 1. The Landscape — competitors & aligned contributors in agent-skill / MCP supply-chain security

This is a fast-moving, **crowded** space. Note the naming conventions: almost everyone clusters on `*scan`, `*shield`, `*sentry`, `*sentinel`, `*guard`, `*audit`, or `skill*`/`mcp*`/`agent*` prefixes. A distinctive name must step *out* of this cluster.

| Project / tool | Who | What it does | Naming convention | Source |
|---|---|---|---|---|
| **Snyk Agent Scan** (formerly **MCP-Scan**, ex-Invariant Labs; Snyk acq. Jun 2025) | Snyk / Invariant Labs | Scans + inspects the supply chain of agent components locally: prompt injection, tool poisoning, toxic flows, MCP "rug-pull" detection via tool-hash pinning | `agent` + `scan` | [github.com/snyk/agent-scan](https://github.com/snyk/agent-scan), [invariantlabs.ai](https://invariantlabs.ai/blog/introducing-mcp-scan) |
| **ToxicSkills** (research) + **Skill Inspector / Agent Scan (Skill-Scan)** | Snyk Labs | Audited 3,984 skills from ClawHub/skills.sh; found prompt injection in 36%, 1,467 malicious payloads; "Skill Inspector" experiment scans individual skills | `toxic` + `skills`; `skill` + `scan/inspector` | [snyk.io/blog/toxicskills…](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/), [labs.snyk.io/experiments/skill-scan](https://labs.snyk.io/experiments/skill-scan/) |
| **Cisco MCP Scanner** | Cisco AI Defense | Open-source; scans MCP servers for malicious tools via YARA rules + LLM-as-judge + Cisco AI Defense inspect API | `mcp` + `scanner` | [github.com/cisco-ai-defense/mcp-scanner](https://github.com/cisco-ai-defense/mcp-scanner), [blogs.cisco.com](https://blogs.cisco.com/ai/securing-the-ai-agent-supply-chain-with-ciscos-open-source-mcp-scanner) |
| **AgentShield** (≥4 separate projects!) | affaan-m; bartelmost; aiconnai/limaronaldo; agent-shield.com | AI-agent security scanners: scan `.claude/`, MCP servers, tool permissions; CLI/GitHub-Action/plugin; SARIF; OWASP-LLM-Top-10 tests | `agent` + `shield` | [github.com/affaan-m/agentshield](https://github.com/affaan-m/agentshield), [agent-shield.com](https://agent-shield.com/) |
| **Skill Security Scanner** (a.k.a. *Sentry* security-review skill) | Sentry (getsentry/skills) | Static analysis skill detecting prompt injection, credential theft, exfiltration; 17 vuln guides; `npx skills install getsentry/skills@security-review` | `skill` + `security` + `scanner` | [mcpmarket.com…skill-security-scanner](https://mcpmarket.com/tools/skills/skill-security-scanner) |
| **skill-security-scan** | huifer | pip CLI to scan/detect security risks in Claude Skills before install; HTML/JSON reports | `skill` + `security` + `scan` | [github.com/huifer/skill-security-scan](https://github.com/huifer/skill-security-scan) |
| **Repello AI** | Repello | Blog + tooling on "how to audit any Claude Code skill before you run it"; red-teaming/AI-security vendor | brand name (`Repello`) | [repello.ai/blog/claude-code-skill-security](https://repello.ai/blog/claude-code-skill-security) |
| **Trail of Bits skills** | Trail of Bits | Claude Code skills for security research, vuln detection, audit workflows | org brand | [github.com/trailofbits/skills](https://github.com/trailofbits/skills) |
| **SkillSieve** (research) | academic (arXiv) | Hierarchical triage framework for detecting malicious AI-agent skills | `skill` + `sieve` | [arxiv.org/html/2604.06550v1](https://arxiv.org/html/2604.06550v1) |
| **MCPGuard / MCP-Scanner (academic)** | arXiv / ACM | Automated vuln detection in MCP servers | `mcp` + `guard`/`scanner` | [arxiv.org/html/2510.23673v1](https://arxiv.org/html/2510.23673v1), [dl.acm.org/doi/10.1145/3786160.3788471](https://dl.acm.org/doi/10.1145/3786160.3788471) |
| **Enkrypt AI**, **Snyk × Tessl** registry attestation | Enkrypt; Snyk/Tessl | LLM/agent guardrails (Enkrypt); signed/attested agent-skills registry (Snyk+Tessl) | brand names | [snyk.io/blog/snyk-tessl-partnership](https://snyk.io/blog/snyk-tessl-partnership/) |

**Takeaways for naming:**
1. The `*scan / *shield / *sentry / *sentinel / *guard / *audit / skill* / mcp* / agent*` lanes are **fully saturated** — confirming the brief's "avoid" list.
2. The **memorable standouts** in the space are *brand words*, not descriptors: **Snyk, Repello, Enkrypt, Tessl, Invariant**. That is the gap to aim for — an ownable coined word, not another `xShield`.
3. Likely **allies, not rivals** (FOSS / research): Trail of Bits, Cisco AI Defense, SkillSieve authors, Invariant/Snyk's open tooling.

---

## 2. Naming criteria (the bar)

A survivor must clear **every** axis:

- **npm:** exact name **and** hyphenated form **and** close spelling/phonetic variants are free (404). A near-identical existing package = **KILL**.
- **GitHub:** no prominent repo or org of the same name. A handful of tiny unrelated repos is a *yellow flag*; an org or a starred repo is a **KILL**.
- **Brand / trademark:** no established product/company using it, *especially* in software / security / AI. Phonetic twins of well-known AI/security brands = **KILL**.
- **Domain:** a reasonable `.com/.dev/.io/.sh` appears obtainable (`NXDOMAIN`). Best-effort signal only.
- **Fit & pronounceability:** evokes *"inspect/verify/vouch-for a skill before you trust it."* No bad connotations, easy to spell after hearing it, one or two syllables of "shape."

**Hard lesson from this run:** real English words in the *test/verify/security* semantic field (`assayer`, `touchstone`, `provenant`, `threshold`, `litmus`, `aegis`, `crucible`, `probity`, `winnow`, `vouchsafe`) are **almost all taken** on npm and/or are live security/software brands. Genuinely clean names in this space must be **coined compounds**, not dictionary words.

---

## 3. Kill log (rejected names + the neighbour that killed each)

| Candidate | Axis that killed it | Evidence |
|---|---|---|
| `skillsentry` (incumbent) | npm + GitHub + lexical | Saturated `*sentry` + `skill*` neighbourhood (brief premise; landscape table) |
| `assayer` | npm + GitHub | npm 200 (taken); GitHub org **Assayer Pro** exists |
| `touchstone` | brand | **Touchstone Security** (cyber co.), **TouchStone Software** (Wikipedia), Touchstone FHIR tester |
| `provenant` | brand (security!) | **Provenant** verifiable-comms/fraud co., **Provenant Systems** device security, Provenant DPP/supply-chain platforms |
| `provenza` | brand | Provenza Floors; `provenza.io` (Jim Provenza, developer); Provenza Technology Services |
| `provya` | brand (phonetic) | **Provaya** (POS software, Crunchbase/ZoomInfo); **PROVYS** (media software) — too close |
| `praxiel` | brand | **PRAXIEL** — real French software company (LinkedIn/ZoomInfo) |
| `veridot` | brand (security!) | **Veridot** — asset-ID/anti-counterfeit security product (Holomatrix) |
| `vettara` | brand (phonetic, AI!) | Twin of **Vectara** (AI-agent platform) and **Vectra AI** (cybersecurity) — dangerous for an AI-security tool |
| `vouchsafe` | npm | npm 200 (taken) |
| `threshold`,`litmus`,`aegis`,`crucible`,`bulwark`,`portcullis`,`lattice`,`cordon`,`palisade`,`warden`,`customs` | npm | all npm 200 (taken) |
| `winnow` | npm | npm 200 (taken) |
| `probity` | npm | npm 200 (taken) |
| `imprimatur`,`betoken`,`epoche`,`plumbline`,`vetrix`,`veylo`,`portwarden`,`touchstone-cli`,`agentassay` | npm | all npm 200 (taken) |
| `bonafy` | GitHub (near) | npm free, but GitHub neighbours `bonafya`, `bonafyde` — too close phonetically |
| `proveil` | GitHub (yellow) | npm free, but repo `Stellar-P/Proveil` exists (residual risk, demoted) |
| `nullward` | GitHub (yellow) | npm free, but 2 repos exist incl. a GitHub user `nullward` (200) — demoted |
| `glyphward` | GitHub (yellow) + fit | npm free, but repo `FakeSalamander/glyphward` exists; weak meaning-fit anyway |

---

## 4. Ranked clean shortlist (survivors)

All survivors below: **npm exact = 404 (free)**, **npm `-cli` variant = 404 (free)**, **GitHub repos = 0 found via `api.github.com/search/repositories?q=<name>+in:name`**, **no GitHub user/org**, **no exact brand/company found** in targeted web search, and **`.com/.dev/.io` = NXDOMAIN** (likely registrable). Ranked by fit × ownability.

### #1 — `vouchsmith`
- **npm:** `vouchsmith` → 404 free; `vouchsmith-cli` → 404 free. ✅
- **GitHub:** `total_count: 0` repos; user/org `vouchsmith` → 404 (none). ✅
- **Brand:** No product/company/app named "vouchsmith" found. The many `Vouch*` brands (Vouch insurance, Vouch.io, Vouched KYC, Vouch talent) are all on bare **"Vouch"** — none compounds to `vouchsmith`. ✅ (residual: "vouch" is a popular brand stem, but the *compound* is unclaimed)
- **Domain:** `vouchsmith.com / .dev / .io / .sh` all NXDOMAIN. ✅
- **Fit:** *A smith who vouches for what passes through the forge.* Reads exactly as "an expert that certifies a skill before you trust it." Two syllables of shape, trivially spellable, warm/human (artisan metaphor) rather than another cold `xShield`. **Best fit + cleanest evidence.**
- **Residual risk:** "vouch" is a crowded *stem*; someone could later argue brand-adjacency. Low, but non-zero.

### #2 — `vouchwright`
- **npm:** `vouchwright` → 404 free. ✅  **GitHub:** 0 repos, no user. ✅
- **Brand:** none found ("Wright" hits are all the surname/Wright Tool — not the compound). ✅
- **Domain:** `vouchwright.com / .dev / .io` NXDOMAIN. ✅
- **Fit:** *wright* = a maker/craftsman (cartwright, playwright). "One who makes a vouch / fashions trust." Same artisan-of-trust register as #1, even more distinctive. Slightly less obvious pronunciation than `vouchsmith` for non-native speakers.
- **Residual risk:** "wright" pronunciation = "right"; minor "is it -wright or -right?" spelling friction.

### #3 — `attestwright`
- **npm:** `attestwright` → 404 free. ✅  **GitHub:** 0 repos. ✅  **Brand:** none found. ✅
- **Domain:** `attestwright.dev / .com` NXDOMAIN. ✅
- **Fit:** *attest* is the precise verb for what a security auditor does — formally certify. "The craftsman who attests." Excellent semantic precision; longer/more formal than #1–#2.
- **Residual risk:** length (12 chars) and a slightly bureaucratic tone.

### #4 — `provenwright`
- **npm:** `provenwright` → 404 free. ✅  **GitHub:** 0 repos. ✅  **Brand:** none found. ✅
- **Domain:** `provenwright.dev` NXDOMAIN. ✅
- **Fit:** *proven* + *wright* — "maker of the proven / one who proves." Evokes provenance + proof without colliding with the (heavily-branded) word `provenant`/`provenance`.
- **Residual risk:** visually close to the saturated `proven*`/`provenance` stem; could read as generic.

### #5 — `tollwright`
- **npm:** `tollwright` → 404 free. ✅  **GitHub:** 0 repos. ✅  **Brand:** none found. ✅
- **Domain:** `tollwright.dev` NXDOMAIN. ✅
- **Fit:** the *toll/threshold-keeper* metaphor — the gate you must clear before entry (PASS/REVIEW/BLOCK is literally a tollgate). Distinctive and concrete.
- **Residual risk:** "toll" can read as a *fee* (negative connotation for a free tool); weaker than the vouch/attest family on positive framing.

### #6 — `warrantwright`
- **npm:** `warrantwright` → 404 free. ✅  **GitHub:** 0 repos. ✅  **Brand:** none found. ✅
- **Domain:** `warrantwright.dev` NXDOMAIN. ✅
- **Fit:** *warrant* = to guarantee/vouch-for (also a nice security double-meaning). "Maker of warrants of trust."
- **Residual risk:** "warrant" carries a *legal/police-search* connotation; longest of the set (13 chars); double-`wright`-family means it competes with #2–#5 for distinctiveness.

### Backups (clean on npm, demoted for a single yellow flag — usable if a top pick is later contested)
- `proveil` — npm free, but one minor repo (`Stellar-P/Proveil`); pretty *prove + veil* metaphor.
- `nullward` — npm free, but two repos + a GitHub user; strong "null the threat at the ward/gate" tech vibe.
- `sieveling` / `glyphward` — npm free; weaker fit and/or a small existing repo.

---

## 5. Top recommendation

### **`vouchsmith`**

**Why it wins:**
1. **Cleanest evidence on every axis simultaneously** — npm (exact + `-cli`) free, **zero** GitHub repos, **no** user/org, no exact brand, and all four common TLDs `NXDOMAIN`. Among the survivors it had the *emptiest* footprint.
2. **It "hits right."** The product's whole job is to *vouch for a skill before you trust it*; a **vouch·smith** is, transparently, "the craftsman who vouches." A new user grasps the value proposition from the name alone — without it ever touching the saturated `scan/shield/sentry/guard` lanes.
3. **Ownable & warm.** It sits with the memorable *brand-word* standouts of the space (Snyk, Repello, Enkrypt) rather than the descriptor crowd, while the `-smith` artisan metaphor gives it a human, trustworthy tone that fits a security tool you're asked to *rely on*. Easy to say, easy to spell after hearing once.

**Residual risk to monitor (be honest):** `vouch` is a popular brand *stem* (insurance, KYC, talent). None uses the `vouchsmith` compound today, but before committing, do a **USPTO/TESS (and EUIPO) trademark search** for "vouchsmith" and "vouch" in software/security classes, and **register the npm name + `.com`/`.dev` immediately** to lock it in. If trademark adjacency to "Vouch" ever feels too close, **`vouchwright` (#2)** or **`attestwright` (#3)** are equally clean fallbacks with the same artisan-of-trust register.

---

### Verification caveats
- npm checks used the registry API (404 = free) — authoritative for *exact* strings; "close phonetic variants" were judged by inspection, not exhaustively enumerated.
- GitHub repo counts came from the unauthenticated search API; a few mid-loop calls returned empty bodies due to rate-limiting and were **re-run individually with spacing** (the counts cited above are the reliable re-runs).
- Domain availability is inferred from DNS `NXDOMAIN` — a strong but not definitive signal; confirm at a registrar before relying on it.
- Trademark status was assessed via web search only; a formal **USPTO/EUIPO** clearance is recommended before launch for the chosen name.

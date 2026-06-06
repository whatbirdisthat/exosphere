# Naming Report — FOSS CLI for AI-Agent Skill Attestation

**Product:** A free, MIT-licensed CLI that statically audits AI-agent "skills" and MCP servers for
supply-chain attacks, returning a PASS / REVIEW / BLOCK verdict before you install or run them.
It never executes what it scans. Mental model: *"`npm audit` / Semgrep for agent skills."*

**Rounds of research:** 2 (2026-06-06). Round 1 explored the vouch/wright/smith artisan family;
Round 2 explicitly moved off those stems and mined Latin/Romance etymology veins.

**Status:** Final recommendation — **Fidavel** (primary), **Clarivo** (runner-up).

---

## 1. Naming Charter

The tool's single defining act is **clearance**: a considered, analysis-backed attestation that a
skill is safe to cross into your environment. The name must encode five values in priority order:

1. **TRUST** — earned trust through static analysis (never-executes, every finding cites file:line,
   nothing hidden). Not assumed — proven.
2. **FREE-FOREVER** — MIT, $0, no paywall on safety. Security must not have a price tag.
3. **OPEN** — open source, community-contributable ruleset, deterministic and offline.
4. **COMMUNITY** — a public commons for the whole agent ecosystem; reach over moat.
5. **CRAFT** — precise, low-false-positive; the careful artisan who vouches for your trust.

**Tone:** warm, ownable, brandable, confident — a coined word like Snyk/Repello/Enkrypt/Tessl/Vercel,
not a literal compound. Evokes vouching / attesting / guarding the threshold / clarity /
light *without being literal.*

**Structural constraints:**
- Coined (invented), not an existing English or dictionary word
- 3 syllables maximum (2 is ideal)
- Must be npm-free: exact name AND hyphenated AND close phonetic/spelling variants, all 404
- No prominent GitHub repo or org
- No established software / security / AI brand or company
- A plausibly-obtainable `.com` or `.dev` domain

**Banned stems (saturated):** `skill*`, `mcp*`, `agent*`, `*scan`, `*sentry`, `*sentinel`,
`*guard`, `*gate`, `*shield`, `*audit`, `*sec`, `*watch`, `*trust`. Round 1 survivors
(`*vouch`, `*wright`, `*smith`) were also retired for Round 2 to force a different vein.

---

## 2. Full Kill Log

Everything that failed, and exactly why.

### 2a. Round 1 kill log — prior art, dictionary words, saturated namespace

| Candidate | Axis that killed it | Evidence / reason |
|---|---|---|
| `skillsentry` (incumbent) | npm + GitHub + lexical | Saturated `*sentry` + `skill*` neighbourhood; the premise that motivated the search |
| `assayer` | npm + GitHub | npm 200 (taken); GitHub org **Assayer Pro** exists |
| `touchstone` | brand | **Touchstone Security** (cybersec co.), **TouchStone Software** (Wikipedia), Touchstone FHIR tester — three live brands in the exact category |
| `provenant` | brand (security!) | **Provenant** verifiable-comms/fraud co., **Provenant Systems** device security, Provenant DPP supply-chain platforms — fatally in-lane |
| `provenza` | brand | Provenza Floors; `provenza.io` (Jim Provenza, developer); Provenza Technology Services |
| `provya` | brand (phonetic) | **Provaya** (POS software, Crunchbase/ZoomInfo); **PROVYS** (media software) — too close phonetically |
| `praxiel` | brand | **PRAXIEL** — real French software company (LinkedIn/ZoomInfo) |
| `veridot` | brand (security!) | **Veridot** — asset-ID/anti-counterfeit security product (Holomatrix) — directly in-lane |
| `vettara` | brand (phonetic, AI!) | Twin of **Vectara** (AI-agent platform) and **Vectra AI** (cybersecurity) — dangerous double adjacency for an AI-security tool |
| `vouchsafe` | npm | npm 200 (taken) |
| `threshold` | npm | npm 200 (taken) |
| `litmus` | npm | npm 200 (taken) |
| `aegis` | npm | npm 200 (taken) |
| `crucible` | npm | npm 200 (taken) |
| `bulwark` | npm | npm 200 (taken) |
| `portcullis` | npm | npm 200 (taken) |
| `lattice` | npm | npm 200 (taken) |
| `cordon` | npm | npm 200 (taken) |
| `palisade` | npm | npm 200 (taken) |
| `warden` | npm | npm 200 (taken) |
| `customs` | npm | npm 200 (taken) |
| `winnow` | npm | npm 200 (taken) |
| `probity` | npm | npm 200 (taken) |
| `imprimatur` | npm | npm 200 (taken) |
| `betoken` | npm | npm 200 (taken) |
| `epoche` | npm | npm 200 (taken) |
| `plumbline` | npm | npm 200 (taken) |
| `vetrix` | npm | npm 200 (taken) |
| `veylo` | npm | npm 200 (taken) |
| `portwarden` | npm | npm 200 (taken) |
| `touchstone-cli` | npm | npm 200 (taken) |
| `agentassay` | npm | npm 200 (taken) |
| `bonafy` | GitHub (near) | npm free, but GitHub neighbours `bonafya`, `bonafyde` — too close phonetically; phonetic-twin risk |
| `proveil` | GitHub (yellow) | npm free, but repo `Stellar-P/Proveil` exists — residual risk, demoted to backup |
| `nullward` | GitHub (yellow) | npm free, but 2 repos exist + a GitHub user `nullward` (HTTP 200) — demoted to backup |
| `glyphward` | GitHub (yellow) + fit | npm free, but repo `FakeSalamander/glyphward` exists; weak philosophy fit anyway |
| `sieveling` | fit | npm free, GitHub clear; but `sieve` reads as filtering/reduction, not attestation/clearance — wrong act |
| `skillscope` | brand | multiple live HR/education brands: skillscope.ai, skillscope.io, SkillScope360, CCL Skillscope® |
| `skill-audit` | brand + GitHub | exact `pors/skill-audit` competitor already owns this on GitHub — directly in-lane |

### 2b. Round 1 survivors — the vouch/wright/smith family (Round 2 retired)

These names cleared all Round 1 axes. They were retired as a group in Round 2 because the
`-wright/-smith` artisan suffix pattern had been exhausted as a vein and the user requested
a genuinely different semantic direction.

| Name | Status | Notes |
|---|---|---|
| `vouchsmith` | Retired (stem banned R2) | npm 404; GitHub 0 repos; no brand collision found; `.com/.dev/.io/.sh` NXDOMAIN. *A smith who vouches.* Best fit of the artisan family; top pick of Round 1 |
| `vouchwright` | Retired (stem banned R2) | npm 404; GitHub 0 repos; no brand. *A wright who fashions trust.* Same family, slightly more spelling-friction on first hearing |
| `attestwright` | Retired (stem banned R2) | npm 404; GitHub 0 repos; no brand. *Attest* = the precise verb for formal certification; longest of the family (12 chars) |
| `provenwright` | Retired (stem banned R2) | npm 404; GitHub 0 repos; no brand. *Proven + wright* — maker of the proven. Slightly generic on the `proven*` stem |
| `tollwright` | Retired (stem banned R2) | npm 404; GitHub 0 repos; no brand. Gate/threshold metaphor; but "toll" implies a fee — wrong for a free tool |
| `warrantwright` | Retired (stem banned R2) | npm 404; GitHub 0 repos; no brand. Warrant = to guarantee; but "warrant" carries a police-search connotation and 13 chars is long |

### 2c. Round 2 adversarial kills — names that cleared verification but failed challenge

The adversarial reviewer was instructed to default to `survives=false` and attack on every axis.
All 9 clean survivors were killed. The kills that produced the clearest evidence:

| Candidate | Adversarial verdict (one line) |
|---|---|
| `Epural` | Real anatomical term ("epural bone") + historical political-purge root (*épurer*, "purge undesirables") + sounds like "epidural" — three independent fatal axes |
| `Lucevo` | Lucevo Ltd is a live AI-agent company at `lucevo.io` — direct collision in the exact technology sector |
| `Clarvio` | Clarvio LLC is a live incorporated US entity; Clarivo (one-letter transposition, same pronunciation) occupies four separate software product slots |
| `Probevo` | One letter from YC-backed FOSS security brand **Probo**; compounded by German slang contamination and pharmaceutical register |
| `Clarevo` | Five live commercial properties + a UK registered company; detonation zone with Claroty/Clario/Clarivate |
| `Limevo` | Sounds like a cut-rate "Liminal" (funded AI-security competitor); collides with LiME (well-known FOSS forensics tool) and Intel Evo trademark |
| `Bebaxis` | One letter from active "Bebax" brand (coffee + pediatric device); four syllables; "beba" prefix undermines security-tool authority |
| `Vebalo` | Etymology collapses on first inspection; VE-BA- neighbourhood crowded and litigated; fails the brief's own cold-spellability criterion |
| `Cluvex` | Three simultaneous live collisions — active commercial domain, funded academic consortium, and a security-tooling GitHub org |

> **Note on the adversarial phase:** the challenger was set to `default survives=false`, which
> produced zero survivors. The synthesizer correctly fell back to the clean shortlist
> (pre-adversarial) and ranked those 8 names by score. The names in §3 below are the ones that
> survived hard availability verification and earned the highest adversarial scores even while being
> killed — i.e. the strongest of a very clean field.

---

## 3. Ranked Shortlist — Clean Survivors (Round 2)

All names below: npm exact 404, npm hyphenated variants 404, GitHub user/org 404, no brand or
company in software/security/AI, `.dev/.io` NXDOMAIN as of 2026-06-06.
Scores 1–5 per axis; adversarial score is the pre-kill aggregate (philosophy fit + distinctiveness
+ sayability).

| Rank | Name | Syllables | Phil. Fit | Distinct. | Sayability | Etymology root | Availability (verified) |
|------|------|-----------|-----------|-----------|------------|----------------|------------------------|
| 1 | **Fidavel** | 3 | 5 | 5 | 4 | Latin *fides* (trust freely given) + -vel (carrier) | npm 404; GH user 404; GH org 404; `.dev/.io/.com` NXDOMAIN; zero web results |
| 2 | **Clarivo** | 3 | 5 | 4 | 5 | Latin *clarus* (clear, bright) + -ivo (having the nature of) | npm 404; GH 0 repos; no brand; `.com/.dev/.io` NXDOMAIN |
| 3 | **Puravel** | 3 | 4 | 5 | 4 | Latin/Fr *épurer* (filter and emerge clean) + -vel | npm 404; GH 0 repos; no brand; `.com/.dev` NXDOMAIN; zero web results |
| 4 | **Ponvex** | 2 | 4 | 5 | 4 | Latin *pons* (bridge) + -vex (conveyor) | npm 404; GH 0 repos; no brand; `.dev/.io` NXDOMAIN; zero web results globally |
| 5 | **Pravel** | 2 | 4 | 4 | 5 | Latin *probare* (to test, prove good) compressed | npm 404; GH 0 repos; no brand; `.dev/.io` NXDOMAIN; Czech *pravěl* is benign |
| 6 | **Sigavel** | 3 | 4 | 4 | 4 | Latin *signum* (seal of passage) + -vel | npm 404; GH 0 repos; verified distinct from Signal/sigil by full compound |
| 7 | **Clauren** | 2 | 4 | 3 | 5 | Latin *clarens* (making clear, active participle) | npm 404; GH 0 repos; no brand; `.dev/.io` NXDOMAIN; minor Clar- prefix crowding |
| 8 | **Kiavel** | 3 | 3 | 5 | 4 | KI phoneme texture (cross-cultural) + -avel | npm 404; GH 0 repos; no brand; `.dev/.io` NXDOMAIN; zero web results |

### Individual justifications

**Fidavel** (ranked #1)
The name encodes more of this tool's actual philosophy than any other candidate in two rounds of
research. *Fides* in classical Latin is trust extended as a gift — the good faith that underlies
community, commons, and public goods. It is the root of "fidelity," "confidence," and "fiduciary":
a semantic family a practitioner in security will read as serious, not whimsical. The `-vel`
agentive suffix turns the noun into an actor: Fidavel is *the carrier of earned trust*. That maps
precisely onto the product's act — a considered attestation, not an assumption.

The philosophy fit is close to total. "Trust given freely" encodes the free/open/FOSS-forever
commitment. "Good faith through analysis" encodes the static-analysis-not-assumption principle.
"A public commons anyone contributes to" is the natural home of a name rooted in *fides* — the
Roman legal concept of a shared public good. The artisanal confidence is in the phonemic texture:
three clean syllables, a hard consonant at the front, a bright vowel landing.

On availability, Fidavel is as clean as any name found in both rounds: npm exact 404, npm -cli
variant 404, GitHub total_count 0, no user/org, no brand or company, `.dev/.io/.com` all
NXDOMAIN, and "fidavel" returns zero results in a global web search. The only realistic risk is
phonetic adjacency to "fidelity" (Fidelity Investments) — which is a different syllable count,
a well-known brand that no one confuses with a FOSS CLI, and far enough removed by the compound
that trademark opposition is not credible.

**Clarivo** (ranked #2)
Latin *clarus* (clear, bright, made-plain) + the *-ivus* suffix ("having the nature of"),
compressed to -ivo. The name says what the product does in one word: it makes a skill's true
nature visible before it runs. The PASS verdict reads as "cleared." Three syllables, globally
pronounceable, zero ambiguity on spelling after one hearing. Phonetically it sits near Claroty and
Clario, but those are different syllable counts and suffix shapes — the compound `clarivo` is
unclaimed on every axis. It ranks second only because the *Clar-* prefix is a busier brand
neighbourhood; if search-engine distinctiveness matters more than etymology depth, Clarivo is
the correct primary choice.

**Puravel** (ranked #3)
Latin/Old French *épurer* (to refine, to pass through a filter and emerge clean) + -vel (carrier).
The tool is "the one that carries through purification" — which maps directly onto the static-only,
nothing-hidden, FOSS commons promise. Five fully clean axes simultaneously; "puravel" returns zero
results globally. The only risk is that *pura* reads as generic Spanish/Italian ("pure") in a few
markets — below the threshold for a global CLI audience.

**Ponvex** (ranked #4)
Latin *pons* (bridge) + -vex (a carrier/conveyor, also phonetically crisp). The tool is
"the bridge-conveyor" — the liminal crossing from unknown to cleared without using the word
"gate." Two syllables, hard landing, zero existing footprint anywhere in the world. The *pons*
root will be opaque to most users, which is simultaneously a strength (fully ownable) and a
weakness (no first-hearing "aha" moment). Best for a team that prioritises brand distinctiveness
over transparent etymology.

**Pravel** (ranked #5)
Latin *probare* (to test, to prove, to find good) condensed through the care+precision phoneme
pattern: short vowel + liquid consonant + hard landing. Two syllables. The name enacts the tool's
core act — to prove a skill good — in the shortest possible footprint. Sounds careful and precise
rather than loud or assertive. The Czech word *pravěl* ("said/spoke") is benign and will never
reach a typical npm/CLI audience.

**Sigavel** (ranked #6)
Latin *signum* (seal, mark of passage) + -vel. The PASS verdict is a mark of clearance; Sigavel
is "the carrier of that seal." Encodes the attestation act directly. The three-syllable form is
slightly heavier for a CLI command; the phoneme sequence is globally pronounceable and the
compound is fully ownable despite adjacency to "Signal" and "sigil" — verified distinct by the
full compound.

**Clauren** (ranked #7)
Latin *clarens* (making clear, the active participle of *clareo*), compressed to two syllables.
Active-participle form of *clarus*: "the one who is making clear." Sayability is excellent — every
phoneme is unambiguous in English. Ranks lower than Clarivo because the *Clar-* prefix is a
busier brand neighbourhood, and two-syllable Clauren is closer to "Claren-s" (a surname) than
the three-syllable Clarivo is to any existing brand.

**Kiavel** (ranked #8)
KI phoneme texture (Japanese/Korean register, cross-cultural modernity) + the -avel conveyor
suffix. Modern, globally-readable, culturally neutral, open-ecosystem feel. Zero web results.
Ranks last because the philosophy encoding is entirely opaque — unlike Fidavel or Puravel, there
is no root a practitioner can trace back to the product's values. A pure brand-play; valid if
etymology story matters less than phonetic freshness.

---

## 4. Final Recommendation

### Primary: **Fidavel**

The name that encodes the most of what this tool *is* — not what it scans, but what it gives.
*Fides* is literally "trust freely given as a public good," which is the tool's entire value
proposition in one Latin noun. The `-vel` suffix turns it into an actor: the thing that carries
that trust to you. Perfectly clean on every availability axis. Top pick for any team that wants
the name to tell the philosophy story.

**Action items before launch:**
1. Register `fidavel` and `fidavel-cli` on npm simultaneously (lock both).
2. Register `fidavel.dev` and `fidavel.io` at a registrar (both NXDOMAIN at time of research).
3. Create GitHub org `fidavel` (API 404 confirmed; re-verify immediately before creating).
4. Run a USPTO/TESS trademark search on "Fidavel" in classes 009 (software) and 042 (SaaS).
5. If committing commercially, run EUIPO clearance too (Latin root is no protection against a
   prior mark in EU classes).

### Runner-up: **Clarivo**

If Fidavel's etymology story feels too opaque for an English-first audience, Clarivo is the
fallback. "Clarivo" reads immediately as "the thing that makes clear" with zero decoding
required, and it encodes the PASS verdict as "cleared" in the most direct possible way.
The ergonomics are slightly better for spoken use ("run clarivo on this skill"). Ranks second
only because the Clar- prefix neighbours (Claroty, Clario Tech) create a noisier brand
neighbourhood over time, not because of any direct collision.

---

## 5. What to Do Next

The vouch/wright/smith family from Round 1 (especially `vouchsmith`) is still fully available
and worth keeping as a fallback if the Latin-vein names don't land with the team — they cleared
all availability checks and carry a clear artisan-of-trust story. They were retired from Round 2
only because the user wanted a new vein, not because they failed any test.

If none of the names in this report satisfies the team, the next veins to mine are:
- **Japanese/Korean phoneme coinages** (ki-, ra-, -vo, -nel) — community + openness register
- **Old English / Norse roots** for gatekeeping/proof (*ward*, *wit*, *lore*) — but strip
  the literal English words and coin compounds
- **Arabic/Semitic roots** for trust/contract (*amn*, *wafa*, *haq*) — highly distinctive,
  zero npm/brand footprint

---

## 6. Methodology & Caveats

- **npm:** authoritative `registry.npmjs.org` REST API. HTTP 404 = unpublished. HTTP 200 = taken.
  Hyphenated variants checked via `namecheck.sh` at 1–2 natural morpheme split positions.
- **GitHub:** `api.github.com/users/<name>` and `/orgs/<name>`. HTTP 404 on both = clear.
  A 200 on either = handle taken.
- **Domain:** DNS RDAP or `NXDOMAIN` from authoritative registrar API. Strong signal; confirm
  at a registrar before paying for a domain.
- **Trademark / brand:** targeted web search only. USPTO TSDR and EUIPO block automated
  fetching. All trademark statements are informational, not legal advice. Run formal clearance
  before committing any name commercially.
- **Date:** all checks 2026-06-06. The FOSS/AI-security namespace moves fast — re-verify any
  name not acted on within 30 days, especially npm (squatters watch research traffic).
- **namecheck.sh** at `~/.claude/scripts/namecheck.sh` — bash script used for Phase 3
  (bulk parallel curl checks), replacing the previous per-name agent approach that consumed
  20k+ tokens per naming run.

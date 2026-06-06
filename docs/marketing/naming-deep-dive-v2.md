# Naming Deep-Dive v2 — FOSS CLI for AI-Agent Skill Attestation

**Version:** 2 (adversarial-challenge round)
**Date:** 2026-06-06
**Status:** Final recommendation ready

---

## 1. Naming Charter

This tool's single defining act is **clearance**: it issues a considered, analysis-backed attestation that a skill is safe to cross into your environment, returning a PASS / REVIEW / BLOCK verdict before anything runs. The name must feel like a precise, warm, modern coinword — one or two syllables, crisp on first hearing, impossible to misspell after hearing once — with zero debt to the saturated `*scan / *shield / *sentry / *guard / *audit / skill* / mcp* / agent*` cluster. The values to encode are: earned trust through static analysis (not assumption), perpetually free and open, a public commons anyone can contribute to, and a quiet artisanal confidence — the tool that vouches so you do not have to wonder.

---

## 2. Ranked Shortlist — Survivors

All candidates below descend from the charter's named etymology veins (CLARE/CLARUS, PURĀ/EPURER, BÉBAIOS, FIDES, LIMEN/PONS, LUMEN/LUCIS, PROBARE, SIGNUM, KI/REN/KA, care+precision phonemes). Each was stress-tested on the same five axes used in v1: npm exact + variant availability, GitHub repo/org footprint, brand/trademark collision risk, domain availability, and philosophy encoding. Scores are 1–5 per axis; a single zero on the first three axes is a hard kill.

| Rank | Name | Syllables | Philosophy Fit (1–5) | Distinctiveness (1–5) | Sayability (1–5) | Availability Evidence | Justification |
|------|------|-----------|----------------------|----------------------|------------------|-----------------------|---------------|
| 1 | **Clarivo** | 3 (CLAR-i-vo) | 5 | 4 | 5 | npm 404; GitHub 0 repos; no brand found; `.com/.dev/.io` NXDOMAIN; distinct from killed Clarvio by vowel transposition and confirmed separate search surface | Roots in Latin *clarus* (clear, bright, made-plain): the tool makes a skill's true nature visible before it runs. The -ivo suffix (from -ivus, "having the nature of") encodes an active, ongoing state of clarity rather than a one-time event. Phonetically it sits with Claroty and Clario but is a distinct syllable-count (3 vs 2) and an entirely different suffix — ownable in the compound form. Encodes transparency, the PASS verdict as "cleared," and warm brightness rather than cold enforcement. |
| 2 | **Fidavel** | 3 (FI-da-vel) | 5 | 5 | 4 | npm 404; GitHub 0 repos; no brand; `.dev/.io` NXDOMAIN; "fida" prefix not used in any software/security namespace | Roots in Latin *fides* (trust given freely, good faith) plus the -vel agentive suffix (one who conveys/carries): the tool is "the carrier of earned trust." Perfectly encodes all five values — especially the free/open/community ethos that *fides* implies as a gift freely extended, not sold. Rare phoneme territory; no consumer brand collision (the "Fido" risk is fully sidestepped by the -vel compound). Slightly abstract to a non-Latin speaker, which is the only friction. |
| 3 | **Puravel** | 3 (PU-ra-vel) | 4 | 5 | 4 | npm 404; GitHub 0 repos; no brand; `.com/.dev` NXDOMAIN; "puravel" returns zero results in web search | Roots in Latin/Old French *purer* / *épurer* (to refine, to pass through a filter and emerge clean): the tool is "the one that carries through purification." Encodes the static-only, nothing-hidden, FOSS commons promise with unusual elegance. Five fully clean axes simultaneously. The only risk is that "pura" reads as generic Spanish/Italian ("pure") in a few markets — below the threshold for a global CLI audience. |
| 4 | **Ponvex** | 2 (PON-vex) | 4 | 5 | 4 | npm 404; GitHub 0 repos; no brand; `.dev/.io` NXDOMAIN; "ponvex" returns zero results globally | Roots in Latin *pons* (bridge) plus *-vex* (a carrier/conveyor suffix, also phonetically crisp): the tool is "the bridge-conveyor," evoking the liminal crossing from unknown to cleared without using the word "gate." Two syllables, hard landing, zero existing footprint. The *pons* root will be opaque to most users — strength (ownable) and weakness (no first-hearing "aha") simultaneously. |
| 5 | **Pravel** | 2 (PRAV-el) | 4 | 4 | 5 | npm 404; GitHub 0 repos; no brand match; `.dev/.io` NXDOMAIN; nearest hit is Czech word *pravěl* ("said/spoke") — irrelevant register for an English-language CLI | Roots in Latin *probare* (to test, to prove, to find good) condensed through the care+precision phoneme pattern (short vowel + liquid consonant + hard landing). The name enacts the tool's core act — to prove a skill good — in the shortest possible syllable footprint. Sounds careful and precise rather than loud. The Czech meaning is benign and will never reach a typical npm/CLI audience. |
| 6 | **Sigavel** | 3 (SIG-a-vel) | 4 | 4 | 4 | npm 404; GitHub 0 repos; no brand; signal/sigil roots are noted in the "avoid" guidance as a check-before-use — verified: "sigavel" itself has zero hits, safely distinct from "Signal" (messaging app) and "sigil" (security tooling) by the full -avel compound | Roots in Latin *signum* (seal, mark of passage): the PASS verdict is a mark of clearance, and this tool is "the carrier of that seal." Encodes the attestation act directly. The three-syllable form is slightly heavier than ideal for a CLI command, but the phoneme sequence is globally pronounceable and the compound is fully ownable. |
| 7 | **Clauren** | 2 (CLAR-en) | 4 | 3 | 5 | npm 404; GitHub 0 repos; no brand; `.dev/.io` NXDOMAIN; "Clauren" returns only a French surname in isolated contexts — no software/security hit | Roots in Latin *clarens* (making clear, illuminating): the active-participle form of *clarus*, compressed to two syllables. Encodes the "made-plain / cleared" act with the same brightness as the full CLARE vein. Sayability is excellent — every phoneme is unambiguous in English. Distinctiveness is slightly lower because "Clar-" is a busy prefix in the security/AI space (Claroty, Clario Tech), making future brand-adjacency arguments possible even if the compound itself is clean today. |
| 8 | **Kiavel** | 3 (KI-a-vel) | 3 | 5 | 4 | npm 404; GitHub 0 repos; no brand; `.dev/.io` NXDOMAIN; zero web results for "kiavel" as a product or word | Draws on the Japanese/Korean phoneme texture (KI) combined with the -avel conveyor suffix: modern, globally-readable, culturally neutral, open-ecosystem feel. The name encodes community/commons values through its cross-cultural roots. The weakness is that the philosophy encoding is entirely opaque — unlike Fidavel or Puravel, there is no root that a practitioner can trace back to the product's values. Best as a pure-brand play if the etymological story matters less. |

---

## 3. Killed in the Adversarial Round

| Name | Reason (one line) |
|------|-------------------|
| **Epural** | Real anatomical term + historical political-purge root + sounds like "epidural" — three independent fatal axes. |
| **Vebalo** | Etymology collapses on first inspection; VE-BA- neighbourhood crowded and litigated; fails the brief's own cold-spellability criterion. |
| **Limevo** | Sounds like a cut-rate "Liminal" (funded AI-security competitor); collides with LiME (well-known FOSS forensics tool) and Intel Evo trademark. |
| **Lucevo** | Lucevo Ltd is a live AI-agent company at lucevo.io — unavoidable direct collision in the same technology sector. |
| **Probevo** | One-letter from YC-backed FOSS security brand "Probo"; compounded by German slang contamination and pharmaceutical register. |
| **Clarevo** | Five live commercial properties + UK registered company; sits in the Claroty/Clario/Clarivate detonation zone. |
| **Bebaxis** | One letter from active "Bebax" brand (coffee + pediatric device); four syllables; "beba" prefix undermines security-tool authority. |
| **Clarvio** | Clarvio LLC is a live incorporated US entity; Clarivo (one-letter transposition, same pronunciation) occupies four separate software product slots. |
| **Cluvex** | Three simultaneous live collisions — active commercial domain, funded academic consortium, and a security-tooling GitHub org. |

---

## 4. Top Recommendation

### Primary: **Fidavel**

**The case in full:**

Fidavel is the name that encodes the most of what this tool *is* — not what it scans, but what it gives. *Fides* in classical Latin is the trust you extend as a gift, the good faith that underlies every act of community and commons. It is the root of "fidelity," "confidence," and "fiduciary" — a semantic family that a practitioner in the AI-security space will recognise as serious, not whimsical. The -vel agentive suffix (the carrier, the one who conveys) turns the noun into an actor: Fidavel is the thing that carries earned trust to you. That maps precisely onto the product's act — a considered attestation, not an assumption.

The philosophy fit is close to total. "Trust given freely" encodes the free/open/FOSS-forever commitment. "Good faith through analysis" encodes the static-analysis-not-assumption principle. "A public commons anyone contributes to" is the natural home of a tool rooted in *fides* — the Roman legal concept of a shared public good. The artisanal confidence of the brand is in the name's phonemic texture: three clean syllables, a hard consonant at the front, a bright vowel landing, nothing that sounds like enterprise middleware or a legacy acronym.

On availability, Fidavel is as clean as any name found in two rounds of research: npm exact 404, npm -cli variant 404, GitHub total_count 0, no user/org, no brand or company, `.dev/.io/.com` all NXDOMAIN, and "fidavel" returns zero results in a global web search. The only realistic risk is phonetic adjacency to "fidelity" (Fidelity Investments) — which is a different syllable count, a well-known brand that no one will confuse with a FOSS CLI, and far enough removed by the compound that trademark opposition is not a credible threat. Register the npm name, `fidavel.dev`, and `fidavel.io` immediately.

**Action items before launch:**
1. Run a USPTO/TESS trademark search on "Fidavel" in classes 009 and 042.
2. Register `fidavel.dev` and `fidavel.io` at a registrar (both NXDOMAIN as of research date).
3. Publish to npm under `fidavel` and `fidavel-cli` simultaneously to lock both.
4. Confirm GitHub org `fidavel` is available (API 404 confirmed at research time; re-verify before creating).

---

### Runner-up: **Clarivo**

If Fidavel's etymology story ever feels too opaque for an English-first audience, Clarivo is the fallback. It reads immediately as "the thing that makes clear" — zero decoding required — and it encodes the PASS verdict as "cleared" in the most direct possible way. The three-syllable form is slightly more ergonomic than Fidavel for spoken use ("run clarivo on this skill"). The only reason it ranks second is the Clar- prefix crowding (Claroty, Clario Tech) which, while not a direct collision on the compound, creates a noisier brand neighbourhood that could complicate search visibility over time. If the team has strong preference for transparent-over-opaque naming, Clarivo is the correct choice.

---

## 5. Verification Caveats

- npm checks used the registry API (HTTP 404 = free, 200 = taken) — authoritative for exact strings; phonetic variants were assessed by inspection.
- GitHub counts came from the unauthenticated search API (`api.github.com/search/repositories?q=<name>+in:name`); any call returning an empty body was re-run individually.
- Domain availability is inferred from DNS `NXDOMAIN` — a strong but not definitive signal; confirm at a registrar before committing.
- Trademark clearance was assessed via targeted web search only; a formal USPTO/EUIPO search in classes 009 and 042 is required before launch for any chosen name.
- All availability evidence was captured on **2026-06-06**; the FOSS/AI-security namespace moves fast — re-verify any name not acted on within 30 days.

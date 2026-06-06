> ⚠️ **SUPERSEDED — historical artifact.** Earlier `metasphere` vs `exosphere` comparison; the product is now named via `/ideator:name`.
> The current single source of truth is [`../naming-report.md`](../naming-report.md). Do not cite this as current.

# Name-Availability & Branding Report: `metasphere` vs `exosphere`

**Product:** FOSS CLI security tool that audits Claude Code skills/plugins for supply-chain risk ("npm audit / Semgrep for agent skills").
**Decision under review:** Rename repo/package from `exosphere` / `exosphere-audit` (placeholder) to `metasphere`.
**Prepared:** 2026-06-06
**Method:** Live checks against the npm registry API, domain RDAP, GitHub, and web/USPTO/EUIPO search. Every claim is cited. Where a check could not be completed authoritatively, it is marked **INCONCLUSIVE** rather than guessed.

> ⚠️ **Not legal advice.** Trademark notes below are informational only and based on public search, not a clearance opinion. A registered-IP attorney should run a formal clearance before you commit a brand commercially.

---

## 1. Executive summary

**Headline:** `metasphere` is **available as an npm package** (zero registry presence) but is **contested as a brand** — there is an established commercial software company "Metasphere" (UK telemetry/SaaS, now a Grundfos company), the `.com`/`.io`/`.ai` domains are all taken, the GitHub `metasphere` org is occupied, and the word is SEO-crowded (multiple companies + "metaverse/metasphere" crypto usage). `exosphere` is similarly available on npm as a bare name but collides with AI-space startups and an **actively-maintained `@boomi/exosphere` npm package** from Boomi — a major AI-agent-platform vendor, which is the single most concerning collision for an agent-tooling product.

Both top-choice ".com" domains are gone for both names; only `.dev` (and the `*-audit.com` variants) are freely available.

### Summary table

Legend: ✅ available / clear · ⚠️ contested / partial / inconclusive · ❌ taken / conflict

| Channel | `metasphere` | `exosphere` / `exosphere-audit` |
|---|---|---|
| **npm (bare name)** | ✅ Unregistered — `registry.npmjs.org/metasphere` → 404; registry search `total: 0` | ✅ `exosphere` & `exosphere-audit` both 404 (free)… but see ⚠️ scope below |
| **npm (scope/variants)** | ✅ `@metasphere/*`, `metasphere-audit`, `metasphere-cli` all 404 (free) | ❌ `@boomi/exosphere` is **live & active** (modified 2026-06-04, v7.10.0) |
| **Existing company / brand** | ❌ "Metasphere" — established UK telemetry SaaS (Grundfos co.) | ⚠️ Multiple AI/space startups ("Exosphere" AI workflows; Fleet Space ExoSphere; AI Exosphere) |
| **Trademark (US)** | ⚠️ INCONCLUSIVE — no clear live US mark found in search; UK/commercial use exists | ⚠️ US mark `EXOSPHERE` (SN 86801823) **ABANDONED 2017** — no live block found in search |
| **Domain `.com`** | ❌ `metasphere.com` registered | ❌ `exosphere.com` registered |
| **Domain `.io`** | ❌ `metasphere.io` registered (recently: 2025-12-18) | ❌ `exosphere.io` registered |
| **Domain `.dev`** | ✅ `metasphere.dev` available (RDAP 404) | ✅ `exosphere.dev` available (RDAP 404) |
| **Domain `.ai`** | ❌ `metasphere.ai` registered | ❌ `exosphere.ai` registered |
| **Domain `.sh`** | ⚠️ likely available — INCONCLUSIVE (no authoritative RDAP) | ⚠️ likely available — INCONCLUSIVE |
| **Domain `-audit.com`** | ✅ `metasphere-audit.com` available | ✅ `exosphere-audit.com` available |
| **GitHub org/handle** | ❌ `github.com/metasphere` org exists (dormant since ~2015) | ❌ `github.com/exosphere` user exists (0 repos, dormant) |
| **X / social** | ⚠️ `@metasphere` core handle unclear; many close variants taken (`@metasphereuk`, `@metaspherehq`, `@metasph`, IG `@metasphereofficial`) | ⚠️ crowded with AI/space brands |
| **SEO / collision** | ❌ High collision — companies + "metaverse/metasphere" crypto term | ⚠️ Moderate–high — AI compute/space startups dominate |

---

## 2. Per-name detail (cited evidence)

### 2.1 `metasphere`

**npm — AVAILABLE.** The bare package is unregistered: `https://registry.npmjs.org/metasphere` returns HTTP 404 / `{"error":"Not found"}`, and the registry search API returns `total: 0` objects for the term `metasphere` (vs. a working 200 for `react`, confirming the registry is reachable). All obvious variants are also free: `metasphere-audit`, `metasphere-cli`, and the `@metasphere/*` scope all return 404. So as a package name, `metasphere` is completely clear and not squatted.
Source: [npm registry API — registry.npmjs.org/metasphere](https://registry.npmjs.org/metasphere) · [npm search API](https://registry.npmjs.org/-/v1/search?text=metasphere&size=25)

**Existing company / brand — CONTESTED (strongest concern).** "Metasphere" is an established commercial software/hardware company: a UK-based remote-telemetry and monitoring SaaS for the water/wastewater/utility sector, now a Grundfos company, with a "Palette" web-hosted telemetry SaaS product and "Point Colour" RTUs, and installations across UK/Europe/Australasia. They actively use `metasphere.co.uk` and `@metasphereuk`. There is also a separate `metasphere.xyz` ("transforming information into knowledge"). This is a real, operating software brand — the strongest source of confusion risk.
Source: [metasphere.co.uk](https://metasphere.co.uk/) · [metasphere.co.uk/about](https://metasphere.co.uk/about/) · [Companies House — METASPHERE LIMITED](https://find-and-update.company-information.service.gov.uk/company/05673888) · [Envirotech: "Metasphere Ltd — A Story of Growth"](https://www.envirotech-online.com/news/environmental-laboratory/7/metasphere/metasphere-ltd-a-story-of-growth/15786) · [metasphere.xyz](https://metasphere.xyz/)

**Trademark — INCONCLUSIVE (informational).** Public search did not surface a clear *live US* `METASPHERE` registration in software classes IC 009/042 via TESS/Trademarkia (Trademarkia and TSDR block automated fetch; results returned only adjacent marks like `METAVERSAL`). Given the active UK commercial brand, a UK/EU mark is plausible. **This requires a formal TESS/EUIPO clearance before relying on it.** Not legal advice.
Source: [USPTO TESS](https://tmsearch.uspto.gov/) · [USPTO trademark search](https://www.uspto.gov/trademarks/search)

**Domains.** `.com`, `.io`, `.ai` all **registered** (authoritative RDAP: Verisign for `.com`, Identity Digital for `.io`, rdap.org for `.ai` → HTTP 200). Notably `metasphere.io` was *registered only on 2025-12-18* (status `clientTransferProhibited`, expiry 2026-12-18) — i.e. grabbed ~6 months before this report, so it is freshly held, not legacy. `metasphere.dev` is **available** (RDAP 404). `metasphere-audit.com` is **available**. `.sh` could not be resolved authoritatively (INCONCLUSIVE).
Source: RDAP — [verisign .com](https://rdap.verisign.com/com/v1/domain/metasphere.com) · [Identity Digital .io](https://rdap.identitydigital.services/rdap/domain/metasphere.io) · [rdap.org](https://rdap.org/domain/metasphere.ai)

**GitHub — TAKEN.** `github.com/metasphere` is an existing **organization** (Bethlehem PA, self-described "Embedded Elixir Framework", website metasphere.io, last activity ~Nov 2015, 1 forked repo). Dormant but occupies the prime handle. A separate user repo `Shiyang-Zhao/Metasphere` (a Django social app) also reuses the name.
Source: [github.com/metasphere](https://github.com/metasphere) · [github.com/Shiyang-Zhao/Metasphere](https://github.com/Shiyang-Zhao/Metasphere/)

**Social / SEO — CROWDED.** The exact `@metasphere` handle did not clearly resolve, but many near-identical handles are taken (`@metasphereuk`, `@metaspherehq`, `@theMetasphere`, `@metasph`, Instagram `@metasphereofficial`, a Metasphere YouTube channel). Worse, "metasphere" is also a *generic crypto/web3 term* (a brand's "crypto-native community / sphere of influence," frequently conflated with "metaverse"), which dilutes SEO and brand distinctiveness badly.
Source: [X: @metasphereuk](https://x.com/metasphereuk) · [X: @metasph](https://x.com/metasph) · [IG: @metasphereofficial](https://www.instagram.com/metasphereofficial/) · [Urban Dictionary: Metasphere](https://www.urbandictionary.com/define.php?term=Metasphere) · [Five Minute Marketing: "the Metasphere"](https://fiveminutemarketing.com/2021/11/where-is-the-metaverse-leading-us/)

---

### 2.2 `exosphere` / `exosphere-audit`

**npm — bare name AVAILABLE, but scope COLLISION.** `registry.npmjs.org/exosphere` and `/exosphere-audit` both return HTTP 404 (free). However, the registry search for `exosphere` returns `total: 47`, dominated by junk/squat-looking packages ("Adexe Created Npm Publish store…", e.g. `exosphere-start-aurora-tachyon`, all dated mid-2024) **and one serious, actively-maintained package: `@boomi/exosphere`** — "A library of Web Components," latest v7.10.0, created 2022-08-11, **modified 2026-06-04** (i.e. active). Boomi is a major data-activation / AI-agent-orchestration platform (Agentstudio, Agent Garden, Agent Control Tower). For a product positioned in *agent tooling*, sharing a name with a Boomi-published agent-adjacent package is a meaningful collision.
Source: [registry.npmjs.org/exosphere](https://registry.npmjs.org/exosphere) · [npm search: exosphere](https://registry.npmjs.org/-/v1/search?text=exosphere&size=10) · [registry.npmjs.org/@boomi/exosphere](https://registry.npmjs.org/@boomi%2Fexosphere) · [Boomi AI Agents](https://boomi.com/platform/ai-agents/)

**Existing companies — MULTIPLE.** "Exosphere" is in active startup use: an India-based **"Exosphere" AI-workflows platform** (founded 2025, Dehradun — automating/managing *asynchronous AI workflows*, i.e. directly adjacent to the agent space), **AI Exosphere** (Orlando, AI business assistant), **ExoSphere by Fleet Space** (space-enabled geoscience + AI), and an **Exosphere** education company. High brand-collision density.
Source: [Exosphere (Inc42)](https://inc42.com/company/exosphere/) · [Exosphere (Tracxn)](https://tracxn.com/d/companies/exosphere/__SOnybQlsN0tTlEYQAIOOcZeSjaMtZb0PwfBb3Aue9ao) · [AI Exosphere (Crunchbase)](https://www.crunchbase.com/organization/ai-exosphere/technology) · [Fleet Space ExoSphere](https://www.fleetspace.com/exosphere)

**Trademark — likely CLEARER than metasphere (informational).** The US `EXOSPHERE` mark (Exosphere Data, LLC, SN 86801823, filed 2015-10-28, IC for SaaS/cloud-hosting consulting) was **ABANDONED on 2017-12-25** (no statement of use), so that particular registration is dead. No other clearly-live blocking US mark surfaced in search — but Trademarkia/TSDR could not be fetched directly, so treat as INCONCLUSIVE pending formal clearance. Not legal advice.
Source: [Trademarkia: EXOSPHERE 86801823](https://www.trademarkia.com/exosphere-86801823) · [USPTO TESS](https://tmsearch.uspto.gov/)

**Domains.** Identical pattern to metasphere: `exosphere.com`, `.io`, `.ai` **registered** (RDAP 200); `exosphere.dev` **available** (404); `exosphere-audit.com` **available**; `.sh` INCONCLUSIVE.
Source: RDAP — [verisign .com](https://rdap.verisign.com/com/v1/domain/exosphere.com) · [.io](https://rdap.identitydigital.services/rdap/domain/exosphere.io) · [rdap.org .ai](https://rdap.org/domain/exosphere.ai)

**GitHub — TAKEN.** `github.com/exosphere` is an existing user account (active, 0 public repos, no bio) — the prime handle is held but dormant.
Source: [github.com/exosphere](https://github.com/exosphere)

**Competitive note (positioning collision).** A near-identical product already exists and is well-named: **`pors/skill-audit`** — "Security auditing CLI for AI agent skills — detects prompt injection, secrets, and dangerous code patterns." There is also academic/industry activity (SkillProbe, OWASP "Agentic Skills Top 10," Cisco AI Agent Security Scanner). The category is forming — a *distinctive* name matters more than a *thematic* one.
Source: [github.com/pors/skill-audit](https://github.com/pors/skill-audit) · [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)

---

## 3. Risk assessment

| Risk | `metasphere` | `exosphere` |
|---|---|---|
| **Trademark / confusion** | **Higher.** A live, operating software company "Metasphere" (UK telemetry SaaS, Grundfos) actively uses the exact name in *software*. Even without a confirmed US mark, real commercial use + likely UK/EU mark = genuine confusion and rebrand-later risk. | **Moderate.** The one US `EXOSPHERE` software mark is **abandoned (2017)**, but several live AI/space startups use the name, and `@boomi/exosphere` (agent-platform vendor) is active on npm — directly in our lane. |
| **npm squat / abandonment** | **None.** Zero registry footprint — fully clear, nothing to dislodge. | Bare name is free, but namespace is **polluted** by 2024 squat-style packages and shadowed by an active Boomi scope. |
| **Domain** | `.com`/`.io`/`.ai` gone; `.io` freshly grabbed (Dec 2025). Only `.dev` / `-audit.com` obtainable. | Same: `.com`/`.io`/`.ai` gone; only `.dev` / `-audit.com` obtainable. |
| **SEO / distinctiveness** | **Poor.** Collides with the UK company, multiple social handles, *and* generic "metaverse/metasphere" crypto usage. Hard to own in search. | **Mediocre.** Dominated by AI-compute/space startups; thematically generic ("outer layer of atmosphere"). |
| **Category fit** | Weak — "metasphere" reads metaverse/web3, not security. | Weak–neutral — atmospheric metaphor, not security/audit. |

**Bottom line:** `metasphere` does **not** meaningfully improve on `exosphere`. It trades one set of collisions (AI startups + Boomi) for a *worse* set (a live same-sector software company + crypto-term dilution), while the domain/GitHub/social situation is equally constrained. Neither name is strongly differentiated for a security-auditing product, and both prime `.com` + GitHub handles are already taken.

---

## 4. Recommendation

**Do not adopt `metasphere`.** Its only advantage over `exosphere` is a clean npm slate — but that is outweighed by an active same-name commercial *software* company (confusion/TM risk), an occupied GitHub org, taken `.com`/`.io`/`.ai`, and heavy SEO dilution from the metaverse/crypto sense of the word.

**If you must choose between the two existing options, keep `exosphere` / `exosphere-audit`** — its blocking US trademark is abandoned, the bare package and `exosphere-audit` are free, and you avoid introducing a fresh live-company conflict. But note the `@boomi/exosphere` agent-space collision.

**Preferred path: pick a distinctive, category-fitting name.** Neither "sphere" name signals *security auditing of agent skills*, and both have taken `.com`s. A purpose-built name will be cheaper to own in search, on GitHub, and (potentially) at the trademark office. All candidates below were verified **available on npm** (registry 404) and showed **no software-product / trademark / GitHub collision** in search.

### Recommended alternatives (all npm-available, low-collision, on-positioning)

| Name | npm | Rationale | Notes |
|---|---|---|---|
| **`skillsentry`** | ✅ 404 (free) | "Sentry/guard for skills" — instantly reads as security + agent skills | No software brand/TM/GitHub collision found. `skill-sentry` (hyphen) is taken, so prefer the solid form. |
| **`skillwarden`** | ✅ 404 (free) | "Warden of your skills" — security/governance framing, memorable | `skill-warden` and `skillward` also free. No collision found. |
| **`skillsigil`** | ✅ 404 (free) | A *sigil* = a mark of trust/provenance — fits "attestation/audit" angle, distinctive | No collision found. |
| **`aegisskill`** | ✅ 404 (free) | *Aegis* = shield/protection — strong security connotation | No collision found. |
| **`plugaudit`** / **`plugin-audit`** | ✅ both 404 | Literal, descriptive ("audit your plugins") — clear but less brandable | Both free; descriptive names are weaker trademarks. |

**Avoid:** `skillscope` (multiple live HR/education brands: skillscope.ai, skillscope.io, SkillScope360, CCL Skillscope®), and `skill-audit` (the exact `pors/skill-audit` competitor already owns this on GitHub).
Source (alternatives npm): [registry.npmjs.org/skillsentry](https://registry.npmjs.org/skillsentry) · [/skillwarden](https://registry.npmjs.org/skillwarden) · [/skillsigil](https://registry.npmjs.org/skillsigil) · [/aegisskill](https://registry.npmjs.org/aegisskill) · [/plugaudit](https://registry.npmjs.org/plugaudit)
Source (skillscope collision): [skillscope.ai](https://skillscope.ai/) · [skillscope.io](https://www.skillscope.io/) · [SkillScope360](https://skillscope360.com/)

**Top pick: `skillsentry`** — most self-explanatory of the distinctive options (security + agent skills in one word), npm-free, no brand/TM/GitHub collision found. Verify `.dev`/`.com` and run formal TM clearance before committing.

---

## 5. Naming criteria (rationale)

A good name for this product should be:

1. **Memorable & pronounceable** — one coined word, easy to type as a CLI command (`skillsentry scan`).
2. **Available where it counts** — npm package free (no squat to dislodge), a GitHub org/handle free, and at least one premium domain (`.com` or `.dev`) obtainable. *Both `metasphere` and `exosphere` fail the `.com` + GitHub test; the alternatives pass on npm and should be domain-checked next.*
3. **Low collision / distinctive** — not shared with a live same-sector software company (which is exactly why `metasphere` fails) and not a generic dictionary/atmosphere/metaverse word that's hard to own in search.
4. **On-positioning** — signals *security / audit / trust* for *agent skills & plugins*. "Sentry/warden/aegis/sigil" all carry a protective, gatekeeping connotation that "sphere" names do not.
5. **Trademark-defensible** — a coined, distinctive mark in IC 009 (software) / IC 042 (SaaS) is far easier to register and defend than a descriptive or already-in-use term. (Formal clearance still required — not legal advice.)

---

### Appendix — check provenance & caveats
- **npm:** authoritative `registry.npmjs.org` REST + search API; 404 = unpublished/available, 200 = exists. Registry reachability confirmed via a 200 on `react`.
- **Domains:** authoritative RDAP per TLD (Verisign `.com`, Identity Digital `.io`, Google `.dev`, rdap.org for `.ai`). 200 = registered, 404 = available. `.sh` and `whois`-only `.ai` details were not authoritatively resolvable here and are marked INCONCLUSIVE where noted.
- **Trademark:** web search only; USPTO TSDR and Trademarkia block automated fetch, so live-mark status for `METASPHERE` could not be confirmed and is INCONCLUSIVE. **All TM statements are informational, not legal advice.**
- **GitHub / social / SEO:** GitHub profile pages + web search; social-handle exactness for `@metasphere`/`@exosphere` could not be fully confirmed and near-variants are reported instead.

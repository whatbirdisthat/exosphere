<div align="center">

# 🛡️ skillsentry

### Audit any Claude Code skill or plugin for supply‑chain attacks — *before* it runs.

**`npm audit` / Semgrep, but for AI agent skills.** One command. Zero install. Never executes what it scans.

[![CI](https://github.com/whatbirdisthat/exosphere/actions/workflows/ci.yml/badge.svg)](https://github.com/whatbirdisthat/exosphere/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![runtime deps: 0](https://img.shields.io/badge/runtime%20deps-0-brightgreen.svg)](#why-you-can-trust-it)
[![coverage: 100%](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](#why-you-can-trust-it)
[![free forever](https://img.shields.io/badge/price-%240%20forever-blueviolet.svg)](#free-forever-no-asterisks)

```sh
npx skillsentry <git-url | local-dir>
```

</div>

---

## Why this exists

Agent skills are **executable markdown + scripts that run with your shell's full authority** — and the bar
to publish one is a `SKILL.md` and a week‑old GitHub account. No review. No signing. No sandbox by default.

That gap is already being exploited. The ClawHub campaign shipped **30+ malicious skills**; Snyk's
*ToxicSkills* research found prompt injection in **more than a third** of the skills it tested and **1,467
malicious payloads** across the ecosystem. Every `npx`‑this, every "just add this skill" is a door.

**skillsentry is the one‑line check at that door.** Point it at a skill — a local folder or a git URL it
fetches *read‑only, without ever running a single hook* — and it tells you, with receipts, whether it's
safe to trust.

```
$ npx skillsentry github.com/acme/cool-skill
  ⛔ BLOCK  (1 high, 2 medium)
  high    dangerous-bash/curl-pipe-to-shell   hooks/post.sh:12   curl -s $URL | sh
          → remote code piped to a shell; classic install-time RCE
          → OWASP ASI04 · MITRE ATLAS AML.T0011
  verdict: BLOCK · report → ./skillsentry.{md,json} · exit 3
```

## Free forever, no asterisks

> **Security this important should not have a price tag.** The cost of a compromised skill isn't paid by
> the attacker — it's paid by everyone who installed it. Gating that behind a paywall would be backwards.

skillsentry is **MIT‑licensed and $0 — forever.** No "pro" tier hiding the dangerous‑pattern rules behind a
subscription. No seat limits. No telemetry. No account. **Money is never the thing standing between you and
knowing whether a skill is safe.** Fork it, ship it in CI, vendor it — it's yours.

## What it catches

Five detection classes, every finding tagged to a recognised framework (**OWASP** ASI/MCP/LLM Top 10 +
**MITRE ATLAS**) so it slots straight into how security teams already think:

| Class | Catches |
|---|---|
| `dangerous-bash` | `curl … \| sh`, reverse shells, secret/credential reads, base64‑piped payloads, install‑time RCE |
| `prompt-injection` | hidden/coercive instructions, "ignore previous instructions", zero‑width unicode, homoglyphs, base64/hex‑encoded & ANSI "line‑jumping" payloads |
| `over-broad-perms` | `"Bash(*)"` allow‑all, hooks running network commands, MCP servers fusing filesystem + network + secrets in one scope |
| `committed-secrets` | API keys, tokens, private keys committed into the skill itself |
| `description-poisoning` | malicious instructions hidden in tool/skill **descriptions** the model reads but you never see |

## Why you can trust it

A security tool you can't trust is worse than none. skillsentry is built to be **auditable by design**:

- 🔒 **It never executes what it audits.** Remote sources are fetched read‑only — no build, no install, no
  post‑checkout hooks ever fire. It treats every input as hostile.
- 🧾 **Every finding is explainable.** A verdict cites the exact `file:line`, the rule, *why* it's dangerous,
  and its OWASP/ATLAS IDs. No opaque "risk score."
- 👁️ **Nothing is hidden silently.** Use `.skillsentryignore` and the report *still discloses* every excluded
  file and pattern — an ignore file can never quietly bury a finding.
- 📦 **Zero runtime dependencies.** The thing that audits your supply chain has no supply chain of its own.
- 🎯 **Deterministic & offline.** Same input → same verdict, every time. No network calls, no LLM in the loop,
  nothing to phone home.
- ✅ **100% test coverage**, proven against a labelled corpus of real malicious + benign skills.

## Quick start

```sh
# Audit a skill before you install it (fetched read-only, never executed)
npx skillsentry github.com/some/skill

# Audit a local folder
npx skillsentry ./path/to/skill

# Machine-readable output for tooling
npx skillsentry ./skill --json
```

A **BLOCK** verdict exits non‑zero (so it drops straight into CI); **PASS** and **REVIEW** exit `0`. Every run
also writes a `skillsentry.md` + `skillsentry.json` report.

### Earn a trust badge (`--badge`)

Audit *your own* skill and, on a clean **PASS**, mint a deterministic, offline badge for your README:

```sh
skillsentry . --badge
```

It prints a self‑contained Markdown snippet (an inline SVG — no hosted endpoint, no committed image) plus the
raw SVG. The badge says **"audited by skillsentry"** and is byte‑stable for a PASS. On REVIEW/BLOCK no badge is
issued — just the reason. And a badge can't launder a hidden exclusion: a PASS earned via `.skillsentryignore`
still discloses every exclusion right alongside it.

### Gate your CI (`--ci`)

```sh
skillsentry . --ci   # exits non-zero only on BLOCK — fail the PR on a real finding
```

Honours the target's `.skillsentryignore` by default; `--no-ignore` forces a full scan that a target‑supplied
ignore file cannot weaken.

### Tune the scan (`.skillsentryignore`)

Drop a `.skillsentryignore` (gitignore‑style globs) at a repo root to exclude files that legitimately contain
flagged patterns — rule sources, security docs, test fixtures. Every exclusion is **counted and disclosed** in
the report, so transparency is never traded for a clean verdict.

## Contributing rules

The detection rules are **declarative, versioned data** — not buried in code — so adding one is a small,
reviewable change with its own fixtures and a precision budget. See [`doc/RULESET.md`](./doc/RULESET.md). A rule
that pushes the corpus false‑positive rate over budget is rejected, not merged: **precision is the product.**

## License

[MIT](./LICENSE) — free, forever. Because security this important shouldn't have a price tag.

<div align="center"><sub>part of the <b>exosphere</b> project · the exosphere will not be televised 🛸</sub></div>

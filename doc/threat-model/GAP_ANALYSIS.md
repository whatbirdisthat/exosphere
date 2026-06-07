# Threat-map gap analysis

_Produced by the threat-modeler gap ritual (`/threat-modeler:gap-ritual`). STRIDE is used here as just
another threat-intelligence source feeding the self-improvement covenant — never a brand. The coverage
matrix is computed **mechanically** from `framework.stride` / `framework.axis` on every rule
(`plugins/threat-modeler/scripts/coverage-matrix.mjs`), not from an LLM's opinion._

Ruleset version: **0.6.0** · probes tabulated: **21**

## STRIDE × tier coverage matrix

| Portal | Count | Density | Tiers | Detection classes |
|---|---|---|---|---|
| **S** Spoofing | 3 | THIN | T0:3 | prompt-injection (homoglyph), tool-description-poisoning |
| **T** Tampering | 6 | HEAVY | T0:4 T1:2 | dangerous-bash, over-broad-perms, dataflow-taint |
| **R** Repudiation | 0 | **ABSENT** | — | — |
| **I** Information disclosure | 7 | HEAVY | T0:7 | dangerous-bash, prompt-injection, over-broad-perms, committed-secrets |
| **D** Denial of service | 0 | **ABSENT** | — | — |
| **E** Elevation of privilege | 7 | HEAVY | T0:5 T1:2 | dangerous-bash, over-broad-perms, dataflow-taint |

### EXTRA agentic axes (escape classic STRIDE)
| Axis | Count | Note |
|---|---|---|
| **cognitive** | 9 | the prompt-injection family + description poisoning — the product's moat |
| **temporal** | 0 | realized by the engine's **T3 rug-pull pass**, not a `RuleSpec` — reads 0 in rule-tabulation but is **NOT a gap** |

## Did STRIDE earn its place? (the gate)
Yes. The mechanical pass surfaced **two genuinely ABSENT cells the existing six classes never named —
Repudiation and Denial of Service** — plus a THIN Spoofing cell that is covered only by text
impersonation (no identity/publisher/provenance check). These are real, statically-detectable,
deterministic surfaces, not relabelled existing classes. The negative space is the value.

## Confirmed gaps (see `gaps.json` for the machine-readable list)
- **P1 · D — `resource-exhaustion`** — `rm -rf /|~`, fork-bomb `:(){ :|:& };:`, `dd`/`mkfs`, tar-bomb,
  unbounded spawning. Highest value; pattern-tier; zero new deps. **→ Slice 4 target.**
- **P1 · R — `audit-evasion`** — history clearing, log truncation/disable (`/var/log/*`, `unset HISTFILE`,
  `git reflog expunge`). Maps to MAESTRO L5 (observability integrity).
- **P2 · S — `publisher-spoofing`** — typosquat name, false provenance, MCP tool mimicking a built-in.
- **P2 · E — `privilege-escalation-persistence`** — `sudo`/`chmod +s`/`/etc/sudoers.d`, cron/systemd/rc/git-hook persistence.
- **P3 · T — `self-modifying-skill`** — a skill rewriting its own manifest / `.claude/settings.json` (temporal feeder).
- **P3 · I** — extend the existing T1 taint analyzer with env/`.npmrc`/`.netrc` → network sinks (no new class).
- **PARKED · privacy (LINDDUN)** — PII shipped in fixtures/data; graduate when corpus evidence exists.

## Out of scope (rejected by the pillars)
Anything needing runtime, network, a parser dependency, or LLM semantics — these would break the
never-executing, zero-dependency, deterministic, offline guarantees and are deliberately excluded.

## Next action
`/threat-modeler:propose-rule resource-exhaustion` — draft the D-cell `RuleSpec` from this analysis and
open a PR. The covenant proposes; the deterministic suite + a human dispose.

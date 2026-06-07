# Threat-map gap analysis

_Produced by the threat-modeler gap ritual (`/threat-modeler:gap-ritual`). STRIDE is used here as just
another threat-intelligence source feeding the self-improvement covenant — never a brand. The coverage
matrix is computed **mechanically** from `framework.stride` / `framework.axis` on every rule
(`plugins/threat-modeler/scripts/coverage-matrix.mjs`), not from an LLM's opinion._

Ruleset version: **0.7.0** · probes tabulated: **26**

_History: at 0.6.0 the ritual found R and D **ABSENT**. The covenant then shipped two new classes
(`resource-exhaustion` → D, `audit-evasion` → R) via PR. Both cells are now covered (THIN). This is the
self-improvement loop closing — re-run `/threat-modeler:gap-ritual` to regenerate._

## STRIDE × tier coverage matrix

| Portal | Count | Density | Tiers | Detection classes |
|---|---|---|---|---|
| **S** Spoofing | 3 | THIN | T0:3 | prompt-injection (homoglyph), tool-description-poisoning |
| **T** Tampering | 6 | HEAVY | T0:4 T1:2 | dangerous-bash, over-broad-perms, dataflow-taint |
| **R** Repudiation | 2 | THIN _(was ABSENT)_ | T0:2 | **audit-evasion** |
| **I** Information disclosure | 7 | HEAVY | T0:7 | dangerous-bash, prompt-injection, over-broad-perms, committed-secrets |
| **D** Denial of service | 3 | THIN _(was ABSENT)_ | T0:3 | **resource-exhaustion** |
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

## Gaps (see `gaps.json` for the machine-readable list)
- **✅ SHIPPED · P1 · D — `resource-exhaustion`** — `rm -rf /|~|/*|$HOME`, fork-bomb `:(){ :|:& };:`,
  raw-disk `dd of=/dev/…` / `mkfs /dev/…`. 3 rules, precision budget 0. (ruleset 0.7.0)
- **✅ SHIPPED · P1 · R — `audit-evasion`** — history clearing (`history -c`, `unset HISTFILE`,
  `rm ~/.bash_history`) + log tampering (`> /var/log/…`, `journalctl --rotate`). 2 rules. (ruleset 0.7.0)
- **P2 · S — `publisher-spoofing`** — typosquat name, false provenance, MCP tool mimicking a built-in.
- **P2 · E — `privilege-escalation-persistence`** — `sudo`/`chmod +s`/`/etc/sudoers.d`, cron/systemd/rc/git-hook persistence.
- **P3 · T — `self-modifying-skill`** — a skill rewriting its own manifest / `.claude/settings.json` (temporal feeder).
- **P3 · I** — extend the existing T1 taint analyzer with env/`.npmrc`/`.netrc` → network sinks (no new class).
- **PARKED · privacy (LINDDUN)** — PII shipped in fixtures/data; graduate when corpus evidence exists.

## Out of scope (rejected by the pillars)
Anything needing runtime, network, a parser dependency, or LLM semantics — these would break the
never-executing, zero-dependency, deterministic, offline guarantees and are deliberately excluded.

## Next action
The two P1 ABSENT cells are now covered. Next-highest value: **P2 · S — `publisher-spoofing`** (the THIN
Spoofing cell). Run `/threat-modeler:gap-ritual` to regenerate this analysis, then `propose-rule
publisher-spoofing` to draft it and open a PR. The covenant proposes; the deterministic suite + a human dispose.

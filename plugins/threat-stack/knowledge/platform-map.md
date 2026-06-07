# threat-stack — the platform map

threat-stack is a stack of threat-intelligence tools that grows from one trusted core. The value flow:

```
AUDIT ───────────▸ MODEL ──────────────▸ EXTEND
skillsentry        threat-modeler         supersize-*
(pure CLI auditor) (STRIDE/EoP gap        (opt-in external-tool
                    ritual + covenant)     plugins, e.g. Semgrep)
```

## The plugins
| Plugin | Stage | What it does | Default |
|---|---|---|---|
| **skillsentry** | AUDIT | Pure, never-executing, zero-dep static auditor. `/skillsentry:audit <target>` → PASS/REVIEW/BLOCK. The trust anchor. | on |
| **threat-modeler** | MODEL | Maps probes onto STRIDE + agentic axes, runs the EoP gap ritual, proposes new rules via PR. `/threat-modeler:gap-ritual`, `/threat-modeler:propose-rule`. | off |
| **threat-stack** | — | This front door: greet, flow, help, check. | off |
| **supersize-semgrep** | EXTEND | Opt-in Semgrep SAST on top of the verdict — a *separate product* with its own trust statement; shells to an external binary, never imported into the core. `/supersize-semgrep:sast`. | off |

## The one invariant that holds the platform together
The pure auditor (`src/` + `dist/`, vendored as the skillsentry plugin's `cli/`) stays minimal,
deterministic, and zero-dependency **forever**. Everything agentic or external lives in other plugins,
behind the wall. The self-improvement covenant proposes; the deterministic core + a human dispose. See
`plugins/skillsentry/knowledge/trust-pillars.md` and `plugins/threat-modeler/knowledge/covenant-governance.md`.

## Next command, by where you are
- *"Is this skill safe?"* → `/skillsentry:audit <target>`
- *"What threats do we miss?"* → `/threat-modeler:gap-ritual`
- *"Close a gap with a new rule"* → `/threat-modeler:propose-rule`
- *"Deeper, language-aware SAST"* → `/supersize-semgrep:sast <target>` (opt-in; needs `semgrep`)

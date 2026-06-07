---
description: Show the threat-stack value flow (AUDIT ▸ MODEL ▸ EXTEND) and where each installed plugin sits.
allowed-tools: Read, Glob
---

# /threat-stack:flow

Render the platform value flow and the next command at each stage. **Source of truth:
`knowledge/platform-map.md`** — read it and render the `AUDIT ▸ MODEL ▸ EXTEND` flow diagram + table
from there (do not re-embed them here). For each stage show only the plugins actually installed under
`plugins/`, one line each, and the next command. Note the invariant: the pure auditor stays
zero-dependency and deterministic; MODEL and EXTEND live behind the wall and never weaken it.

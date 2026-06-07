---
description: Show the threat-stack value flow (AUDIT ▸ MODEL ▸ EXTEND) and where each installed plugin sits.
allowed-tools: Read, Glob
---

# /threat-stack:flow

Render the platform value flow and the next command at each stage. Read `knowledge/platform-map.md`.

```
AUDIT ───────────▸ MODEL ──────────────▸ EXTEND
skillsentry        threat-modeler         supersize-*
/skillsentry:audit /threat-modeler:        /supersize-semgrep:sast
                   gap-ritual · propose-rule
```

For each stage, show: the plugin (only if installed under `plugins/`), one line on what it does, and the
command to run next. Note the invariant: the pure auditor stays zero-dependency and deterministic;
MODEL and EXTEND live behind the wall and never weaken it.

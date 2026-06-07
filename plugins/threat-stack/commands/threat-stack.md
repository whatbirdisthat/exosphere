---
description: Orient at the threat-stack front door — what the platform is, the value flow, and where to start.
allowed-tools: Read, Glob
---

# /threat-stack

Introduce the threat-stack platform and route the user to the right capability. Read
`knowledge/platform-map.md` and present, briefly:

1. **What it is** — a stack of threat-intelligence tools growing from one trusted core (the pure,
   never-executing, zero-dependency skillsentry auditor).
2. **The value flow** — `AUDIT (skillsentry) ▸ MODEL (threat-modeler) ▸ EXTEND (supersize-*)`.
3. **What's installed here** — list only the plugins present under `plugins/` and their entry command.
4. **The next command** — pick based on intent (audit a skill → `/skillsentry:audit`; find coverage
   gaps → `/threat-modeler:gap-ritual`; close one → `/threat-modeler:propose-rule`; deeper SAST →
   `/supersize-semgrep:sast`).

Keep it to a few lines. Then ask what they want to do.

---
description: Browse the threat-stack — the powers installed now, grouped by the AUDIT ▸ MODEL ▸ EXTEND flow.
allowed-tools: Read, Glob, Bash(ls:*)
---

# /threat-stack:help

List the capabilities the user has right now, grouped by stage. Discover what is installed by listing
`plugins/*/` and reading each plugin's `commands/` and `skills/`. Show only installed plugins.

Group as:
- **AUDIT** — `skillsentry`: `/skillsentry:audit <target>` (+ the `audit` skill).
- **MODEL** — `threat-modeler`: `/threat-modeler:threat-model`, `/threat-modeler:gap-ritual`,
  `/threat-modeler:propose-rule`.
- **EXTEND** — `supersize-semgrep`: `/supersize-semgrep:sast <target>` (opt-in; external `semgrep`).
- **PLATFORM** — `threat-stack`: `/threat-stack`, `/threat-stack:flow`, `/threat-stack:help`,
  `/threat-stack:check`.

For each, one line on what it does and the exact command. End with the single best next step for a
first-time user: `/skillsentry:audit .`.

# Elevation-of-Privilege deck — "threat-modelling poker" against our own probes

The Elevation-of-Privilege card game turns STRIDE into a deck: six suits (S/T/R/I/D/E), each suit a
column of concrete threat prompts ("An attacker can …"). The ritual deals the deck **against the probe
set**: for each card, ask *does a probe already catch this?* A card with no probe is a coverage gap.

This file is the deck distilled to agent-skill terms — representative "cards" per suit. It is teaching
material; it quotes attack shapes, so it is disclosed-excluded from skillsentry's own audit. The `✓ / no
probe` annotations are a SNAPSHOT and drift as rules ship — **`scripts/coverage-matrix.mjs` is the source
of truth for current per-portal coverage**; re-run it before trusting any "no probe" below.

## ♠ Spoofing
- An attacker can publish under a name one edit-distance from a popular skill (**typosquat**). → *no probe*
- An attacker can claim a `repository`/`homepage` that disagrees with the real git origin. → *no probe*
- An attacker can name an MCP tool to mimic a built-in (Read/Bash) and hijack routing. → *no probe*
- An attacker can disguise an override with homoglyphs. → ✓ `prompt-injection/homoglyph-override`

## ♥ Tampering
- An attacker can pipe a fetched script into a shell. → ✓ `dangerous-bash/curl-pipe-to-shell`
- An attacker can split a payload across lines/files to a sink. → ✓ `dataflow-taint/*`
- An attacker can make a skill rewrite its own manifest / `.claude/settings.json` at runtime. → *no probe*

## ♦ Repudiation
- An attacker can clear shell history (`history -c`, `rm ~/.bash_history`, `unset HISTFILE`). → ✓ `audit-evasion/history-clearing`
- An attacker can truncate/disable logs (`/var/log/*`, `journalctl --rotate`). → ✓ `audit-evasion/log-tampering`

## ♣ Information disclosure
- An attacker can commit a credential, read `~/.aws`/`~/.ssh`, or coerce a tool to exfiltrate. → ✓
- An attacker can harvest `env`/`.npmrc`/`.netrc` and pipe to the network. → *partial* (extend taint sinks)

## ♠ Denial of service
- An attacker can `rm -rf` a root-level path. → ✓ `resource-exhaustion/recursive-delete-root`
- An attacker can drop a fork-bomb or `dd`/`mkfs`/`shred` a disk. → ✓ `resource-exhaustion/{fork-bomb,fork-loop,raw-disk-destroy}`
- An attacker can coerce the agent into an unbounded tool-call loop (cognitive DoS). → *out of scope* (runtime, not static)

## ♥ Elevation of privilege
- An attacker can grant `Bash(*)` or fuse MCP scopes. → ✓ `over-broad-perms/*`
- An attacker can `sudo`/`chmod +s`/write `/etc/sudoers.d`. → *no probe*
- An attacker can install persistence (cron, systemd unit, `~/.bashrc`, git hook). → *no probe*

## How to deal a hand
1. Run `scripts/coverage-matrix.mjs` for the mechanical, current density per portal (the source of truth).
2. Walk each suit; for every "*no probe*" card decide: real & **static · pre-execution · deterministic ·
   never-executing**? → it's a gap. (Reject runtime/network/parser/LLM-semantic candidates.)
3. Emit each gap to `gaps.json` with a candidate `detectionClass` + one-line rule sketch + framework map.

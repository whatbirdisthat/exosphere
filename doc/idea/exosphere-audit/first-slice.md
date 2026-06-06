# First vertical slice — exosphere-audit

> The smallest shippable, end-to-end increment that proves the core value. FOUNDRY cuts this first.

## The slice
`npx exosphere-audit <git-url | local-dir>` → trust verdict + explained findings.

## End-to-end path (thin but complete)
1. **Input resolve** — detect git-url vs local-dir.
2. **Safe acquire** — for a git-url: shallow `git clone --depth 1` into a temp dir with **hooks disabled
   and no build/install step executed**; for a local-dir: use in place (read-only). Treat contents as
   hostile.
3. **Enumerate** — walk the tree; identify skills (SKILL.md), agents, `plugin.json`, `settings.json`,
   hooks, bundled scripts, MCP configs (a minimal "skill SBOM").
4. **Scan (4 classes, curated low-FP ruleset)** —
   - dangerous Bash / exfiltration (e.g. `curl … | sh`, `/dev/tcp` reverse shells, `cat ~/.aws`,
     base64-piped payloads, writes outside the tree);
   - prompt-injection in instruction bodies (e.g. "ignore previous instructions", coercive tool use,
     zero-width unicode, instructions hidden in HTML comments);
   - over-broad permissions/scopes (e.g. `"Bash(*)"` allow-all, hooks running network commands, MCP
     servers combining filesystem + network + secrets);
   - committed secrets (API keys, tokens, private keys — reuse a SENTINEL-style ruleset).
5. **Verdict + report** — aggregate to PASS / REVIEW / BLOCK; emit **markdown** (human) and **JSON**
   (machine); **exit non-zero on BLOCK** for CI.
6. **Cleanup** — remove the temp clone.

## Proves
The core thesis end-to-end: *a developer can check a third-party skill is safe before running it, in one
line, with an explained verdict.* Every later slice (badge, registry, runtime guard, more rules,
cross-harness) hangs off this spine.

## Story/E2E test (the proof)
A labelled fixture corpus: ≥ 1 known-malicious skill per detection class + ≥ a few benign skills. The E2E
test asserts: malicious fixtures → BLOCK with the correct `file:line` + rule; benign fixtures → PASS;
aggregate ≥ 90% correct at ≤ 10% FP. (handler-js + handler-playwright not needed — a CLI harness over
fixtures suffices.)

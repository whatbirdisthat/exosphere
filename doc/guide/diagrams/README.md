# Diagrams

The educational diagrams used throughout `doc/guide/` and the README. Each diagram is committed as
**both** its mermaid source (`*.mmd`, readable and editable) and a rendered vector (`*.svg`, embedded in
the docs). Readers need nothing installed — GitHub displays the committed SVGs.

| Diagram | Teaches |
|---|---|
| `scan-pipeline` | the end-to-end audit: target → acquire (read-only) → enumerate → scan → verdict → report |
| `architecture-boundaries` | the pure-core / adapter / CLI split that makes "never execute" structural (ADR-001) |
| `tier-model` | the T0 / T1 / T3 detection tiers (and why T2 stays a future opt-in) |
| `rule-compilation` | how a rule (data) becomes a matcher, and why data can never execute (ADR-005) |
| `taint-flow` | T1 dataflow/taint: a tainted SOURCE reaching a dangerous SINK across lines/files |
| `drift-classification` | T3 rug-pull: escalation vs approval-invalidation vs benign drift (ADR-008) |
| `verdict-model` | how findings aggregate to PASS / REVIEW / BLOCK and the exit codes |

## Editing and re-rendering

1. Edit the relevant `*.mmd` file (plain [Mermaid](https://mermaid.js.org/) source).
2. Re-render:

   ```sh
   ./scripts/render-diagrams.sh
   ```

3. Commit both the `.mmd` and the regenerated `.svg`.

### Requirements (maintainers only)

`render-diagrams.sh` uses [`mermaid-cli`](https://github.com/mermaid-js/mermaid-cli) (`mmdc`) plus a
Chromium/Chrome browser for headless rendering:

```sh
npm install -g @mermaid-js/mermaid-cli
```

The browser is auto-detected; override with `CHROME=/path/to/chrome ./scripts/render-diagrams.sh`.

> **`mmdc` is maintainer tooling, not a project dependency.** skillsentry ships with **zero runtime
> dependencies** (`package.json` `dependencies: {}`) — that is a core trust property, and nothing here
> changes it. Diagram rendering happens at authoring time; end users and the published package never
> touch a browser or a diagram tool.

Theming lives in `mermaid-config.json` (a neutral palette, white background) so every diagram shares one
look.

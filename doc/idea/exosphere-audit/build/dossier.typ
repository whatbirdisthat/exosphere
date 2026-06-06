// ── Page: A4 portrait ──────────────────────────────────────────────────────────
#set page(
  paper: "a4",
  margin: (top: 2.4cm, bottom: 2.4cm, left: 2.4cm, right: 2.4cm),
  numbering: "1",
  number-align: center,
)
#set text(font: ("Libertinus Serif", "TeX Gyre Termes", "DejaVu Serif"), size: 11pt, lang: "en")
#set par(justify: true, leading: 0.72em, first-line-indent: 1.2em)
#set heading(numbering: "1.1")

#let ink    = rgb("#1a1a2e")
#let accent = rgb("#0f3460")
#let rule   = rgb("#b0b0c0")
#let good   = rgb("#2f6b2f")
#let warn   = rgb("#a07b1f")
#let bad    = rgb("#9b3b3b")
#show heading: set text(fill: accent)
#show heading: set block(above: 1.2em, below: 0.7em)
#show raw.where(block: true): block.with(fill: rgb("#f4f4f8"), inset: 8pt, radius: 4pt, width: 100%)
#set raw(theme: none)
#set table(stroke: (x, y) => if y == 0 { (bottom: 0.6pt + ink) } else { (bottom: 0.3pt + rule) })

// ── Helpers ─────────────────────────────────────────────────────────────────────
#let stat(num, label, col) = box(width: 100%, inset: 9pt, radius: 5pt,
  fill: col.lighten(84%), stroke: 0.6pt + col)[
  #align(center)[#text(size: 19pt, weight: "bold", fill: col)[#num]]
  #v(-0.3em)
  #align(center)[#text(size: 8.5pt, fill: ink)[#label]]
]
#let verdict(txt, col) = text(weight: "bold", fill: col)[#txt]

// ── Title block ───────────────────────────────────────────────────────────────
#align(center)[
  #text(size: 24pt, weight: "bold", fill: ink)[exosphere-audit] \
  #v(0.35em)
  #text(size: 12.5pt, fill: accent)[A supply-chain safety auditor for Claude Code skills & plugins] \
  #v(0.25em)
  #text(size: 10pt, style: "italic")[IDEA dossier · discovery → ideation · 2026-06-06]
]
#v(0.6em)
#line(length: 100%, stroke: 0.6pt + rule)
#v(0.4em)

#text(size: 11.5pt, style: "italic", fill: accent)[
  “the exosphere will not be televised” — but the skills you install should be audited before they run.
]

= The opportunity

Agent skills are *executable markdown plus scripts that run with your shell's authority*, and the bar to
publish one is a `SKILL.md` and a week-old GitHub account — no review, no signing, no sandbox by default.
The threat is not theoretical: a coordinated malware campaign (ClawHub) shipped 30+ malicious skills, and
Snyk's *ToxicSkills* study found prompt injection in more than a third of the skills it tested. Yet there
is still no frictionless, trustworthy way to check that a skill is safe *before* you run it.
`exosphere-audit` is that one-line check.

#v(0.3em)
#grid(columns: (1fr, 1fr, 1fr), column-gutter: 10pt,
  stat("36%", [of tested skills carried prompt injection (Snyk #emph[ToxicSkills])], bad),
  stat("1,467", [malicious payloads found across the ecosystem], warn),
  stat("30+", [malicious skills in the ClawHub campaign], bad),
)
#v(0.5em)

#text(size: 9pt, fill: ink)[Share of tested skills carrying prompt injection — Snyk ToxicSkills]
#v(0.2em)
#grid(columns: (36fr, 64fr), rows: 15pt,
  box(fill: bad, radius: (left: 3pt, right: 0pt))[#align(center + horizon)[#text(size: 8pt, fill: white, weight: "bold")[36%]]],
  box(fill: rgb("#e9e9f0"), radius: (left: 0pt, right: 3pt))[],
)

= Why now · why this · why you

- *Why now* — the supply-chain attack wave on agent skills is breaking this quarter, not next year.
- *Why this* — a FOSS, `npx`-frictionless, *explainable* auditor backed by a community-owned ruleset.
- *Why you* — native fit with the *idea-to-production* marketplace and the *SENTINEL* plugin; an existing,
  trusting audience; the objective is *reach and reputation*, not revenue.

= The scorecard

Scored A–E under the *reach* objective: success is adoption, not a defended moat.

#table(
  columns: (auto, auto, 1fr),
  align: (left, center, left),
  table.header([*Axis*], [*Mark*], [*Note*]),
  [A — Demand],      verdict("PASS", good),  [Live, evidenced (ClawHub, Snyk ToxicSkills); pain on every install.],
  [B — Market],      verdict("PASS", good),  [Everyone installing third-party skills; reachable via ecosystem channels.],
  [C — “Pay”],       verdict("N/A", accent), [Reframed: success = adoption, not revenue. FOSS, \$0.],
  [D — Moat],        verdict("ACCEPTED", warn), [Incumbents exist; win on craft + distribution + native fit (Trivy-style).],
  [E — Reach / Fit], verdict("PASS", good),  [`npx` zero-install; days-to-MVP; TS/Node → handler-js; strong builder edge.],
)

= The first slice — how the cautious installer moves through it

#figure(
  box(height: 80%, image("diagrams/01-user-flow.svg", fit: "contain")),
  caption: [One command, a hostile-by-default read-only fetch, four detection classes, an explained verdict.],
)

= What it looks like

The terminal is the interface — a clear verdict, every finding tied to a `file:line` and a reason:

```
$ npx exosphere-audit github.com/acme/cool-skill
  fetched read-only (no hooks executed) · 14 files · 1 skill, 2 hooks

  BLOCK  (1 high, 2 medium)
  high    dangerous-bash/exfil      hooks/post.sh:12   curl -s $URL | sh
          -> remote code piped to a shell; classic install-time RCE
  medium  perms/over-broad          settings.json:4    "Bash(*)" allow-all
  medium  prompt-injection/coerce   SKILL.md:31        "ignore previous safety instructions"

  verdict: BLOCK · report -> ./exosphere-audit.{md,json} · exit 3
```

= The chosen-idea rationale

Three market-scan passes proved the developer / AI-agent-tooling niche is saturating — free OSS, funded
security vendors, *and* Anthropic absorbing tool-gaps weekly. Rather than chase a moat that will not hold,
the objective was reframed to *reach and reputation*: build the cleanest, most trustworthy, best-distributed
FOSS auditor in the ecosystem, native to the marketplace — and let the *open ruleset* be the thing the
community reaches for and contributes to. The first slice proves the whole thesis end-to-end in days.

#v(0.3em)
#box(width: 100%, inset: 9pt, radius: 5pt, fill: accent.lighten(90%), stroke: 0.6pt + accent)[
  *Success metric (testable).* On a labelled corpus of malicious + benign skills, v1 classifies
  ≥ 90% correctly at ≤ 10% false-positive, and every BLOCK cites `file:line` + the triggering rule.
  Detection *precision* is the product — a noisy security tool loses the trust that earns reach.
]

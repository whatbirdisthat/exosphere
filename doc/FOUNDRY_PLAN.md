# FOUNDRY Plan — exosphere-audit — 2026-06-06

> Cycle scope: **R1 only** (the first vertical slice). Tier-2 (R2–R7) is parked.
> Source of truth: `doc/idea/exosphere-audit/brief.md`; domain: `doc/SUBJECT_MATTER_UNDERSTANDING.md`.
> Planner: builder-lead (cycle planner). Per-item run is driven by `lifecycle-orchestrator` — **not started in this phase.**

---

## Stack Manifest

| Layer | Choice | Notes |
|---|---|---|
| Language | **TypeScript 5.x** on **Node.js 20 LTS** (≥18) | ESM. Strict mode on. |
| Package / dist | npm, published for **`npx exosphere-audit`** | `bin` entry; zero-install reach channel. |
| Test runner | **Vitest** | Fast TS-native; coverage via `@vitest/coverage-v8` (100% line+branch floor). |
| BDD / FEATURE | Gherkin `.feature` files mapped to Vitest specs (cucumber-style `@EARS-{ID}` tags) | No separate Cucumber runtime required; tags trace tests → scenarios. |
| E2E / STORY | **CLI harness over the labelled fixture corpus** (spawn the built CLI, assert verdict + exit code + JSON/markdown) | handler-playwright **N/A** (no UI) — confirmed by `first-slice.md`. |
| Git acquisition | `git clone --depth 1` via `child_process`, **hooks disabled** (`-c core.hooksPath=/dev/null`, no submodule/LFS smudge), no install step | Hostile-source invariant. |
| Lint / format | ESLint (`-D warnings`) + Prettier | CI gate. |
| Toolchain | Node 20, npm; CI on GitHub Actions | — |

**VALUE_HANDLER required:** **`handler-js`** (TypeScript/Node, non-React, non-CSS). Available in roster. ✅
**Reviewers invoked (GOVERNANCE):** EARS-REVIEWER, SMU-REVIEWER, BDD-REVIEWER, TEST-DESIGN-REVIEWER,
COVERAGE-REVIEWER, SECURITY-REVIEWER, REGRESSION-REVIEWER, ARCHITECTURE-REVIEWER, DOCUMENT-REVIEWER
(via the `reviewer` role-parametrised panel). SECURITY review is load-bearing here (the auditor's own
safety invariant) — and **SENTINEL `/security-gate` should run before DELIVERY** (sentinel is installed).

---

## Subject Matter Understanding — Status

`doc/SUBJECT_MATTER_UNDERSTANDING.md` — **created this cycle** (v1) from `smu-seed.md`. Covers all
R1 actors (cautious installer, author, CI), all four detection-class terms, the read-only/never-execute
constraints, and the ≥90%/≤10%-FP success outcome. No gaps against R1.

---

## Architecture (handler-architect — ADR recommended, lightweight)

R1 crosses two boundaries that warrant a recorded decision before decomposition:
- a new **external integration** (git acquisition of a hostile remote), and
- a new **delivery channel** (a CLI).

Recommended pattern: **Pipeline + thin Hexagonal core** — a pure, IO-free **scan core** (rules →
findings → verdict) wrapped by thin adapters at the edges (acquire, enumerate, render, CLI). This is
the directly testable shape the test-as-coordinate philosophy wants: the decidable logic (rule
matching, finding shaping, verdict aggregation) is pure and unit-pinned; the IO (clone, fs walk,
stdout, exit code) is thin wiring validated at system/story level.

> **Decision for the user / orchestrator:** spawn `handler-architect` for a one-page ADR at the
> top of the run (cheap insurance, ~3k), or accept the Pipeline+pure-core recommendation as-is and
> skip the ADR. Defaulting to: **write the ADR** (the never-execute trust boundary deserves a recorded
> rationale).

---

## Shared Infrastructure Map (intra-item — R1 is a single item, so this is the within-slice leverage)

| Component | Tasks that need it | Build in task | Build once (~tok) | Rebuild N× (~tok) |
|---|---|---|---|---|
| **Domain types** (`Rule`, `Finding`, `Severity`, `Verdict`, typed errors) | T3,T4,T5,T6,T7,T8 | **T3** | ~2k | ~8k |
| **Safe-acquire** (input resolve + hostile shallow clone + cleanup) | T6, STORY | **T6** | ~4k | ~9k |
| **Enumerator** (tree walk → skill SBOM) | T7, all scanners | **T7** | ~3k | ~7k |
| **Rule engine + ruleset loader** (curated, versioned) | T8a–d | **T8a** | ~4k | ~14k |
| **Verdict aggregator** (findings → PASS/REVIEW/BLOCK + exit code) | T9, STORY | **T9** | ~2k | ~5k |
| **Reporters** (markdown + JSON renderers) | T10, STORY | **T10** | ~3k | ~7k |
| **Fixture corpus** (labelled malicious + benign) | STORY gate | **T2/T11** | ~5k | n/a (the gate) |

The pure scan core (types → engine → aggregator) is built **first and once**; the four detection-class
scanners (T8a–d) are then **parallel-safe** against it (disjoint rule modules, no shared mutable state).

---

## Token Budget Summary

| Phase | Tasks | Est. tokens |
|---|---|---|
| Scaffold + ADR | T1, (ADR) | ~8k |
| EARS + FEATURE | T2, T3-spec… (specs for all behaviours) | ~12k |
| TEST (place the coordinates) | failing tests across all modules + fixtures | ~22k |
| IMPLEMENT (turn green) | acquire, enumerate, engine, 4 scanners, aggregate, render, CLI | ~40k |
| STORY (corpus gate) | corpus build + E2E harness + ≥90%/≤10%-FP assertion | ~14k |
| GOVERNANCE (reviewer panel + sentinel gate + revisions) | across all transitions | ~18k |
| DELIVERY (sync, commit narrative, push, PR per governance) | T12 | ~6k |
| **Slice total (point estimate)** | | **~120k** |
| **Planning band (greenfield, no cost history)** | | **~95k – ~150k** |

> Basis: priority→tier heuristic (no `IDEA_COST.jsonl` history — greenfield). The four detection-class
> scanners are the swing factor: ruleset curation for low-FP is iterative and reviewer-gated. The
> estimate **excludes** model-tier discounts (haiku for high-volume test code, sonnet for impl, opus for
> spec/story/review per `model-selection.md`) and excludes human review/merge latency under pr-approval.

---

## Work Decomposition (R1)

**Tier:** PRIMARY · **Priority:** P0 · **Depends on:** nothing (greenfield) · **Token budget:** ~120k

Test-first task order (**EARS → FEATURE → TEST → IMPLEMENT → STORY**), with parallelism noted:

1. **T1 — Scaffold** [handler-js]: npm project, TS strict, Vitest + v8 coverage, ESLint/Prettier,
   `bin` entry, CI workflow skeleton (fmt → lint -D → unit → coverage → system → STORY-corpus). ~5k
2. **T2 — Corpus seed plan** [handler-js + reviewer]: define the labelled fixture corpus *shape* (≥1
   malicious fixture per detection class + several benign), with expected verdicts as the success oracle.
   (Fixtures themselves are filled in test-first at STORY; the *labels/oracle* are fixed here.) ~4k
3. **T3 — EARS** [EARS-AGENT]: unambiguous requirements for input-resolve, safe-acquire/never-execute,
   enumerate, each of 4 detection classes, verdict aggregation, dual output, exit code. ~6k
4. **T4 — FEATURE** [FEATURE-AGENT]: ≥3 Gherkin scenarios per EARS (happy / unhappy / **abuse** — abuse
   matters doubly here: hostile clone, injection-in-fixture). BDD-REVIEWER gate. ~6k
5. **T5 — TEST (place coordinates)** [TEST-AGENT + handler-js]: failing unit tests for the **pure core**
   first — `Rule`/`Finding`/`Verdict` types, rule-engine matching, verdict aggregation, each scanner's
   match logic (empty / max / unicode / zero-width / HTML-comment / hostile-input axes). Plus
   module/boundary tests for acquire (temp-fs), enumerate, reporters. Confirm genuinely RED. ~22k
6. **T6 — IMPLEMENT: safe-acquire** [handler-js]: input resolve (url vs dir) + hostile shallow clone
   (hooks disabled, no install) + temp cleanup. **Shared infra.** ~4k
7. **T7 — IMPLEMENT: enumerate** [handler-js]: tree walk → skill SBOM (skills/agents/manifests/hooks/
   scripts/MCP). **Shared infra.** ~3k
8. **T8 — IMPLEMENT: rule engine + 4 scanners** [handler-js]:
   - T8a engine + versioned ruleset loader + domain types (**shared infra, build first**) ~4k
   - T8b `dangerous-bash` · T8c `prompt-injection` · T8d `over-broad-perms` · T8e `committed-secrets`
     — **parallel-safe** once T8a lands (disjoint rule modules). ~5k each (~20k)
9. **T9 — IMPLEMENT: verdict aggregator** [handler-js]: findings → PASS/REVIEW/BLOCK + non-zero exit on
   BLOCK. **Shared infra.** ~2k
10. **T10 — IMPLEMENT: reporters** [handler-js]: markdown + JSON renderers (each finding cites
    file:line+rule+why). **Shared infra.** ~3k
11. **T11 — STORY (the corpus gate)** [STORY-AGENT + handler-js]: fill the labelled corpus; E2E harness
    spawns the built CLI over every fixture; assert malicious→BLOCK with correct file:line+rule,
    benign→PASS, aggregate **≥90% / ≤10% FP**, JSON+markdown shape, exit codes. Perf-delta sample
    recorded vs baseline. ~14k
12. **T12 — DELIVERY** [ds-step-7/8/9]: SENTINEL `/security-gate` (PII+secret+dep audit on our own repo),
    sync, commit narrative, push; **PR per governance** (no DEPLOY/VERIFY — pure library/CLI, line ends
    at DELIVERY). ~6k

---

## Parallel Grouping

- **Round 1 (serial spine — shared infra first):** T1 → T3 → T4 → T5 (specs/tests before code) →
  T8a (engine+types) → T6, T7 (acquire, enumerate — parallel-safe with each other).
- **Round 2 (fan-out):** T8b / T8c / T8d / T8e — the four scanners run **concurrently** (disjoint files).
- **Round 3 (converge):** T9 (aggregate) → T10 (reporters) → T11 (STORY corpus gate) → T12 (delivery).

Serialization points: T8a (engine) blocks the scanners; T9/T10 consume all scanner output; T11 consumes
the whole pipeline. Everything else parallelises.

---

## VALUE_HANDLER_POOL Required

- **handler-js** — all TEST / IMPLEMENT / STORY work (TS/Node). ✅ available
- **reviewer** (role-parametrised panel) — gates every transition. ✅
- **handler-architect** — one lightweight ADR (trust boundary). ✅ (optional per decision above)
- **SENTINEL** companion (`/security-gate`) — pre-DELIVERY audit of our own repo. ✅ installed

**N/A for this slice:** handler-playwright, handler-vanilla-js, handler-css, handler-react, atelier
(DESIGN/UI) — **no user interface; CLI only.**

---

## Missing Handlers (self-improvement flags)

None. The slice is fully staffed by `handler-js` + `reviewer` (+ optional `handler-architect`,
+ SENTINEL companion).

---

## Self-Improvement Flags

- **Ruleset curation for low-FP is the iterative cost driver.** If multiple revision cycles cluster on
  false-positive tuning, that's signal the TEST-AGENT needs sharper benign-fixture prompting (per the
  SOLID covenant) — record actuals in `IDEA_COST.jsonl` and revisit the corpus-seed task (T2) design.
- First cycle for this project: no `IDEA_COST.jsonl` baseline yet — estimates are heuristic; reconcile
  against actuals at cycle end to calibrate future tiering.

---

## Resumption Instructions (cold-start)

1. Read `doc/SUBJECT_MATTER_UNDERSTANDING.md`, `doc/idea/exosphere-audit/brief.md`, `ROADMAP.md` (R1).
2. Confirm governance mode in `.foundry/governance.md` (FOUNDER asks the user before the heavy build).
3. Hand **R1** to `lifecycle-orchestrator` to run steps 0–9 in the task order above. Build the **pure
   scan core first** (types → engine → aggregator), then the four scanners in parallel, then wire IO.
4. The **fixture corpus IS the success gate** — do not call the slice done until STORY asserts
   ≥90%/≤10%-FP with file:line+rule on every BLOCK.
5. Do **not** build R2–R7. The line ends at **DELIVERY** (no DEPLOY/VERIFY for a pure CLI library).

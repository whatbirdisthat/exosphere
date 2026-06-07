# 🛰️ SKILLSENTRY — Development Command Deck

> **Purpose:** the single source of truth for *what's on the desk right now* — everything
> outstanding, in-flight, or awaiting a decision. Written so it can be picked up cold
> after a reboot.
>
> **Date:** 2026-06-07 · **Branch:** `main` (up to date with `origin/main`)
>
> **How to use this menu:** each item is numbered. After reboot, say *"read the
> SKILLSENTRY plan and show me what is on the menu"* and then pick by number
> ("let's do 1", "I'll take 4 and 5"). Each item lists **what · why · effort (S/M/L) ·
> status**.

---

## 📊 Status snapshot

| | |
|---|---|
| **Product** | `skillsentry` — static supply-chain auditor for AI-agent skills |
| **Tier 1** | ✅ Shipped & merged (R1–R4, R9a, R9b, R9b.1, R10, **R9d**) |
| **Tests** | 387 · **100%** coverage (line / branch / fn / stmt) |
| **Runtime deps** | **0** (the trust pillar) |
| **Detection** | OWASP + MITRE ATLAS mapped · T0 pattern + T1 deterministic dataflow (intra- & cross-file) + **T3 temporal rug-pull (lockfile drift)** |
| **Security gate** | SENTINEL PASS · self-audit 100% PASS |
| **Last merge** | PR #13 — R9d T3 rug-pull / version-diff (approval lockfile) |

The thesis is proven end-to-end: FOSS / $0, deterministic, never-execute, transparent,
low-FP, framework-mapped. The differentiator (R9d) has shipped. What remains is **a docs
uplift, then the publish decision.**

> **Session decisions (2026-06-07):**
> - **#3 SCORECARD.json — COMMITTED** as a CI artifact (`116c107`).
> - **R9d (T3 rug-pull) — ✅ SHIPPED** via PR #13 (approval-lockfile model; capability-fingerprint
>   diff + additive-only invariant). The differentiator is in `main`. R9c/R9e stayed rejected (each
>   spends a trust pillar); R7 hosted platform explicitly not pursued.
> - **#4 npm publish — UNBLOCKED, still deferred by choice.** The R9d gate is satisfied; publish is
>   now a clean go/no-go whenever wanted. Launch story: "the only skill auditor that catches the rug-pull."
> - **NOW IN FLIGHT — documentation uplift** (educational guides + 7 mermaid diagrams + FOSS-hygiene
>   files + a flagship pressroom article; README retoned to a teaching voice). On branch `docs/uplift`.
>   FOSS-spirit: built because we want the tool to exist, not to sell it.

---

## 🍽️ THE MENU

### Course 1 — Housekeeping (quick wins)

**1. Fix the rich status line** 🔧
- **What:** the status line was wired into `~/.claude/settings.json` but renders empty /
  fails. Root cause: the script reads an **invented JSON schema** that Claude Code never
  sends. Realign it to the real payload, derive what's derivable, and fix two robustness
  bugs. Route the change back through the **statusline-setup** agent.
- **Why:** you asked for "the works" — and right now it shows nothing.
- **Effort:** M · **Status:** ⚠️ ready (full diagnosis in the Appendix)

**2. Branch & worktree cleanup** 🧹
- **What:** delete merged local branches `slice/r9b1-crossfile-dataflow` and
  `ci/make-it-awesome`; audit/prune the stale `worktree-agent-*` worktree.
- **Why:** keep the tree honest; merged branches are noise.
- **Effort:** S · **Status:** ✅ ready

**3. `SCORECARD.json` — commit or ignore** 📄
- **What:** untracked generated scorecard (100% across the board). Decide: commit as a CI
  artifact, or add to `.gitignore`.
- **Why:** it's sitting untracked in `git status`; pick a lane.
- **Effort:** S · **Status:** ✅ DONE — committed as a CI artifact (`116c107`, 2026-06-07).

---

### Course 2 — Ship

**4. Publish `skillsentry` to npm** 🚀
- **What:** `npm publish`. All preconditions are met — name verified npm-free,
  `prepublishOnly` gated on `build` + `test:cov`, security-gate PASS, zero deps, self-audit
  100% PASS.
- **Why:** the product is done and trustworthy; nothing technical blocks release.
- **Effort:** S · **Status:** ✅ UNBLOCKED (2026-06-07) — the R9d gate is satisfied (PR #13 merged).
  Publish is now a clean go/no-go whenever wanted; still deferred only by choice.

---

### Course 3 — Product roadmap (pick the next slice)

> Tier 2 is **parked on purpose** pending market feedback. Pick one when you want to
> extend the thesis. Listed roughly by leverage.

**5. R5 — spec/quality drift checks**
- Detect behaviour / schema / permission mutations across skill versions. · Effort: M ·
  Status: 📦 parked

**6. R9d — rug-pull / version-diff (T3)** ✅ **SHIPPED**
- Temporal detection: a skill that was clean yesterday and dangerous today. **Approval-lockfile
  model** (`.skillsentry.lock`); capability-fingerprint diff + additive-only invariant. The
  differentiator. Merged via PR #13; 387 tests / 100%. · Effort: M · Status: ✅ done

**7. R7 — hosted registry / continuous monitoring**
- The platform play: SaaS continuous auditing. Biggest scope, biggest upside. · Effort: L
  · Status: 📦 parked

**8. R9c — JS/TS-AST opt-in dataflow**
- Interprocedural JS/TS taint tracking. ⚠️ **Needs a parser runtime dep** — direct tension
  with the zero-deps trust pillar; must be opt-in. · Effort: L · Status: 📦 parked

**9. R9e — opt-in semantic LLM tier**
- LLM "claims-vs-behaviour" judge. Breaks the deterministic/offline guarantee — **never
  default**, always opt-in. · Effort: M · Status: 📦 parked

**10. R4.1 — on-disk contributor ruleset loader**
- Community rulesets fetchable at scan time (vs compiled-in). Grows the attack surface;
  weigh carefully. · Effort: M · Status: 📦 parked

---

### Course 4 — Marketplace upkeep (cross-repo)

**11. WS4 inspect run** 🔍
- **What:** the open follow-up from the IDEATOR uplift in the marketplace repo
  (`whatbirdisthat/idea-to-production`, PRs #17/#18/#19 merged 2026-06-07).
- **Why:** the last outstanding workstream from that uplift.
- **Effort:** M · **Status:** ⏳ open (different repo)

---

## 📎 Appendix A — Status-line diagnosis (for item 1)

**Invocation is fine.** `settings.json` runs `bash ~/.claude/statusline-command.sh`, so the
missing executable bit is *not* the problem.

**Root cause — schema mismatch.** `~/.claude/statusline-command.sh` reads fields Claude
Code never sends. These all arrive **empty**, so most widgets vanish:

> `.context_window.*` · `.effort.*` · `.thinking.*` · `.rate_limits.*` · `.vim.*` ·
> `.pr.*` · `.session_name` · `.workspace.repo.*`

**The real status-line payload** exposes: `cwd`, `model.{id,display_name}`,
`workspace.{current_dir,project_dir}`, `version`, `output_style.name`, `cost.*`
(e.g. `total_duration_ms`, lines added/removed), `exceeds_200k_tokens`, `session_id`,
`transcript_path`.

**Fix plan:**
1. **Repo identity** — derive owner/name from `git remote get-url origin` instead of the
   non-existent `.workspace.repo.*`.
2. **Context bar** — there is **no token field** in the payload. Either (a) estimate from
   `transcript_path` (parse the JSONL for the latest usage), or (b) replace the bar with
   an `exceeds_200k_tokens` / `cost`-based indicator. Pick (a) for "the works".
3. **`grep -c` whitespace** — pipe through `tr -d '[:space:]'` (or `xargs`) so
   `[ "$staged" -gt 0 ]` integer tests don't break.
4. **printf injection** — replace `printf "${line1}\n${line2}\n"` with
   `printf '%s\n%s\n' "$line1" "$line2"` (the `%` in usage text / model names breaks the
   format string today).
5. **Soft deps** — degrade gracefully when `jq` / `bc` are absent.
6. Make all edits **through the statusline-setup agent** to keep script + settings in sync.

**Files:** `~/.claude/statusline-command.sh` · `~/.claude/settings.json` (`statusLine`
block already correct).

---

## 📎 Appendix B — Key references

- Spec: `doc/SPECIFICATION.ears.md` · Domain: `doc/SUBJECT_MATTER_UNDERSTANDING.md`
- Rules how-to: `doc/RULESET.md` · Gherkin: `doc/spec/features/skillsentry.feature`
- ADRs: `doc/architecture/ADR-001 … ADR-007`
- Threat taxonomy / future tiers: `doc/research/deeper-detection-plan.md`
- Governance: `.foundry/governance.md` (pr-approval, never self-merge) ·
  `DEFINITION_OF_DONE.md`

---

*Light is green, trap is clean. Pick a number and we're go for launch.* 🟢

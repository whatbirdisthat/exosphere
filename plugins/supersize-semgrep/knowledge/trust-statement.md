# supersize-semgrep — trust statement (read before enabling)

**This is a separate product from skillsentry.** It is the reference example of the threat-stack
"supersize" extension model: an opt-in plugin that genuinely expands reach by composing an EXTERNAL
tool, while the pure auditor's guarantees stay unqualified.

## What it is and is not
- It **shells out** to a `semgrep` binary you install yourself. Semgrep brings its own (large)
  dependency tree and its own trust posture — that is **yours to vet**, not skillsentry's.
- It runs **only when you ask** (`/supersize-semgrep:sast`), and is `defaultEnabled: false`.
- It degrades gracefully: with no `semgrep` on PATH it prints install guidance and exits cleanly.

## Why it cannot weaken skillsentry's pillars
- It lives entirely under `plugins/supersize-semgrep/`. **Nothing here is imported into `src/`** — the
  CI 🧱 wall job asserts the root `package.json` `dependencies` stays `{}`, so the auditor remains
  zero-dependency, never-executing, deterministic, and offline regardless of this plugin.
- Semgrep's results are presented **alongside** skillsentry's verdict, never folded into it. The
  deterministic PASS/REVIEW/BLOCK is still produced solely by the pure CLI.
- **`semgrep --config auto` fetches its rules over the network** from the Semgrep registry — another
  reason its trust model is separate from skillsentry's offline scan path.

## The honest caveat
Enabling this plugin means "skillsentry's deterministic verdict **plus** Semgrep's analysis" — two
tools, two trust models. Do not conflate them. If you need the unqualified zero-npm-dependency,
offline-scan guarantee, use skillsentry alone.

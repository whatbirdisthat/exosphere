# Security Policy

skillsentry is a security tool, so its own integrity matters. This page covers what to expect from it and
how to report a problem.

## Reporting a vulnerability

If you find a way to undermine a stated guarantee, please report it. Examples of what we most want to know
about:

- A way to make skillsentry **execute, fetch, or be influenced by** the content it audits (the cardinal
  rule is *never execute* — see the [architecture guide](./doc/guide/architecture.md)).
- A way to make a finding **silently disappear** — e.g. a `.skillsentryignore` or `.skillsentry.lock` that
  suppresses a finding *without* the report disclosing it (transparency is load-bearing).
- A bypass that defeats a detector for a class it claims to cover, or a crash/DoS on hostile input.

**How:** open a [GitHub security advisory](https://github.com/whatbirdisthat/skillsentry/security/advisories/new)
(private) if available, or email the maintainers. Please include a minimal reproducing skill/fixture and the
expected vs actual behaviour. We'll acknowledge, confirm, and credit you on a fix unless you'd prefer
otherwise.

Please **don't** open a public issue for a real bypass until there's a fix.

## What skillsentry protects against

A static, pre-run audit of agent skills across layered detection tiers (T0 pattern, T1 shell dataflow, T3
rug-pull) — see the [threat model](./doc/guide/threat-model.md) for the full picture. Every finding is
explained and framework-mapped; nothing is executed.

## What it does NOT protect against (scope limits)

Being precise here is part of the security posture. skillsentry is **not**:

- a **sandbox or runtime guard** — it informs a decision *before* you run a skill, and does nothing while
  it runs;
- a **proof of safety** — `PASS` means "no rule matched," not "safe." Novel attacks, clever natural-language
  injection, and obfuscation beyond the modelled tiers can pass;
- **complete across languages** — T1 dataflow covers shell; JS/TS interprocedural taint is deferred (it
  would need a parser dependency);
- a **git-history scanner** — secret detection is format-based and scans the working tree;
- a guard against threats **outside the skill's files** — a compromised model, a malicious MCP server you
  connect to at runtime, or social engineering are out of scope.

Treat a clean verdict as one strong input to your judgement, not a guarantee.

## How skillsentry keeps itself trustworthy

- **Never-execute is structural** — the pure core does no I/O and imports no `node:*` builtin, enforced by a
  build-time layering test.
- **Zero runtime dependencies** — no transitive supply chain of its own.
- **Deterministic & offline** — reproducible verdicts, no network in the scan path, no telemetry.
- **It audits itself** — `npm run selfaudit` runs skillsentry on its own repository in CI, and must PASS.
- **100% test coverage** against a labelled corpus of real malicious and benign skills.

## Supported versions

skillsentry is pre-1.0 (`0.x`). Fixes land on the latest release; please report against `main` or the most
recent version. See [`CHANGELOG.md`](./CHANGELOG.md).

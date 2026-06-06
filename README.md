# exosphere

the exosphere will not be televised

## skillsentry

Static supply-chain safety auditor for Claude Code skills & plugins — `npm audit` / Semgrep for
agent skills. Audits a skill / plugin (local dir or read-only git URL) and emits an explained
**PASS / REVIEW / BLOCK** verdict before you install or run it. Zero install, zero runtime
dependencies, never executes the audited artefact.

```sh
npx skillsentry <git-url | local-dir>
```

### Author self-audit + README trust-badge (`--badge`)

Run the auditor on your own repo and, on a **PASS**, earn a deterministic, offline trust badge to
paste into your README:

```sh
skillsentry . --badge
```

On PASS this prints a Markdown snippet (a self-contained inline SVG data-URI — no hosted endpoint,
no committed image) plus the raw SVG. The badge text is **"audited by skillsentry"** and is
**byte-stable** for a PASS verdict. On REVIEW or BLOCK no badge is issued — only a one-line reason,
and the normal report and exit code are preserved.

A badge cannot launder a hidden exclusion: if your PASS was earned by excluding files via
`.skillsentryignore`, the report still discloses every exclusion (count + per-pattern provenance)
alongside the badge.

### CI gating (`--ci`)

For a GitHub Action that should fail a PR on a BLOCK verdict:

```sh
skillsentry . --ci
```

`--ci` exits non-zero only on BLOCK (gating the build) and zero on PASS/REVIEW. It honours the
target's `.skillsentryignore` by default; pass `--no-ignore` to force a full scan that cannot be
weakened by a target-supplied ignore file.

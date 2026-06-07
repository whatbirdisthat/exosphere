#!/usr/bin/env node
// Deterministic STRIDE × tier coverage matrix, computed MECHANICALLY from the live probe data.
//
// This is the load-bearing honesty of the gap ritual: the coverage matrix is NOT an LLM's opinion —
// it is tabulated directly from `framework.stride` / `framework.axis` on every RuleSpec. The agentic
// gap-ritual skill runs this, then reasons over the EMPTY cells (the Elevation-of-Privilege deck) to
// propose new rules. Run from the skillsentry repo root (it imports the built ruleset from ./dist).
//
// Usage:  node plugins/threat-modeler/scripts/coverage-matrix.mjs [--json]

import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const PORTALS = { S: 'Spoofing', T: 'Tampering', R: 'Repudiation', I: 'Information disclosure', D: 'Denial of service', E: 'Elevation of privilege' };
const AXES = ['temporal', 'cognitive'];

const distUrl = pathToFileURL(join(process.cwd(), 'dist', 'core', 'ruleset.js')).href;
let ruleSpecs;
try {
  ({ ruleSpecs } = await import(distUrl));
} catch (e) {
  console.error(`Could not import the built ruleset from ${distUrl}.\nRun \`npm run build\` at the skillsentry repo root first.\n${e.message}`);
  process.exit(2);
}

// Density is a coarse, deliberately-simple HEURISTIC over the rule-tag count (≤3 THIN, 0 ABSENT) — a
// hint for "where to look next", NOT a partition. Counts are PORTAL TAGS: a rule with stride ['T','E']
// is tagged in both columns, so the columns sum to MORE than the rule total. The honest scalar is the
// rule total (printed once); per-portal we also report distinct detection classes (U20/U21).
const density = (n) => (n === 0 ? 'ABSENT' : n <= 3 ? 'THIN' : 'HEAVY');

const portalRows = Object.entries(PORTALS).map(([key, name]) => {
  const hits = ruleSpecs.filter((s) => (s.framework.stride ?? []).includes(key));
  // Derive tier keys from the data — never seed a phantom T3:0 row (U22).
  const byTier = {};
  for (const s of hits) byTier[s.tier] = (byTier[s.tier] ?? 0) + 1;
  return {
    portal: key,
    name,
    tags: hits.length,
    density: density(hits.length),
    byTier,
    classes: [...new Set(hits.map((s) => s.detectionClass))],
  };
});

const axisRows = AXES.map((axis) => {
  const hits = ruleSpecs.filter((s) => (s.framework.axis ?? []).includes(axis));
  return { axis, tags: hits.length, classes: [...new Set(hits.map((s) => s.detectionClass))] };
});

const tagTotal = portalRows.reduce((n, r) => n + r.tags, 0);
const matrix = {
  generatedFrom: distUrl,
  ruleCount: ruleSpecs.length,
  portalTagTotal: tagTotal, // > ruleCount because rules carry multiple portals (U20)
  portals: portalRows,
  axes: axisRows,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(matrix, null, 2));
} else {
  console.log(`STRIDE coverage: ${ruleSpecs.length} rules → ${tagTotal} portal-tags (rules carry 1+ portals), mechanical from rule data\n`);
  console.log('PORTAL                       tags  density  tiers           detection classes');
  for (const r of portalRows) {
    const tiers = Object.entries(r.byTier).filter(([, n]) => n > 0).map(([t, n]) => `${t}:${n}`).join(' ') || '—';
    console.log(`${r.portal} ${r.name.padEnd(24)} ${String(r.tags).padStart(3)}   ${r.density.padEnd(7)} ${tiers.padEnd(15)} ${r.classes.join(', ') || '—'}`);
  }
  console.log('\nEXTRA agentic axes (escape classic STRIDE):');
  for (const a of axisRows) console.log(`  ${a.axis.padEnd(10)} ${String(a.tags).padStart(2)}  ${a.classes.join(', ') || '—'}`);
  console.log('\ncount = portal-tags (a rule with multiple portals is counted in each); density is a coarse hint, not a partition.');
}

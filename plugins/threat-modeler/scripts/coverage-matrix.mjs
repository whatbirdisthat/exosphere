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

const density = (n) => (n === 0 ? 'ABSENT' : n <= 3 ? 'THIN' : 'HEAVY');

const portalRows = Object.entries(PORTALS).map(([key, name]) => {
  const hits = ruleSpecs.filter((s) => (s.framework.stride ?? []).includes(key));
  const byTier = { T0: 0, T1: 0, T3: 0 };
  for (const s of hits) byTier[s.tier] = (byTier[s.tier] ?? 0) + 1;
  return {
    portal: key,
    name,
    count: hits.length,
    density: density(hits.length),
    byTier,
    classes: [...new Set(hits.map((s) => s.detectionClass))],
  };
});

const axisRows = AXES.map((axis) => {
  const hits = ruleSpecs.filter((s) => (s.framework.axis ?? []).includes(axis));
  return { axis, count: hits.length, classes: [...new Set(hits.map((s) => s.detectionClass))] };
});

const matrix = { generatedFrom: distUrl, ruleCount: ruleSpecs.length, portals: portalRows, axes: axisRows };

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(matrix, null, 2));
} else {
  console.log(`STRIDE coverage over ${ruleSpecs.length} probes (mechanical, from rule data)\n`);
  console.log('PORTAL                       count  density  tiers           detection classes');
  for (const r of portalRows) {
    const tiers = Object.entries(r.byTier).filter(([, n]) => n > 0).map(([t, n]) => `${t}:${n}`).join(' ') || '—';
    console.log(`${r.portal} ${r.name.padEnd(24)} ${String(r.count).padStart(3)}   ${r.density.padEnd(7)} ${tiers.padEnd(15)} ${r.classes.join(', ') || '—'}`);
  }
  console.log('\nEXTRA agentic axes (escape classic STRIDE):');
  for (const a of axisRows) console.log(`  ${a.axis.padEnd(10)} ${String(a.count).padStart(2)}  ${a.classes.join(', ') || '—'}`);
}

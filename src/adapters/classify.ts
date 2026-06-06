import type { ComponentKind } from '../core/types.js';

/** Classify a POSIX-relative path into a ComponentKind. Pure — no IO. */
export function classify(relPath: string): ComponentKind {
  const lower = relPath.toLowerCase();
  const segments = lower.split('/');
  const base = segments[segments.length - 1] as string;

  if (base === 'skill.md') {
    return 'skill';
  }
  if (base === 'plugin.json') {
    return 'plugin-manifest';
  }
  if (base === 'settings.json') {
    return 'settings';
  }
  if (base === '.mcp.json' || base === 'mcp.json') {
    return 'mcp-config';
  }
  if (lower.includes('hooks/')) {
    return 'hook';
  }
  if (base.endsWith('.sh') || base.endsWith('.bash')) {
    return 'script';
  }
  if (lower.includes('agents/') && base.endsWith('.md')) {
    return 'agent';
  }
  return 'other';
}

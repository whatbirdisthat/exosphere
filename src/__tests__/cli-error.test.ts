import { describe, it, expect, vi, afterEach } from 'vitest';

// Pin the cli's error handling: an AuditError is rendered (exit 2), but an UNEXPECTED
// (non-AuditError) error propagates — runAudit must not swallow it.

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('runAudit error handling', () => {
  it('re-throws an unexpected (non-AuditError) error rather than swallowing it', async () => {
    vi.resetModules();
    vi.doMock('../adapters/acquire.js', () => ({
      acquire: () => {
        throw new TypeError('boom — not an AuditError');
      },
    }));
    const { runAudit } = await import('../cli.js');
    await expect(runAudit(['/some/dir'])).rejects.toThrow('boom — not an AuditError');
  });
});

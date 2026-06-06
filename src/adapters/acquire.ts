import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { InputKind } from '../core/types.js';
import { AuditError } from '../core/types.js';

const exec = promisify(execFile);

export interface Acquisition {
  readonly kind: InputKind;
  /** Absolute path to the audited root (the temp clone for git-url, the dir for local-dir). */
  readonly root: string;
  /** Remove any temporary resources created by this acquisition. Idempotent. */
  readonly cleanup: () => Promise<void>;
}

const GIT_URL = /^(?:https?:\/\/|git@|ssh:\/\/|file:\/\/)|\.git$/;

/** Classify a raw target as a git-url or local-dir (or throw AuditError). */
export async function resolveInput(target: string | undefined): Promise<InputKind> {
  if (target === undefined || target.trim() === '') {
    throw new AuditError('NO_TARGET', 'No target provided. Usage: skillsentry <git-url | local-dir>');
  }
  if (GIT_URL.test(target)) {
    return 'git-url';
  }
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      return 'local-dir';
    }
  } catch {
    // fall through to the unresolvable error below
  }
  throw new AuditError(
    'UNRESOLVABLE_INPUT',
    `Cannot resolve input: ${target} is neither an existing directory nor a recognised git URL.`,
  );
}

/** Acquire the audited source read-only. git-url → hostile shallow clone; local-dir → in place. */
export async function acquire(target: string): Promise<Acquisition> {
  const kind = await resolveInput(target);
  if (kind === 'local-dir') {
    return { kind, root: target, cleanup: async (): Promise<void> => {} };
  }
  return cloneHostile(target);
}

async function cloneHostile(url: string): Promise<Acquisition> {
  const dir = await mkdtemp(join(tmpdir(), 'skillsentry-clone-'));
  let cleaned = false;
  const cleanup = async (): Promise<void> => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    await rm(dir, { recursive: true, force: true });
  };
  try {
    // Hostile-source invariant: shallow, hooks disabled, no submodules, no LFS smudge,
    // no install/build step. Never runs audited content.
    await exec(
      'git',
      [
        '-c',
        'core.hooksPath=/dev/null',
        '-c',
        'advice.detachedHead=false',
        'clone',
        '--depth',
        '1',
        '--no-checkout',
        url,
        dir,
      ],
      { env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1' } },
    );
    // Check out the worktree with hooks still disabled (no smudge/hook execution).
    await exec(
      'git',
      ['-c', 'core.hooksPath=/dev/null', '-C', dir, 'checkout'],
      { env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' } },
    );
    return { kind: 'git-url', root: dir, cleanup };
  } catch (err) {
    await cleanup();
    // `git` failures from promisified execFile are always Error objects; the non-Error
    // arm is unreachable defence-in-depth, excluded from coverage with reviewer sign-off.
    /* v8 ignore next */
    const detail = err instanceof Error ? err.message : `${String(err)}`;
    throw new AuditError('ACQUISITION_FAILED', `Acquisition failed: could not clone ${url}. ${detail}`);
  }
}

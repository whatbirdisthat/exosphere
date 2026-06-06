#!/usr/bin/env node
import { runAudit } from './cli.js';

const result = await runAudit(process.argv.slice(2));
process.stdout.write(result.stdout.endsWith('\n') ? result.stdout : result.stdout + '\n');
process.exit(result.exitCode);

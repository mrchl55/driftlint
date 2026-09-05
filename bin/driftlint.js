#!/usr/bin/env node
'use strict';

const path = require('path');
const { run } = require('../src/index');

const args = process.argv.slice(2);
const json = args.includes('--json');
const help = args.includes('--help') || args.includes('-h');
const targetArg = args.find((a) => !a.startsWith('-'));

if (help) {
  console.log('usage: driftlint [dir] [--json]');
  console.log('checks license field vs LICENSE file, and phantom/unused deps');
  process.exit(0);
}

const target = path.resolve(targetArg || '.');
const result = run(target);

const allFindings = [
  ...result.license,
  ...result.dependencyLicenses,
  ...result.dependencies
];
const bySeverity = { error: 0, warning: 0, info: 0, ok: 0 };

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const f of allFindings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    const prefix = { error: '[x]', warning: '[!]', info: '[i]', ok: '[ok]' }[f.severity] || '[?]';
    const pkg = f.package && f.package !== '.' ? `${f.package}: ` : '';
    console.log(`${prefix} ${pkg}${f.message}`);
  }
  console.log('');
  console.log(`driftlint: ${bySeverity.error} error(s), ${bySeverity.warning} warning(s)`);
}

if (!json) {
  process.exitCode = bySeverity.error > 0 ? 1 : 0;
} else {
  const errors = allFindings.filter((f) => f.severity === 'error');
  process.exitCode = errors.length > 0 ? 1 : 0;
}

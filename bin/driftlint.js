#!/usr/bin/env node
'use strict';

const path = require('path');
const { run } = require('../src/index');

const target = path.resolve(process.argv[2] || '.');
const result = run(target);

const allFindings = [...result.license, ...result.dependencies];
const bySeverity = { error: 0, warning: 0, info: 0, ok: 0 };

for (const f of allFindings) {
  bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  const prefix = { error: '[x]', warning: '[!]', info: '[i]', ok: '[ok]' }[f.severity] || '[?]';
  console.log(`${prefix} ${f.message}`);
}

console.log('');
console.log(`driftlint: ${bySeverity.error} error(s), ${bySeverity.warning} warning(s)`);
console.log(JSON.stringify(result, null, 2));

process.exitCode = bySeverity.error > 0 ? 1 : 0;

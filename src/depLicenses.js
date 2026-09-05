'use strict';

const fs = require('fs');
const { checkOnePackage } = require('./licenseCheck');
const { listInstalledPackages } = require('./lockfile');

function checkDependencyLicenses(pkgDir) {
  const { kind, deps, unsupported } = listInstalledPackages(pkgDir);
  const findings = [];

  if (unsupported) {
    findings.push({
      severity: 'info',
      message: `${kind} lockfile found, parser not implemented yet (npm only for now)`
    });
    return findings;
  }

  if (!kind) {
    findings.push({
      severity: 'info',
      message: 'no lockfile found, skip dependency license scan (need package-lock.json)'
    });
    return findings;
  }

  if (deps.length === 0) {
    findings.push({
      severity: 'info',
      message: 'lockfile has no packages to check'
    });
    return findings;
  }

  let checked = 0;
  let missingOnDisk = 0;

  for (const dep of deps) {
    if (!fs.existsSync(dep.dir)) {
      missingOnDisk += 1;
      continue;
    }
    checked += 1;
    const one = checkOnePackage(dep.dir, dep.name);
    for (const f of one) {
      if (f.severity === 'ok') continue;
      findings.push(f);
    }
  }

  if (missingOnDisk > 0) {
    findings.push({
      severity: 'warning',
      message: `${missingOnDisk} lockfile entries not present on disk (run npm install?)`
    });
  }

  if (findings.filter((f) => f.severity === 'error').length === 0) {
    findings.push({
      severity: 'ok',
      message: `checked ${checked} installed packages, no license drift`
    });
  }

  return findings;
}

module.exports = { checkDependencyLicenses };

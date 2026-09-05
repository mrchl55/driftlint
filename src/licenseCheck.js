'use strict';

const fs = require('fs');
const path = require('path');

// Rough, non-exhaustive SPDX-id -> text fingerprints. Good enough to catch
// obvious drift (nothing shipped, or a clearly different license text than
// declared). Not a substitute for a real SPDX matcher, see README.
const FINGERPRINTS = {
  MIT: [/permission is hereby granted, free of charge/i, /mit license/i],
  'Apache-2.0': [/apache license/i, /version 2\.0/i],
  ISC: [/isc license/i, /permission to use, copy, modify/i],
  'BSD-2-Clause': [/redistribution and use in source and binary forms/i],
  'BSD-3-Clause': [/redistribution and use in source and binary forms/i],
  'GPL-3.0': [/gnu general public license/i, /version 3/i],
  'GPL-2.0': [/gnu general public license/i, /version 2/i],
  'MPL-2.0': [/mozilla public license/i],
  'LGPL-3.0': [/gnu lesser general public license/i]
};

const LICENSE_FILENAMES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'COPYING'];

function findLicenseFile(dir) {
  for (const name of LICENSE_FILENAMES) {
    const p = path.join(dir, name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

function normalizeDeclared(declared) {
  if (!declared) return null;
  if (typeof declared === 'object' && declared.type) return declared.type;
  return String(declared).split(' ')[0];
}

function checkOnePackage(pkgDir, label) {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  const findings = [];

  if (!fs.existsSync(pkgJsonPath)) {
    findings.push({
      severity: 'error',
      package: label,
      message: 'no package.json found in ' + pkgDir
    });
    return findings;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const declared = normalizeDeclared(
    pkg.license || (pkg.licenses && pkg.licenses[0] && pkg.licenses[0].type) || null
  );
  const licenseFile = findLicenseFile(pkgDir);
  const where = label || pkg.name || path.basename(pkgDir);

  if (!declared && !licenseFile) {
    findings.push({
      severity: 'warning',
      package: where,
      message: 'no license field in package.json and no LICENSE file found'
    });
    return findings;
  }

  if (declared && !licenseFile) {
    findings.push({
      severity: 'error',
      package: where,
      message: `package.json declares "${declared}" but no LICENSE file is shipped alongside it`
    });
    return findings;
  }

  if (!declared && licenseFile) {
    findings.push({
      severity: 'warning',
      package: where,
      message: `a LICENSE file exists (${path.basename(licenseFile)}) but package.json has no "license" field`
    });
    return findings;
  }

  const text = fs.readFileSync(licenseFile, 'utf8');
  const patterns = FINGERPRINTS[declared];

  if (!patterns) {
    findings.push({
      severity: 'info',
      package: where,
      message: `declared license "${declared}" is not in driftlint's fingerprint list yet, skipping text match (checked file: ${path.basename(licenseFile)})`
    });
    return findings;
  }

  const matches = patterns.some((re) => re.test(text));
  if (!matches) {
    findings.push({
      severity: 'error',
      package: where,
      message: `package.json declares "${declared}" but ${path.basename(licenseFile)} does not look like that license's text`
    });
  } else {
    findings.push({
      severity: 'ok',
      package: where,
      message: `declared "${declared}" matches ${path.basename(licenseFile)}`
    });
  }

  return findings;
}

function checkLicense(pkgDir) {
  return checkOnePackage(pkgDir, '.');
}

module.exports = { checkLicense, checkOnePackage, findLicenseFile, FINGERPRINTS };

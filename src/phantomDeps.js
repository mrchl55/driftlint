'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');

const BUILTINS = new Set(Module.builtinModules);
const SCAN_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

// Matches require('x'), import ... from 'x', dynamic import('x'). This is a
// simple regex scan, not a full AST parse, monorepo/workspace-aware
// resolution is not built yet, see README Status.
const IMPORT_RE = /(?:require\(\s*['"]([^'"]+)['"]\s*\)|import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\))/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function packageNameFromSpecifier(spec) {
  if (spec.startsWith('.') || spec.startsWith('/')) return null;
  const parts = spec.split('/');
  if (spec.startsWith('@')) return parts.slice(0, 2).join('/');
  return parts[0];
}

function findImportedPackages(rootDir) {
  const imported = new Set();
  for (const file of walk(rootDir)) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = IMPORT_RE.exec(content)) !== null) {
      const spec = match[1] || match[2] || match[3];
      if (!spec) continue;
      const pkgName = packageNameFromSpecifier(spec);
      if (pkgName && !BUILTINS.has(pkgName) && !BUILTINS.has(pkgName.replace(/^node:/, ''))) {
        imported.add(pkgName);
      }
    }
  }
  return imported;
}

function checkPhantomDeps(pkgDir) {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  const findings = [];
  if (!fs.existsSync(pkgJsonPath)) {
    findings.push({ severity: 'error', message: 'no package.json found in ' + pkgDir });
    return findings;
  }

const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const declared = new Set(
    Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}))
    );
  const imported = findImportedPackages(pkgDir);

const phantom = [...imported].filter((name) => !declared.has(name));
  const unused = [...declared].filter((name) => !imported.has(name));

for (const name of phantom) {
  findings.push({
    severity: 'error',
    message: `"${name}" is imported in source but not listed in package.json (phantom dependency)`
  });
}
  for (const name of unused) {
    findings.push({
      severity: 'warning',
      message: `"${name}" is declared in package.json but never imported anywhere in scanned source`
    });
  }
  if (phantom.length === 0 && unused.length === 0) {
    findings.push({ severity: 'ok', message: 'no phantom or unused dependencies found' });
  }

return findings;
}

module.exports = { checkPhantomDeps, findImportedPackages, packageNameFromSpecifier };

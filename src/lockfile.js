'use strict';

const fs = require('fs');
const path = require('path');

function detectLockfile(pkgDir) {
  if (fs.existsSync(path.join(pkgDir, 'package-lock.json'))) return 'npm';
  if (fs.existsSync(path.join(pkgDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(pkgDir, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(pkgDir, 'bun.lock')) || fs.existsSync(path.join(pkgDir, 'bun.lockb'))) {
    return 'bun';
  }
  return null;
}

function nameFromNodeModulesPath(lockKey) {
  const idx = lockKey.lastIndexOf('node_modules/');
  if (idx === -1) return null;
  return lockKey.slice(idx + 'node_modules/'.length);
}

function readNpmLock(pkgDir) {
  const lockPath = path.join(pkgDir, 'package-lock.json');
  if (!fs.existsSync(lockPath)) return [];

  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const deps = [];

  if (lock.packages && typeof lock.packages === 'object') {
    for (const [key, meta] of Object.entries(lock.packages)) {
      if (!key) continue;
      const name = nameFromNodeModulesPath(key);
      if (!name) continue;
      deps.push({
        name,
        version: meta.version || null,
        declaredLicense: meta.license || null,
        dir: path.join(pkgDir, key)
      });
    }
    return deps;
  }

  const legacy = { ...(lock.dependencies || {}) };
  for (const [name, meta] of Object.entries(legacy)) {
    deps.push({
      name,
      version: meta.version || null,
      declaredLicense: null,
      dir: path.join(pkgDir, 'node_modules', name)
    });
  }
  return deps;
}

function listInstalledPackages(pkgDir) {
  const kind = detectLockfile(pkgDir);
  if (kind === 'npm') return { kind, deps: readNpmLock(pkgDir) };
  if (kind === 'pnpm' || kind === 'yarn' || kind === 'bun') {
    return { kind, deps: [], unsupported: true };
  }
  return { kind: null, deps: [] };
}

module.exports = { detectLockfile, readNpmLock, listInstalledPackages, nameFromNodeModulesPath };

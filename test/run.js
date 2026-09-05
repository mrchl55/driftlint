'use strict';

const assert = require('assert');
const path = require('path');
const { checkLicense } = require('../src/licenseCheck');
const { checkPhantomDeps } = require('../src/phantomDeps');
const { checkDependencyLicenses } = require('../src/depLicenses');
const { nameFromNodeModulesPath } = require('../src/lockfile');

const fx = (name) => path.join(__dirname, 'fixtures', name);

const bad = checkLicense(fx('mismatch'));
assert(
  bad.some((f) => f.severity === 'error' && /does not look like/.test(f.message)),
  'expected license mismatch'
);

const good = checkLicense(fx('ok-pkg'));
assert(
  good.some((f) => f.severity === 'ok'),
  'expected mit match'
);

const ph = checkPhantomDeps(fx('app'));
assert(
  ph.some((f) => f.severity === 'error' && /lodash/.test(f.message)),
  'expected phantom lodash'
);
assert(
  ph.some((f) => f.severity === 'warning' && /left-pad/.test(f.message)),
  'expected unused left-pad'
);

assert.strictEqual(nameFromNodeModulesPath('node_modules/foo'), 'foo');
assert.strictEqual(nameFromNodeModulesPath('node_modules/@scope/foo'), '@scope/foo');
assert.strictEqual(
  nameFromNodeModulesPath('node_modules/a/node_modules/b'),
  'b'
);

const dep = checkDependencyLicenses(fx('locked'));
assert(
  dep.some((f) => f.package === 'fake-mit' && f.severity === 'error'),
  'expected fake-mit license drift'
);

console.log('ok');

'use strict';

const { checkLicense } = require('./licenseCheck');
const { checkPhantomDeps } = require('./phantomDeps');
const { checkDependencyLicenses } = require('./depLicenses');

function run(targetDir) {
  const license = checkLicense(targetDir);
  const dependencyLicenses = checkDependencyLicenses(targetDir);
  const deps = checkPhantomDeps(targetDir);
  return { license, dependencyLicenses, dependencies: deps };
}

module.exports = { run };

'use strict';

const { checkLicense } = require('./licenseCheck');
const { checkPhantomDeps } = require('./phantomDeps');

function run(targetDir) {
  const license = checkLicense(targetDir);
  const deps = checkPhantomDeps(targetDir);
  return { license, dependencies: deps };
}

module.exports = { run };

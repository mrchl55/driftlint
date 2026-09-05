# driftlint

CLI that checks whether JS/Node dependency metadata is actually true.

It does two things today:

1. Compare a package's `license` field to the LICENSE file sitting next to it. Runs on the project itself and on packages from `package-lock.json` if they are installed.
2. Find phantom dependencies (imported but not in `package.json`) and unused ones (declared but never imported).

It does not generate an SBOM. The report is meant to sit next to Syft / Trivy / cdxgen, not replace them.

## usage

```
npx driftlint
npx driftlint ./some/project
npx driftlint --json
```

Exit code is 1 when there is at least one error.

## status

Early. Works on flat npm projects.

Not done yet:

- pnpm / yarn lockfile parsers
- monorepo / workspace hoisting
- real SPDX matching (fingerprints only, so unknown ids are skipped)
- AST-based import scan (regex for now)

## license

MIT

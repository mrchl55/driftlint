# driftlint

License & dependency provenance verifier for JavaScript/Node.

## What it does

Most supply-chain tools (Syft, Trivy, cdxgen, npm sbom) generate SBOMs from your lockfile and take the declared metadata at face value. driftlint checks whether that metadata is actually true: whether the license field in package.json matches the LICENSE file actually shipped inside the package, whether dependencies imported in your code are missing from package.json ("phantom dependencies"), and whether declared dependencies are never actually used anywhere in the codebase.

Supports npm, pnpm and yarn lockfiles, including monorepo and workspace setups. Output is a machine-readable report (JSON plus a human-readable summary) designed to feed into existing SBOM and compliance pipelines rather than replace them.

## Status

Early stage. This project is being developed as part of an application for an NLnet Foundation grant (CodeSupply fund). Not yet functional -- watch this repo for progress.

## Why

License and provenance drift is invisible to tools that only read the lockfile and trust it. That gap matters for EU Cyber Resilience Act supply-chain documentation obligations. driftlint does not replace SBOM generation, it verifies the inputs those tools rely on.

## License

MIT

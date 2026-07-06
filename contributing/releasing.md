# Releasing

How a new version of the client is built and published.

## Versioning with changesets

Changes that should end up in a release need a changeset. Run `pnpm changeset` and describe the change. The CD workflow collects pending changesets on every push to `main` and creates or updates a release pull request named `WIP: Release x.x.x`. Merging that pull request bumps the version and removes the consumed changesets.

## What CD does

The [CD workflow](../.github/workflows/cd.yml) runs on every push to `main` in two jobs:

1. `changesets` runs the same checks as CI on a single Linux runner. It then creates or updates the release pull request. Only one runner does this to avoid conflicting pushes.
2. `release` only runs when there are no pending changesets left, which is the push created by merging the release pull request. It builds the app on every supported platform. Each runner uploads its installers and update metadata to a shared draft GitHub Release via electron-builder, configured in [electron-builder.yml](../electron-builder.yml).

The draft release is not public. Review the attached artifacts and publish it manually on GitHub to complete the release.

Unlike Core, which publishes its library to npm from a single runner, the client needs one build per platform. That is why `release` runs on a matrix while `changesets` does not.

## Toolchain versions

CI and CD read the Node.js version from [.node-version](../.node-version) and the pnpm version from the `packageManager` field in [package.json](../package.json). Both are kept in sync with Core. Update those two files to change the toolchain, not the workflows.

## Known limitation

The macOS artifact names include the architecture, so the installers from the Intel and Apple Silicon runners coexist in the release. But both runners also generate a `latest-mac.yml` with a fixed name, and the second upload overwrites the first. This breaks auto-updates for one of the two architectures. It does not matter yet because electron-updater is not wired up, but it must be solved before it is.

The plan for that point is to build both macOS architectures in a single electron-builder run on the Apple Silicon runner (`--mac --x64 --arm64`) and remove the Intel runner from the CD matrix. Removing it is required, otherwise its uploads would collide with the cross built artifacts again. This works because `latest-mac.yml` is written once per electron-builder run, not once per artifact. A single run covering both architectures lists both builds in one file, and electron-updater picks the right one per architecture. The app code itself is architecture independent, electron-builder just packages it into the prebuilt Electron binary of each target architecture.

Two things to verify when doing the switch:

- dugite downloads its bundled git binaries for the current machine's architecture at install time. The cross built Intel app must contain the Intel git binaries, not the ARM ones, or it will not work on Intel Macs. dugite can be forced to download a different architecture with the `npm_config_arch` environment variable, which is how GitHub Desktop cross packages.
- The cross built Intel artifact is never executed on Intel hardware by any runner, so test it manually on an Intel Mac once.

A single universal binary (`--universal`) was considered instead. It avoids the metadata problem but roughly doubles the download size and requires every bundled executable, including git from dugite, to be universal. That is why two separate builds are the plan.

The Intel runner in CI stays as long as GitHub offers it (planned until fall 2027) to keep verifying that install, checks and build work on Intel hardware. After that date cross building from the Apple Silicon runner is the only way to keep shipping Intel builds at all.

---
'@elek-io/client': patch
---

Rework the release pipeline and harden CI/CD.

CD now produces a single draft GitHub Release per version with the changelog as its body, replacing the several empty drafts a release used to create. A new prepare-release job creates that one draft up front, and the build only runs for a genuinely new version, so an ordinary changeset-free push to main no longer rebuilds or overwrites an existing release. macOS publishes per-architecture update channels (latest-x64-mac.yml and latest-arm64-mac.yml) so the Intel and Apple Silicon runners no longer overwrite each other's update metadata.

CI cancels superseded runs, uses a read-only token, and runs on reopened pull requests. Dependabot moves to weekly grouped updates and now also updates GitHub Actions. Workflow permissions are scoped per job, a combined "pnpm check" script replaces the duplicated lint, type and format commands, the CD jobs are renamed to say what they do (prepare-release and build-and-upload), and the contributor docs are updated to match.

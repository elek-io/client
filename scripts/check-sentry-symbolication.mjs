// Drift guard for Core source map symbolication (see contributing/error-handling.md).
//
// Resolving a forwarded CoreError frame to Core's TypeScript relies on three
// strings staying in lockstep across three files:
//
//   1. the canonical frame path        src/shared/sentryCoreError.ts (CORE_NODE_BUILD)
//   2. the upload url-prefix + dir      .github/workflows/cd.yml
//   3. the Sentry release name          electron.vite.config.ts and .github/workflows/cd.yml
//
// If any drifts, symbolication silently stops working. This makes that a red
// `pnpm check` instead. CORE_NODE_BUILD is the single source of truth: the
// url-prefix, upload dir and artifact URL are all derived from it, so the guard
// checks the other files contain those derived strings. It also confirms Core
// actually ships its node build at that path, catching a Core version that
// changes its build layout.
//
// The guard fails if it cannot even locate a value, so a refactor that renames
// an anchor trips it rather than passing silently.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(resolve(repoRoot, rel), 'utf8');

const errors = [];
const fail = (msg) => errors.push(msg);

/** Extract a single capture group or record a failure and return null. */
function extract(text, regex, what, file) {
  const match = regex.exec(text);
  if (match === null) {
    fail(`Could not find ${what} in ${file}. The guard needs updating.`);
    return null;
  }
  return match[1];
}

const sentryCoreError = read('src/shared/sentryCoreError.ts');
const viteConfig = read('electron.vite.config.ts');
const cd = read('.github/workflows/cd.yml');

// 1. Source of truth: the Core node build path from sentryCoreError.ts
const coreNodeBuild = extract(
  sentryCoreError,
  /const CORE_NODE_BUILD = '([^']+)';/,
  'CORE_NODE_BUILD',
  'src/shared/sentryCoreError.ts'
);

if (coreNodeBuild !== null) {
  // The artifact URL must be exactly app:/// + the build path
  if (
    !sentryCoreError.includes(
      'const CORE_NODE_ARTIFACT = `app:///${CORE_NODE_BUILD}`;'
    )
  ) {
    fail(
      'src/shared/sentryCoreError.ts: CORE_NODE_ARTIFACT must be `app:///${CORE_NODE_BUILD}`. ' +
        'The app:/// scheme is what maps to the ~/ upload artifact.'
    );
  }

  const coreDir = dirname(coreNodeBuild); // node_modules/@elek-io/core/dist/node
  const expectedUrlPrefix = `~/${coreDir}`; // uploaded artifact = prefix + /index.node.mjs

  // 2. CD must upload with that url-prefix and that directory
  if (!cd.includes(`--url-prefix '${expectedUrlPrefix}'`)) {
    fail(
      `.github/workflows/cd.yml: expected --url-prefix '${expectedUrlPrefix}' ` +
        '(derived from CORE_NODE_BUILD). The uploaded artifact name would no longer ' +
        'match the app:/// path in sentryCoreError.ts.'
    );
  }
  // The upload target dir is the Core build dir (its index.node.mjs is the artifact)
  if (!new RegExp(`(^|\\s)${coreDir}(\\s|$)`, 'm').test(cd)) {
    fail(
      `.github/workflows/cd.yml: expected the upload to target ${coreDir} ` +
        '(the directory holding index.node.mjs).'
    );
  }

  // 4. Core must actually ship its node build at that path
  if (!existsSync(resolve(repoRoot, coreNodeBuild))) {
    fail(
      `${coreNodeBuild} does not exist. @elek-io/core may have changed its build ` +
        'layout, which would break the path normalization. Run pnpm install, or ' +
        'update CORE_NODE_BUILD and the CD upload to the new path.'
    );
  }
}

// 3. The release name must use the same namespace in the config and in CD
const configReleasePrefix = extract(
  viteConfig,
  /const sentryRelease = `([^$`]*)\$\{/,
  'the sentryRelease template',
  'electron.vite.config.ts'
);
const cdReleasePrefix = extract(
  cd,
  /RELEASE="([^$"]*)\$\(/,
  'the RELEASE assignment',
  '.github/workflows/cd.yml'
);
if (
  configReleasePrefix !== null &&
  cdReleasePrefix !== null &&
  configReleasePrefix !== cdReleasePrefix
) {
  fail(
    `Release name mismatch: electron.vite.config.ts uses "${configReleasePrefix}<version>" ` +
      `but .github/workflows/cd.yml uploads to "${cdReleasePrefix}<version>". ` +
      'Events would be tagged with a release the Core map was not uploaded to.'
  );
}

if (errors.length > 0) {
  console.error('Sentry symbolication drift check failed:\n');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error(
    '\nSee contributing/error-handling.md (Symbolicating the Core frames to TypeScript).'
  );
  process.exit(1);
}

console.log('Sentry symbolication strings are in sync.');

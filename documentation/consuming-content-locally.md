# Consuming content locally

Consuming created content is essential to actually benefit from a CMS. elek.io Client and Core therefore provide multiple ways of doing so.

**Use Cases**:

- Static site generators (Next.js, Gatsby, Hugo)
- Custom build tools
- Really anything you can think of

## Export Project data to JSON file

elek.io Core can be installed globally via your package manager of choice:

```bash
npm install -g @elek-io/core
```

With the included CLI you can then run one of the following commands inside e.g. your websites source code directory:

```bash
# Export all Projects content to .elek.io/projects.json
elek export

# Export one Project to .elek.io/projects.json
elek export ./.elek.io [projectId]

# Export one Project to .elek.io/project-${id}.json
elek export ./.elek.io [projectId]

# Export multiple Projects into separate .elek.io/project-${id}.json files
elek export ./.elek.io [projectId1,projectId2] --separate
```

Add the `-w` or `--watch` option to any of these commands to automatically re-export whenever a Project changes.

Then use the content inside these JSON file(s) to populate your website or application:

```typescript
import * as projects from './.elek.io/projects.json' with { type: 'json' };

const entries = projects['...'].collections['...'].entries;

// Use the Entries
```

## Local API

Enable the local API in your User Profile of elek.io Client → "Enable Local API Server". Then you can visit `http://localhost:31310/` (or your specified port) to view a rendered OpenAPI documentation and execute queries.

### Generate TS/JS API Client

Of course you could write an API Client yourself but for TypeScript / JavaScript applications we provide a generated API Client with validation.

Install elek.io Core globally via your package manager of choice:

```bash
npm install -g @elek-io/core
```

Then use the CLI to generate a TS or JS API Client with one of the following commands:

```bash
# Generate TS API Client with default options in ./.elek.io/client.ts
elek generate:client

# Generate JS API Client with ESM and target ES2020 in ./.elek.io/client.ts
elek generate:client ./.elek.io js esm es2020
```

Then import and use the generated API Client like:

```typescript
import { apiClient } from './.elek.io/client.js';

const client = apiClient({
  baseUrl: 'http://localhost:31310',
  apiKey: 'abc123', // Not used for now
});

const entries =
  await client.content.v1.projects['...'].collections['...'].entries.list();
```

### Generate API Client for other languages

For languages other than TS/JS you can either write an API Client yourself, or use an OpenAPI generator like:

```bash
npx openapi-generator-cli generate \
  -i http://localhost:31310/openapi.json \
  -g java \
  -o ./.elek.io/client
```

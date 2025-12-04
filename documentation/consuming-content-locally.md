# Consuming Content Locally

## Overview

Once you've created content in elek.io, you probably want to consume it in your applications. elek.io Client and Core provide multiple ways to access your Project data from external applications.

**Common Use Cases**:

- **Static Site Generators**: Fetch content for Next.js, Gatsby, Astro, Hugo, etc.
- **Custom Build Tools**: Integrate content into your CI/CD pipeline
- **Mobile Apps**: Access content via the local API from React Native, Flutter, etc.
- **Desktop Applications**: Read content from other Electron or native apps
- **Documentation Sites**: Generate docs from your elek.io content
- **Data Analysis**: Export content for analytics or reporting tools

## Export Project Data to JSON Files

### Installation

First, install elek.io Core globally via your package manager:

```bash
npm install -g @elek-io/core
```

### Export Commands

The built-in CLI allows you to export Project data to JSON files. Run these commands e.g. inside your website's source code directory (or any directory where you want the exported data). Alternatively integrate them into your build scripts or CI/CD pipelines to ensure your application always has the latest content:

```bash
# Export all Projects content to .elek.io/projects.json
elek export

# Export one Project by ID to .elek.io/projects.json
elek export ./.elek.io 467e57ea-e04a-44a7-b34b-684ed3ba6f49

# Export one Project to .elek.io/project-${id}.json
elek export ./.elek.io 467e57ea-e04a-44a7-b34b-684ed3ba6f49

# Export multiple Projects into separate .elek.io/project-${id}.json files
elek export ./.elek.io 467e57ea-e04a-44a7-b34b-684ed3ba6f49,bcffed17-4946-4336-b420-3974d9c94a43 --separate
```

> [!NOTE]
> Replace `467e57ea-e04a-44a7-b34b-684ed3ba6f49` with your actual Project ID. You can find Project IDs in the elek.io Client UI or in your Project's `.elek.io` directory.

### Watch Mode

Add the `-w` or `--watch` flag to automatically re-export whenever a Project changes:

```bash
elek export ./.elek.io 467e57ea-e04a-44a7-b34b-684ed3ba6f49 --watch
```

This is particularly useful during development when you're actively updating content.

### Using Exported JSON

Once exported, you can import and use the JSON data in your application:

```typescript
import * as projects from './.elek.io/projects.json' with { type: 'json' };

// Access a specific Project's Collections
const myProject = projects['467e57ea-e04a-44a7-b34b-684ed3ba6f49'];
const blogPosts = myProject.collections['blog-posts'].entries;

// Use the Entries in your app
blogPosts.forEach((post) => {
  console.log(post.title, post.content);
});
```

## Local API

elek.io Core also provides a local REST API server that runs on your machine, allowing applications to query your elek.io Projects for content.

### Enabling the Local API

**Via elek.io Client**

1. Open elek.io Client
2. Navigate to **User Profile** (top-right menu)
3. Scroll to the **Local API** section
4. Toggle **"Enable Local API Server"**
5. Optionally change the port (default: `31310`)
6. Click **Save**

**Via elek.io Core**

You can also start the local API server directly using elek.io Core CLI:

```bash
elek api:start 31310
```

Or programmatically in your Node.js application:

```typescript
import ElekIoCore from '@elek-io/core';

const core = new ElekIoCore();
core.api.start(31310);
```

Once enabled, you can visit `http://localhost:31310/` (or your specified port) to view the OpenAPI documentation and execute test queries.

> [!WARNING]
> Make sure the port you choose is not already in use by another application. If the API fails to start, try a different port.

### Generate TypeScript/JavaScript API Client

While you can write an API client manually, elek.io provides a code generator that creates a type-safe client with built-in validation for TypeScript and JavaScript applications.

#### Generate the Client

If you haven't already, install elek.io Core globally:

```bash
npm install -g @elek-io/core
```

Then generate the API client:

```bash
# Generate TypeScript API Client with default options in ./.elek.io/client.ts
elek generate:client

# Generate JavaScript API Client with ESM and target ES2020
elek generate:client ./.elek.io js esm es2020
```

#### Using the Generated Client

Import and use the generated API client in your application:

```typescript
import { apiClient } from './.elek.io/client.js';

const client = apiClient({
  baseUrl: 'http://localhost:31310',
  apiKey: 'abc123', // Not currently used, reserved for future authentication
});

// Fetch all Entries from a specific Collection
const blogPosts =
  await client.content.v1.projects[
    '467e57ea-e04a-44a7-b34b-684ed3ba6f49'
  ].collections['blog-posts'].entries.list();

// Access individual Entries
blogPosts.forEach((post) => {
  console.log(post.title, post.publishedAt);
});
```

### Generate API Client for Other Languages

For languages other than TypeScript/JavaScript, you can use any OpenAPI-compatible code generator. The local API exposes its full schema at `/openapi.json`.

#### Example: Generate a Java Client

```bash
npx openapi-generator-cli generate \
  -i http://localhost:31310/openapi.json \
  -g java \
  -o ./.elek.io/client
```

#### Example: Generate a Python Client

```bash
npx openapi-generator-cli generate \
  -i http://localhost:31310/openapi.json \
  -g python \
  -o ./.elek.io/client
```

> [!NOTE]
> Make sure the local API is running before generating the client, as the generator needs to fetch the OpenAPI schema.

For more generators and options, see the [OpenAPI Generator documentation](https://openapi-generator.tech/docs/generators).

## Troubleshooting

### Port Already in Use

If you see an error that the port is already in use:

1. Check which application is using the port: `lsof -i :31310` (macOS/Linux) or `netstat -ano | findstr :31310` (Windows)
2. Either stop that application or choose a different port

### API Not Starting

If the local API fails to start:

1. Check the elek.io Client logs for error messages
2. Ensure you have the latest version of elek.io Client and Core
3. Try restarting elek.io Client
4. Verify no firewall is blocking the port

### Generated Client Not Working

If the generated API client has type errors or runtime issues:

1. Regenerate the client with the latest schema
2. Ensure the local API is running and accessible
3. Check that your Project IDs and Collection IDs are correct

---

**Last Updated:** 2025-11-18

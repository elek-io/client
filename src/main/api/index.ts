import type ElekIoCore from '@elek-io/core';
import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { ProjectsApi } from './projects.js';

export class Api {
  private api: OpenAPIHono;
  private core: ElekIoCore;

  constructor(core: ElekIoCore) {
    this.api = new OpenAPIHono();
    this.core = core;

    this.api.use(
      cors({
        origin: '*',
      })
    );

    this.registerRoutes();

    this.api.doc('/doc', {
      openapi: '3.0.0',
      info: {
        version: '0.1.0',
        title: 'elek.io Project API',
        description: 'This API allows reading data from elek.io Projects',
      },
      servers: [
        {
          url: 'http://localhost:{port}/v1/{branch}',
          description: 'Local development API',
          variables: {
            port: {
              default: '31310',
              description:
                'The port specified in elek.io Clients user configuration',
            },
            branch: {
              default: 'development',
              enum: ['development', 'preview', 'production'],
              description: 'The branch to read data from',
            },
          },
        },
        {
          url: 'https://api.elek.io/v1/{branch}',
          description: 'Public preview and production API',
          variables: {
            branch: {
              default: 'production',
              enum: ['preview', 'production'],
              description: 'The branch to read data from',
            },
          },
        },
      ],
      tags: [
        {
          name: 'Projects',
          description: 'Retrieve information about Projects',
          externalDocs: { url: 'https://elek.io/docs/projects' },
        },
        {
          name: 'Collections',
          description: 'Retrieve information about Collections',
          externalDocs: { url: 'https://elek.io/docs/collections' },
        },
        {
          name: 'Entries',
          description: 'Retrieve information about Entries',
          externalDocs: { url: 'https://elek.io/docs/entries' },
        },
        {
          name: 'Assets',
          description: 'Retrieve information about Assets',
          externalDocs: { url: 'https://elek.io/docs/assets' },
        },
      ],
    });

    this.api.get('/ui', swaggerUI({ url: '/doc' }));

    serve({
      fetch: this.api.fetch,
      port: 8787,
    });
  }

  private registerRoutes(): void {
    const projects = new ProjectsApi(this.core);
    this.api.route('/projects', projects.api);
  }
}

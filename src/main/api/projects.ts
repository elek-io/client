import type ElekIoCore from '@elek-io/core';
import {
  listProjectsSchema,
  projectSchema,
  readProjectSchema,
  uuid,
} from '@elek-io/core';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

export class ProjectsApi {
  public readonly api: OpenAPIHono;
  private core: ElekIoCore;

  constructor(core: ElekIoCore) {
    this.api = new OpenAPIHono();
    this.core = core;

    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.api.openapi(listProjectsRoute, async (context) => {
      const { limit, offset } = context.req.valid('query');

      const projects = await this.core.projects.list({ limit, offset });

      return context.json(projects, 200);
    });

    this.api.openapi(readProjectRoute, async (context) => {
      const { id } = context.req.valid('param');

      const project = await this.core.projects.read({ id });

      return context.json(project, 200);
    });

    this.api.openapi(countProjectsRoute, async (context) => {
      const count = await this.core.projects.count();

      return context.json(count, 200);
    });
  }
}

const ProjectSchema = z.object(projectSchema.shape).openapi('Project');

function paginatedListOf<T extends z.ZodTypeAny>(
  schema: T
): z.ZodObject<{
  total: z.ZodNumber;
  limit: z.ZodNumber;
  offset: z.ZodNumber;
  list: z.ZodArray<T, 'many'>;
}> {
  return z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    list: z.array(schema),
  });
}

const listProjectsRoute = createRoute({
  tags: ['Projects'],
  description: 'Lists all Projects you currently have access to',
  method: 'get',
  path: '/',
  operationId: 'listProjects',
  request: {
    query: listProjectsSchema.openapi({
      default: {
        limit: 15,
        offset: 0,
      },
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: paginatedListOf(ProjectSchema),
        },
      },
      description: 'A list of Projects you have access to',
    },
  },
});

const readProjectRoute = createRoute({
  tags: ['Projects'],
  description: 'Retrieve a Project by ID',
  method: 'get',
  path: '/{id}',
  operationId: 'readProject',
  request: {
    params: z.object({
      id: readProjectSchema.shape.id.openapi({
        param: {
          name: 'id',
          in: 'path',
        },
        example: uuid(),
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProjectSchema,
        },
      },
      description: 'The requested Project',
    },
    404: {
      description:
        'The requested Project does not exist or you have no right to access it',
    },
  },
});

const countProjectsRoute = createRoute({
  tags: ['Projects'],
  description: 'Counts all Projects you currently have access to',
  method: 'get',
  path: '/count',
  operationId: 'countProjects',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.number(),
        },
      },
      description: 'The number of Projects you have acces to',
    },
  },
});

/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as ProjectsIndexImport } from './routes/projects/index'
import { Route as UserSetImport } from './routes/user/set'
import { Route as ProjectsCreateImport } from './routes/projects/create'
import { Route as ProjectsProjectIdImport } from './routes/projects/$projectId'
import { Route as ProjectsProjectIdIndexImport } from './routes/projects/$projectId/index'
import { Route as ProjectsProjectIdSettingsImport } from './routes/projects/$projectId/settings'
import { Route as ProjectsProjectIdDashboardImport } from './routes/projects/$projectId/dashboard'
import { Route as ProjectsProjectIdCollectionsImport } from './routes/projects/$projectId/collections'
import { Route as ProjectsProjectIdSettingsIndexImport } from './routes/projects/$projectId/settings/index'
import { Route as ProjectsProjectIdCollectionsIndexImport } from './routes/projects/$projectId/collections/index'
import { Route as ProjectsProjectIdAssetsIndexImport } from './routes/projects/$projectId/assets/index'
import { Route as ProjectsProjectIdSettingsGeneralImport } from './routes/projects/$projectId/settings/general'
import { Route as ProjectsProjectIdCollectionsCreateImport } from './routes/projects/$projectId/collections/create'
import { Route as ProjectsProjectIdCollectionsCollectionIdImport } from './routes/projects/$projectId/collections/$collectionId'
import { Route as ProjectsProjectIdCollectionsCollectionIdIndexImport } from './routes/projects/$projectId/collections/$collectionId/index'
import { Route as ProjectsProjectIdCollectionsCollectionIdUpdateImport } from './routes/projects/$projectId/collections/$collectionId/update'
import { Route as ProjectsProjectIdCollectionsCollectionIdCreateImport } from './routes/projects/$projectId/collections/$collectionId/create'
import { Route as ProjectsProjectIdCollectionsCollectionIdEntryIdImport } from './routes/projects/$projectId/collections/$collectionId/$entryId'
import { Route as ProjectsProjectIdCollectionsCollectionIdEntryIdIndexImport } from './routes/projects/$projectId/collections/$collectionId/$entryId/index'

// Create/Update Routes

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const ProjectsIndexRoute = ProjectsIndexImport.update({
  path: '/projects/',
  getParentRoute: () => rootRoute,
} as any)

const UserSetRoute = UserSetImport.update({
  path: '/user/set',
  getParentRoute: () => rootRoute,
} as any)

const ProjectsCreateRoute = ProjectsCreateImport.update({
  path: '/projects/create',
  getParentRoute: () => rootRoute,
} as any)

const ProjectsProjectIdRoute = ProjectsProjectIdImport.update({
  path: '/projects/$projectId',
  getParentRoute: () => rootRoute,
} as any)

const ProjectsProjectIdIndexRoute = ProjectsProjectIdIndexImport.update({
  path: '/',
  getParentRoute: () => ProjectsProjectIdRoute,
} as any)

const ProjectsProjectIdSettingsRoute = ProjectsProjectIdSettingsImport.update({
  path: '/settings',
  getParentRoute: () => ProjectsProjectIdRoute,
} as any)

const ProjectsProjectIdDashboardRoute = ProjectsProjectIdDashboardImport.update(
  {
    path: '/dashboard',
    getParentRoute: () => ProjectsProjectIdRoute,
  } as any,
)

const ProjectsProjectIdCollectionsRoute =
  ProjectsProjectIdCollectionsImport.update({
    path: '/collections',
    getParentRoute: () => ProjectsProjectIdRoute,
  } as any)

const ProjectsProjectIdSettingsIndexRoute =
  ProjectsProjectIdSettingsIndexImport.update({
    path: '/',
    getParentRoute: () => ProjectsProjectIdSettingsRoute,
  } as any)

const ProjectsProjectIdCollectionsIndexRoute =
  ProjectsProjectIdCollectionsIndexImport.update({
    path: '/',
    getParentRoute: () => ProjectsProjectIdCollectionsRoute,
  } as any)

const ProjectsProjectIdAssetsIndexRoute =
  ProjectsProjectIdAssetsIndexImport.update({
    path: '/assets/',
    getParentRoute: () => ProjectsProjectIdRoute,
  } as any)

const ProjectsProjectIdSettingsGeneralRoute =
  ProjectsProjectIdSettingsGeneralImport.update({
    path: '/general',
    getParentRoute: () => ProjectsProjectIdSettingsRoute,
  } as any)

const ProjectsProjectIdCollectionsCreateRoute =
  ProjectsProjectIdCollectionsCreateImport.update({
    path: '/create',
    getParentRoute: () => ProjectsProjectIdCollectionsRoute,
  } as any)

const ProjectsProjectIdCollectionsCollectionIdRoute =
  ProjectsProjectIdCollectionsCollectionIdImport.update({
    path: '/$collectionId',
    getParentRoute: () => ProjectsProjectIdCollectionsRoute,
  } as any)

const ProjectsProjectIdCollectionsCollectionIdIndexRoute =
  ProjectsProjectIdCollectionsCollectionIdIndexImport.update({
    path: '/',
    getParentRoute: () => ProjectsProjectIdCollectionsCollectionIdRoute,
  } as any)

const ProjectsProjectIdCollectionsCollectionIdUpdateRoute =
  ProjectsProjectIdCollectionsCollectionIdUpdateImport.update({
    path: '/update',
    getParentRoute: () => ProjectsProjectIdCollectionsCollectionIdRoute,
  } as any)

const ProjectsProjectIdCollectionsCollectionIdCreateRoute =
  ProjectsProjectIdCollectionsCollectionIdCreateImport.update({
    path: '/create',
    getParentRoute: () => ProjectsProjectIdCollectionsCollectionIdRoute,
  } as any)

const ProjectsProjectIdCollectionsCollectionIdEntryIdRoute =
  ProjectsProjectIdCollectionsCollectionIdEntryIdImport.update({
    path: '/$entryId',
    getParentRoute: () => ProjectsProjectIdCollectionsCollectionIdRoute,
  } as any)

const ProjectsProjectIdCollectionsCollectionIdEntryIdIndexRoute =
  ProjectsProjectIdCollectionsCollectionIdEntryIdIndexImport.update({
    path: '/',
    getParentRoute: () => ProjectsProjectIdCollectionsCollectionIdEntryIdRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/projects/$projectId': {
      id: '/projects/$projectId'
      path: '/projects/$projectId'
      fullPath: '/projects/$projectId'
      preLoaderRoute: typeof ProjectsProjectIdImport
      parentRoute: typeof rootRoute
    }
    '/projects/create': {
      id: '/projects/create'
      path: '/projects/create'
      fullPath: '/projects/create'
      preLoaderRoute: typeof ProjectsCreateImport
      parentRoute: typeof rootRoute
    }
    '/user/set': {
      id: '/user/set'
      path: '/user/set'
      fullPath: '/user/set'
      preLoaderRoute: typeof UserSetImport
      parentRoute: typeof rootRoute
    }
    '/projects/': {
      id: '/projects/'
      path: '/projects'
      fullPath: '/projects'
      preLoaderRoute: typeof ProjectsIndexImport
      parentRoute: typeof rootRoute
    }
    '/projects/$projectId/collections': {
      id: '/projects/$projectId/collections'
      path: '/collections'
      fullPath: '/projects/$projectId/collections'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsImport
      parentRoute: typeof ProjectsProjectIdImport
    }
    '/projects/$projectId/dashboard': {
      id: '/projects/$projectId/dashboard'
      path: '/dashboard'
      fullPath: '/projects/$projectId/dashboard'
      preLoaderRoute: typeof ProjectsProjectIdDashboardImport
      parentRoute: typeof ProjectsProjectIdImport
    }
    '/projects/$projectId/settings': {
      id: '/projects/$projectId/settings'
      path: '/settings'
      fullPath: '/projects/$projectId/settings'
      preLoaderRoute: typeof ProjectsProjectIdSettingsImport
      parentRoute: typeof ProjectsProjectIdImport
    }
    '/projects/$projectId/': {
      id: '/projects/$projectId/'
      path: '/'
      fullPath: '/projects/$projectId/'
      preLoaderRoute: typeof ProjectsProjectIdIndexImport
      parentRoute: typeof ProjectsProjectIdImport
    }
    '/projects/$projectId/collections/$collectionId': {
      id: '/projects/$projectId/collections/$collectionId'
      path: '/$collectionId'
      fullPath: '/projects/$projectId/collections/$collectionId'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsCollectionIdImport
      parentRoute: typeof ProjectsProjectIdCollectionsImport
    }
    '/projects/$projectId/collections/create': {
      id: '/projects/$projectId/collections/create'
      path: '/create'
      fullPath: '/projects/$projectId/collections/create'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsCreateImport
      parentRoute: typeof ProjectsProjectIdCollectionsImport
    }
    '/projects/$projectId/settings/general': {
      id: '/projects/$projectId/settings/general'
      path: '/general'
      fullPath: '/projects/$projectId/settings/general'
      preLoaderRoute: typeof ProjectsProjectIdSettingsGeneralImport
      parentRoute: typeof ProjectsProjectIdSettingsImport
    }
    '/projects/$projectId/assets/': {
      id: '/projects/$projectId/assets/'
      path: '/assets'
      fullPath: '/projects/$projectId/assets'
      preLoaderRoute: typeof ProjectsProjectIdAssetsIndexImport
      parentRoute: typeof ProjectsProjectIdImport
    }
    '/projects/$projectId/collections/': {
      id: '/projects/$projectId/collections/'
      path: '/'
      fullPath: '/projects/$projectId/collections/'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsIndexImport
      parentRoute: typeof ProjectsProjectIdCollectionsImport
    }
    '/projects/$projectId/settings/': {
      id: '/projects/$projectId/settings/'
      path: '/'
      fullPath: '/projects/$projectId/settings/'
      preLoaderRoute: typeof ProjectsProjectIdSettingsIndexImport
      parentRoute: typeof ProjectsProjectIdSettingsImport
    }
    '/projects/$projectId/collections/$collectionId/$entryId': {
      id: '/projects/$projectId/collections/$collectionId/$entryId'
      path: '/$entryId'
      fullPath: '/projects/$projectId/collections/$collectionId/$entryId'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsCollectionIdEntryIdImport
      parentRoute: typeof ProjectsProjectIdCollectionsCollectionIdImport
    }
    '/projects/$projectId/collections/$collectionId/create': {
      id: '/projects/$projectId/collections/$collectionId/create'
      path: '/create'
      fullPath: '/projects/$projectId/collections/$collectionId/create'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsCollectionIdCreateImport
      parentRoute: typeof ProjectsProjectIdCollectionsCollectionIdImport
    }
    '/projects/$projectId/collections/$collectionId/update': {
      id: '/projects/$projectId/collections/$collectionId/update'
      path: '/update'
      fullPath: '/projects/$projectId/collections/$collectionId/update'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsCollectionIdUpdateImport
      parentRoute: typeof ProjectsProjectIdCollectionsCollectionIdImport
    }
    '/projects/$projectId/collections/$collectionId/': {
      id: '/projects/$projectId/collections/$collectionId/'
      path: '/'
      fullPath: '/projects/$projectId/collections/$collectionId/'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsCollectionIdIndexImport
      parentRoute: typeof ProjectsProjectIdCollectionsCollectionIdImport
    }
    '/projects/$projectId/collections/$collectionId/$entryId/': {
      id: '/projects/$projectId/collections/$collectionId/$entryId/'
      path: '/'
      fullPath: '/projects/$projectId/collections/$collectionId/$entryId/'
      preLoaderRoute: typeof ProjectsProjectIdCollectionsCollectionIdEntryIdIndexImport
      parentRoute: typeof ProjectsProjectIdCollectionsCollectionIdEntryIdImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexRoute,
  ProjectsProjectIdRoute: ProjectsProjectIdRoute.addChildren({
    ProjectsProjectIdCollectionsRoute:
      ProjectsProjectIdCollectionsRoute.addChildren({
        ProjectsProjectIdCollectionsCollectionIdRoute:
          ProjectsProjectIdCollectionsCollectionIdRoute.addChildren({
            ProjectsProjectIdCollectionsCollectionIdEntryIdRoute:
              ProjectsProjectIdCollectionsCollectionIdEntryIdRoute.addChildren({
                ProjectsProjectIdCollectionsCollectionIdEntryIdIndexRoute,
              }),
            ProjectsProjectIdCollectionsCollectionIdCreateRoute,
            ProjectsProjectIdCollectionsCollectionIdUpdateRoute,
            ProjectsProjectIdCollectionsCollectionIdIndexRoute,
          }),
        ProjectsProjectIdCollectionsCreateRoute,
        ProjectsProjectIdCollectionsIndexRoute,
      }),
    ProjectsProjectIdDashboardRoute,
    ProjectsProjectIdSettingsRoute: ProjectsProjectIdSettingsRoute.addChildren({
      ProjectsProjectIdSettingsGeneralRoute,
      ProjectsProjectIdSettingsIndexRoute,
    }),
    ProjectsProjectIdIndexRoute,
    ProjectsProjectIdAssetsIndexRoute,
  }),
  ProjectsCreateRoute,
  UserSetRoute,
  ProjectsIndexRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/projects/$projectId",
        "/projects/create",
        "/user/set",
        "/projects/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/projects/$projectId": {
      "filePath": "projects/$projectId.tsx",
      "children": [
        "/projects/$projectId/collections",
        "/projects/$projectId/dashboard",
        "/projects/$projectId/settings",
        "/projects/$projectId/",
        "/projects/$projectId/assets/"
      ]
    },
    "/projects/create": {
      "filePath": "projects/create.tsx"
    },
    "/user/set": {
      "filePath": "user/set.tsx"
    },
    "/projects/": {
      "filePath": "projects/index.tsx"
    },
    "/projects/$projectId/collections": {
      "filePath": "projects/$projectId/collections.tsx",
      "parent": "/projects/$projectId",
      "children": [
        "/projects/$projectId/collections/$collectionId",
        "/projects/$projectId/collections/create",
        "/projects/$projectId/collections/"
      ]
    },
    "/projects/$projectId/dashboard": {
      "filePath": "projects/$projectId/dashboard.tsx",
      "parent": "/projects/$projectId"
    },
    "/projects/$projectId/settings": {
      "filePath": "projects/$projectId/settings.tsx",
      "parent": "/projects/$projectId",
      "children": [
        "/projects/$projectId/settings/general",
        "/projects/$projectId/settings/"
      ]
    },
    "/projects/$projectId/": {
      "filePath": "projects/$projectId/index.tsx",
      "parent": "/projects/$projectId"
    },
    "/projects/$projectId/collections/$collectionId": {
      "filePath": "projects/$projectId/collections/$collectionId.tsx",
      "parent": "/projects/$projectId/collections",
      "children": [
        "/projects/$projectId/collections/$collectionId/$entryId",
        "/projects/$projectId/collections/$collectionId/create",
        "/projects/$projectId/collections/$collectionId/update",
        "/projects/$projectId/collections/$collectionId/"
      ]
    },
    "/projects/$projectId/collections/create": {
      "filePath": "projects/$projectId/collections/create.tsx",
      "parent": "/projects/$projectId/collections"
    },
    "/projects/$projectId/settings/general": {
      "filePath": "projects/$projectId/settings/general.tsx",
      "parent": "/projects/$projectId/settings"
    },
    "/projects/$projectId/assets/": {
      "filePath": "projects/$projectId/assets/index.tsx",
      "parent": "/projects/$projectId"
    },
    "/projects/$projectId/collections/": {
      "filePath": "projects/$projectId/collections/index.tsx",
      "parent": "/projects/$projectId/collections"
    },
    "/projects/$projectId/settings/": {
      "filePath": "projects/$projectId/settings/index.tsx",
      "parent": "/projects/$projectId/settings"
    },
    "/projects/$projectId/collections/$collectionId/$entryId": {
      "filePath": "projects/$projectId/collections/$collectionId/$entryId.tsx",
      "parent": "/projects/$projectId/collections/$collectionId",
      "children": [
        "/projects/$projectId/collections/$collectionId/$entryId/"
      ]
    },
    "/projects/$projectId/collections/$collectionId/create": {
      "filePath": "projects/$projectId/collections/$collectionId/create.tsx",
      "parent": "/projects/$projectId/collections/$collectionId"
    },
    "/projects/$projectId/collections/$collectionId/update": {
      "filePath": "projects/$projectId/collections/$collectionId/update.tsx",
      "parent": "/projects/$projectId/collections/$collectionId"
    },
    "/projects/$projectId/collections/$collectionId/": {
      "filePath": "projects/$projectId/collections/$collectionId/index.tsx",
      "parent": "/projects/$projectId/collections/$collectionId"
    },
    "/projects/$projectId/collections/$collectionId/$entryId/": {
      "filePath": "projects/$projectId/collections/$collectionId/$entryId/index.tsx",
      "parent": "/projects/$projectId/collections/$collectionId/$entryId"
    }
  }
}
ROUTE_MANIFEST_END */
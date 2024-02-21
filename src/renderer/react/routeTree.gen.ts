/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as HasUserGuardImport } from './routes/_hasUserGuard'
import { Route as IndexImport } from './routes/index'
import { Route as ProjectsIndexImport } from './routes/projects/index'
import { Route as UserSetImport } from './routes/user/set'
import { Route as ProjectsProjectIdIndexImport } from './routes/projects/$projectId/index'

// Create/Update Routes

const HasUserGuardRoute = HasUserGuardImport.update({
  id: '/_hasUserGuard',
  getParentRoute: () => rootRoute,
} as any)

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

const ProjectsProjectIdIndexRoute = ProjectsProjectIdIndexImport.update({
  path: '/projects/$projectId/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_hasUserGuard': {
      preLoaderRoute: typeof HasUserGuardImport
      parentRoute: typeof rootRoute
    }
    '/user/set': {
      preLoaderRoute: typeof UserSetImport
      parentRoute: typeof rootRoute
    }
    '/projects/': {
      preLoaderRoute: typeof ProjectsIndexImport
      parentRoute: typeof rootRoute
    }
    '/projects/$projectId/': {
      preLoaderRoute: typeof ProjectsProjectIdIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  HasUserGuardRoute,
  UserSetRoute,
  ProjectsIndexRoute,
  ProjectsProjectIdIndexRoute,
])

/* prettier-ignore-end */

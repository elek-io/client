import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { ContextBridgeApi } from '../../preload';

interface RouterContext {
  core: ContextBridgeApi['core'];
}

// Use the routerContext to create your root route
export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/projects" className="[&.active]:font-bold">
          Projects
        </Link>
        <Link to="/user/set" className="[&.active]:font-bold">
          User
        </Link>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_hasUserGuard')({
  beforeLoad: async ({ location, context }) => {
    const user = await context.core.user.get();
    console.log('User:', user);

    if (!user) {
      throw redirect({
        to: '/user/set',
        search: {
          // Use the current location to power a redirect after login
          // (Do not use `router.state.resolvedLocation` as it can
          // potentially lag behind the actual current location)
          redirect: location.href,
        },
      });
    }
  },
});

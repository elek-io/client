import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId'
)({
  beforeLoad: async ({ context, params }) => {
    const currentCollection = await context.core.collections.read({
      projectId: params.projectId,
      id: params.collectionId,
    });

    return { currentCollection };
  },
  component: () => (
    <div>Hello /projects/$projectId/collections/$collectionId!</div>
  ),
});

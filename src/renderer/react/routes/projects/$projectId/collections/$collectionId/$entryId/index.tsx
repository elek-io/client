import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/collections/$collectionId/$entryId/')({
  component: () => <div>Hello /projects/$projectId/collections/$collectionId/$entryId/!</div>
})
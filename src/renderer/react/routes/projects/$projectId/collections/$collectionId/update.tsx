import { Button } from '@/renderer/react/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/renderer/react/components/ui/dialog';
import { Form } from '@/renderer/react/components/ui/form';
import { Page } from '@/renderer/react/components/ui/page';
import { formatTimestamp } from '@/util';
import {
  DeleteCollectionProps,
  UpdateCollectionProps,
  updateCollectionSchema,
} from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Trash } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/update'
)({
  component: ProjectCollectionUpdate,
});

function ProjectCollectionUpdate() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const updateCollectionForm = useForm<UpdateCollectionProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('formData', data);
      console.log(
        'validation result',
        await zodResolver(updateCollectionSchema)(data, context, options)
      );
      return zodResolver(updateCollectionSchema)(data, context, options);
    },
    defaultValues: context.currentCollection,
  });

  function Title(): string {
    return `Configure ${context.translate(
      'currentCollection.name.plural',
      context.currentCollection.name.plural
    )}`;
  }

  function Description(): ReactElement {
    return (
      <>
        <span className="mr-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">
          Created:{' '}
          {
            formatTimestamp(context.currentCollection?.created || 0, 'en')
              .absolute
          }
        </span>
        <span className="mr-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">
          Updated:{' '}
          {
            formatTimestamp(context.currentCollection?.updated || 0, 'en')
              .absolute
          }
        </span>
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          isLoading={isUpdatingCollection}
          onClick={updateCollectionForm.handleSubmit(onUpdate)}
        >
          <Check className="w-4 h-4 mr-2"></Check>
          Save changes
        </Button>
      </>
    );
  }

  const onUpdate: SubmitHandler<UpdateCollectionProps> = async (collection) => {
    setIsUpdatingCollection(true);
    try {
      await context.core.collections.update({
        ...collection,
        projectId: context.currentProject.id,
      });
      setIsUpdatingCollection(false);
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId',
        params: {
          projectId: context.currentProject.id,
          collectionId: context.currentCollection.id,
        },
      });
    } catch (error) {
      setIsUpdatingCollection(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Collection',
        description: 'There was an error updating the Collection.',
      });
    }
  };

  const onDelete: SubmitHandler<DeleteCollectionProps> = async (collection) => {
    try {
      await context.core.collections.delete({
        projectId: context.currentProject.id,
        id: collection.id,
      });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully deleted Collection',
        description: 'The Collection was successfully deleted.',
      });
      router.navigate({
        to: '/projects/$projectId/collections',
        params: {
          projectId: context.currentProject.id,
        },
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Collection',
        description: 'There was an error deleting the Collection from disk.',
      });
    }
  };

  return (
    <Page
      title={Title()}
      actions={<Actions></Actions>}
      description={<Description></Description>}
    >
      <Form {...updateCollectionForm}>
        <form onSubmit={updateCollectionForm.handleSubmit(onUpdate)}>
          <h1>Update Collection here</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="w-4 h-4 mr-2"></Trash>
                Delete Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone if your Project is not replicated
                  somewhere else than this device.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    No, I've changed my mind
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() =>
                    onDelete({
                      projectId: context.currentProject.id,
                      id: context.currentCollection.id,
                    })
                  }
                >
                  <Trash className="w-4 h-4 mr-2"></Trash>
                  Yes, delete this Collection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </Form>
    </Page>
  );
}

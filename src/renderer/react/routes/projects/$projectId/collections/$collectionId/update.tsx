import { CreateUpdateCollectionPage } from '@/renderer/react/components/pages/create-update-collection-page';
import { Button } from '@/renderer/react/components/ui/button';
import {
  DeleteCollectionProps,
  UpdateCollectionProps,
  updateCollectionSchema,
} from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
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
    defaultValues: {
      ...context.currentCollection,
      projectId: context.currentProject.id,
    },
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
        A Collection holds information about how your content is structured.
        <br></br>
        Read more about{' '}
        <a href="#" className="text-brand-600 hover:underline">
          Collections in the documentation
        </a>
        .
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
    <CreateUpdateCollectionPage
      title={Title()}
      actions={<Actions></Actions>}
      description={<Description></Description>}
      context={context}
      collectionForm={updateCollectionForm}
      onCollectionSubmit={onUpdate}
      onCollectionDelete={onDelete}
    />
  );
}

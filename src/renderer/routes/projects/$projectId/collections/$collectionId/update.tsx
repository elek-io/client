import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { CreateUpdateCollectionPage } from '@renderer/components/pages/create-update-collection-page';
import { Button } from '@renderer/components/ui/button';
import { useStore } from '@renderer/store';

import {
  type DeleteCollectionProps,
  type UpdateCollectionProps,
  updateCollectionSchema,
} from '@elek-io/core';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/update'
)({
  component: ProjectCollectionUpdate,
});

function ProjectCollectionUpdate(): ReactElement {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);

  const updateCollectionForm = useForm<UpdateCollectionProps>({
    resolver: async (data, context, options) => {
      return zodResolver(updateCollectionSchema)(data, context, options);
    },
    defaultValues: {
      ...context.currentCollection,
      projectId: context.project.id,
    },
  });

  const title = `Configure ${context.translateContent(
    'currentCollection.name.plural',
    context.currentCollection.name.plural
  )}`;

  function Description(): ReactElement {
    return (
      <>
        A Collection holds information about how your content is structured.
        <br />
        Read more about <a href="#">Collections in the documentation</a>.
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
          <Check className="mr-2 h-4 w-4" />
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
      await router.navigate({
        to: '/projects/$projectId/collections/$collectionId',
        params: {
          projectId: context.project.id,
          collectionId: context.currentCollection.id,
        },
      });
    } catch (error) {
      setIsUpdatingCollection(false);
      await context.core.logger.error({
        source: 'desktop',
        message: 'Failed to update Collection',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to update Collection',
        description: 'There was an error updating the Collection.',
      });
    }
  };

  const onDelete: SubmitHandler<DeleteCollectionProps> = async (collection) => {
    try {
      await context.core.collections.delete({
        projectId: context.project.id,
        id: collection.id,
      });
      addNotification({
        intent: 'success',
        title: 'Successfully deleted Collection',
        description: 'The Collection was successfully deleted.',
      });
      await router.navigate({
        to: '/projects/$projectId/collections',
        params: {
          projectId: context.project.id,
        },
      });
    } catch (error) {
      await context.core.logger.error({
        source: 'desktop',
        message: 'Failed to delete Collection',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to delete Collection',
        description: 'There was an error deleting the Collection from disk.',
      });
    }
  };

  return (
    <CreateUpdateCollectionPage
      title={title}
      actions={<Actions />}
      description={<Description />}
      supportedLanguages={context.project.settings.language.supported}
      defaultLanguage={context.project.settings.language.default}
      collectionForm={updateCollectionForm}
      onFormSubmit={onUpdate}
      onCollectionDelete={onDelete}
      translateContent={context.translateContent}
    />
  );
}

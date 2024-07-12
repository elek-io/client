import { CreateCollectionProps, createCollectionSchema } from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotificationIntent } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { translatableDefault } from '../../../../components/forms/util';
import { CreateUpdateCollectionPage } from '../../../../components/pages/create-update-collection-page';
import { Button } from '../../../../components/ui/button';

export const Route = createFileRoute('/projects/$projectId/collections/create')(
  {
    component: ProjectCollectionCreate,
  }
);

function ProjectCollectionCreate() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const createCollectionForm = useForm<CreateCollectionProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('formData', data);
      console.log(
        'validation result',
        await zodResolver(createCollectionSchema)(data, context, options)
      );
      return zodResolver(createCollectionSchema)(data, context, options);
    },
    defaultValues: {
      projectId: context.currentProject.id,
      icon: 'home',
      name: {
        singular: translatableDefault({
          supportedLanguages:
            context.currentProject.settings.language.supported,
          default: '',
        }),
        plural: translatableDefault({
          supportedLanguages:
            context.currentProject.settings.language.supported,
          default: '',
        }),
      },
      description: translatableDefault({
        supportedLanguages: context.currentProject.settings.language.supported,
        default: '',
      }),
      slug: {
        singular: '',
        plural: '',
      },
      valueDefinitions: [],
    },
  });

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
          isLoading={isCreatingCollection}
          onClick={createCollectionForm.handleSubmit(onCreate)}
        >
          <Check className="w-4 h-4 mr-2"></Check>
          Create Collection
        </Button>
      </>
    );
  }

  const onCreate: SubmitHandler<CreateCollectionProps> = async (
    createCollectionProps
  ) => {
    setIsCreatingCollection(true);
    try {
      const collection = await context.core.collections.create(
        createCollectionProps
      );
      setIsCreatingCollection(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Created new collection',
        description: 'You can now create Entries for this new Collection.',
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId',
        params: {
          projectId: context.currentProject.id,
          collectionId: collection.id,
        },
      });
    } catch (error) {
      setIsCreatingCollection(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create new collection',
        description: 'There was an error creating the new Collection.',
      });
    }
  };

  return (
    <CreateUpdateCollectionPage
      title={`Create a new Collection`}
      actions={<Actions></Actions>}
      description={<Description></Description>}
      context={context}
      collectionForm={createCollectionForm}
      onCollectionSubmit={onCreate}
    />
  );
}
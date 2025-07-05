import { CreateCollectionProps, createCollectionSchema } from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { translatableDefaultNull } from '@renderer/components/forms/util';
import { CreateUpdateCollectionPage } from '@renderer/components/pages/create-update-collection-page';
import { Button } from '@renderer/components/ui/button';
import { projectQueryOptions } from '@renderer/queries';
import { NotificationIntent, useStore } from '@renderer/store';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute('/projects/$projectId/collections/create')(
  {
    loader: ({ context, params }) =>
      context.queryClient.ensureQueryData(
        projectQueryOptions({ id: params.projectId })
      ),
    component: ProjectCollectionCreate,
  }
);

function ProjectCollectionCreate(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const { projectId } = Route.useParams();
  const projectQuery = useSuspenseQuery(projectQueryOptions({ id: projectId }));
  const addNotification = useStore((state) => state.addNotification);
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
      projectId,
      icon: 'home',
      name: {
        singular: translatableDefaultNull({
          supportedLanguages: projectQuery.data.settings.language.supported,
        }),
        plural: translatableDefaultNull({
          supportedLanguages: projectQuery.data.settings.language.supported,
        }),
      },
      description: translatableDefaultNull({
        supportedLanguages: projectQuery.data.settings.language.supported,
      }),
      slug: {
        singular: '',
        plural: '',
      },
      fieldDefinitions: [],
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
          projectId,
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
      project={projectQuery.data}
      collectionForm={createCollectionForm}
      onCollectionSubmit={onCreate}
    />
  );
}

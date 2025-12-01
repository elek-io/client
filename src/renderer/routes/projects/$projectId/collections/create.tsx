import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { CollectionForm } from '@renderer/components/forms/collection-form';
import { Page } from '@renderer/components/page';
import { Button } from '@renderer/components/ui/button';
import { useProject } from '@renderer/hooks/useProject';
import { translatableDefaultNull } from '@renderer/lib/utils';
import { queryOptions } from '@renderer/queries';

import {
  type CreateCollectionProps,
  createCollectionSchema,
} from '@elek-io/core';

export const Route = createFileRoute('/projects/$projectId/collections/create')(
  {
    component: ProjectCollectionCreate,
  }
);

function ProjectCollectionCreate(): ReactElement {
  const router = useRouter();
  const { projectId } = Route.useParams();
  const {
    projectQuery: { data: project, isPending: isReadingProject },
  } = useProject();
  const { mutateAsync: createCollection, isPending: isCreatingCollection } =
    useMutation(queryOptions.collections.create);

  const createCollectionForm = useForm<CreateCollectionProps>({
    resolver: async (data, context, options) => {
      return zodResolver(createCollectionSchema)(data, context, options);
    },
    defaultValues: {
      projectId,
      icon: 'home',
      name: {
        singular: {},
        plural: {},
      },
      description: {},
      slug: {
        singular: '',
        plural: '',
      },
      fieldDefinitions: [],
    },
  });

  // Reset form with Project data when it loads
  useEffect(() => {
    if (project) {
      createCollectionForm.reset({
        projectId,
        icon: 'home',
        name: {
          singular: translatableDefaultNull(
            project.settings.language.supported
          ),
          plural: translatableDefaultNull(project.settings.language.supported),
        },
        description: translatableDefaultNull(
          project.settings.language.supported
        ),
        slug: {
          singular: '',
          plural: '',
        },
        fieldDefinitions: [],
      });
    }
  }, [projectId, project, createCollectionForm]);

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
          Icon={Check}
          isLoading={isCreatingCollection}
          onClick={createCollectionForm.handleSubmit(onCreate)}
        >
          Create Collection
        </Button>
      </>
    );
  }

  const onCreate: SubmitHandler<CreateCollectionProps> = async (props) => {
    const collection = await createCollection(props);
    await router.navigate({
      to: '/projects/$projectId/collections/$collectionId',
      params: {
        projectId,
        collectionId: collection.id,
      },
    });
  };

  if (isReadingProject) {
    return <></>;
  }

  return (
    <Page
      title="Create a new Collection"
      description={<Description />}
      actions={<Actions />}
    >
      <CollectionForm
        collectionForm={createCollectionForm}
        project={project}
        isViewOnly={isCreatingCollection}
        onFormSubmit={onCreate}
      />
    </Page>
  );
}

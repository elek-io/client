import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Trash } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { CollectionForm } from '@renderer/components/forms/collection-form';
import { Page } from '@renderer/components/page';
import { PageSection } from '@renderer/components/page-section';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@renderer/components/ui/alert-dialog';
import { Button } from '@renderer/components/ui/button';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

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
  const { projectId, collectionId } = Route.useParams();
  const {
    projectQuery: { data: project, isPending: isReadingProject },
    translateContent,
  } = useProject();
  const { data: collection, isPending: isReadingCollection } = useQueryNoError(
    queryOptions.collections.read({
      projectId: projectId,
      id: collectionId,
    })
  );
  useBreadcrumb(Route, isReadingCollection ? undefined : 'Configure');
  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } =
    useMutation(queryOptions.collections.update);
  const { mutateAsync: deleteCollection } = useMutation(
    queryOptions.collections.delete
  );
  const updateCollectionForm = useForm({
    resolver: zodResolver(updateCollectionSchema),
    defaultValues: {
      projectId,
    },
  });

  // Reset form with Collection data when it loads
  useEffect(() => {
    if (isReadingCollection === false) {
      updateCollectionForm.reset({
        ...collection,
        projectId,
      });
    }
  }, [projectId, isReadingCollection, collection, updateCollectionForm]);

  const title = `Configure ${
    isReadingCollection === false
      ? translateContent({
          key: 'collection.name.plural',
          record: collection.name.plural,
        })
      : 'Collection'
  }`;

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
          disabled={updateCollectionForm.formState.isDirty === false}
          onClick={updateCollectionForm.handleSubmit(onUpdate)}
        >
          <Check className="mr-2 h-4 w-4" />
          Save changes
        </Button>
      </>
    );
  }

  const onUpdate: SubmitHandler<UpdateCollectionProps> = async (collection) => {
    await updateCollection(collection);
    await router.navigate({
      to: '/projects/$projectId/collections/$collectionId',
      params: {
        projectId,
        collectionId,
      },
    });
  };

  const onDelete: SubmitHandler<DeleteCollectionProps> = async (collection) => {
    await deleteCollection({
      projectId,
      id: collection.id,
    });
    await router.navigate({
      to: '/projects/$projectId/collections',
      params: {
        projectId,
      },
    });
  };

  if (isReadingProject) {
    return <></>;
  }

  return (
    <Page title={title} description={<Description />} actions={<Actions />}>
      <CollectionForm
        collectionForm={updateCollectionForm}
        project={project}
        isViewOnly={isUpdatingCollection}
        onFormSubmit={onUpdate}
      >
        <PageSection title="Danger Zone">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm leading-6 font-medium">
                Delete this Collection
              </p>
            </div>
            <div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Collection
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this Collection?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deleting this Collection also permanently deletes every
                      Entry inside it. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          onDelete({
                            projectId,
                            id: collectionId,
                          })
                        }
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Yes, delete this Collection
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </PageSection>
      </CollectionForm>
    </Page>
  );
}

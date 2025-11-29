import { zodResolver } from '@hookform/resolvers/zod';
import { PageSection } from '@root/src/renderer/components/page-section';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@root/src/renderer/components/ui/dialog';
import { useProject } from '@root/src/renderer/hooks/useProject';
import { useQueryNoError } from '@root/src/renderer/hooks/useQueryNoError';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Trash } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { CreateUpdateCollectionPage } from '@renderer/components/pages/create-update-collection-page';
import { Button } from '@renderer/components/ui/button';
import queryOptions from '@renderer/queries/options';

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
    projectQuery: { data: project },
    translateContent,
  } = useProject();
  const { data: collection } = useQueryNoError(
    queryOptions.collections.read({
      projectId: projectId,
      id: collectionId,
    })
  );
  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } =
    useMutation(queryOptions.collections.update);
  const { mutateAsync: deleteCollection } = useMutation(
    queryOptions.collections.delete
  );
  const updateCollectionForm = useForm<UpdateCollectionProps>({
    resolver: zodResolver(updateCollectionSchema),
    defaultValues: {
      projectId,
    },
  });

  // Reset form with Collection data when it loads
  useEffect(() => {
    if (collection) {
      updateCollectionForm.reset({
        ...collection,
        projectId,
      });
    }
  }, [projectId, collection, updateCollectionForm]);

  const title = `Configure ${
    collection
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

  return (
    <CreateUpdateCollectionPage
      title={title}
      actions={<Actions />}
      description={<Description />}
      project={project}
      collectionForm={updateCollectionForm}
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      No, I&apos;ve changed my mind
                    </Button>
                  </DialogClose>
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
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </PageSection>
    </CreateUpdateCollectionPage>
  );
}

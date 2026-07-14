import { zodResolver } from '@hookform/resolvers/zod';
import { parseIpcError } from '@root/src/shared/ipcError';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Trash } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { describeCoreError } from '@renderer/lib/coreErrorText';
import { queryOptions } from '@renderer/queries';

import {
  type CoreErrorType,
  type DeleteCollectionProps,
  type UpdateCollectionProps,
  updateCollectionSchema,
} from '@elek-io/core';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/update'
)({
  component: ProjectCollectionUpdate,
});

// Why the delete was blocked, keyed by the CoreError type preserved across IPC.
// Core blocks a Collection delete with a Conflict when an Entry in another
// Collection still references into this one. Only Conflict is handled in place,
// so unlisted types (and non-Core errors) never reach the dialog.
const deleteErrorDescriptions: Partial<Record<CoreErrorType, string>> = {
  Conflict:
    'Entries in other Collections still reference Entries in this one, so it can’t be deleted. Remove or repoint those references first, then try again.',
};

const deleteErrorFallback =
  'This Collection could not be deleted. Please review and try again.';

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
  const { mutateAsync: deleteCollection } = useMutation({
    ...queryOptions.collections.delete,
    // Only a referenced Collection is handled in place by the dialog below: Core
    // blocks the delete with a Conflict when an Entry in another Collection still
    // references into this one. Every other failure is unexpected, so let it
    // reach the root error boundary, which logs it and reports it to Sentry.
    throwOnError: (error) => parseIpcError(error).type !== 'Conflict',
    onError: () => {
      // The in-place dialog is the surface for the handled Conflict, so suppress
      // the wrapper's error toast. Unexpected failures are logged and reported by
      // the boundary instead.
    },
  });
  const [isDeleteErrorDialogOpen, setIsDeleteErrorDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<unknown>(null);
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
    try {
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
    } catch (error) {
      const { type } = parseIpcError(error);
      // Core blocks the delete with a Conflict when an Entry in another
      // Collection still references into this one, so surface that in place and
      // explain it. Any other failure was already routed to the root error
      // boundary, so there is nothing to handle here.
      if (type === 'Conflict') {
        setDeleteError(error);
        setIsDeleteErrorDialogOpen(true);
      }
    }
  };

  const { type: deleteErrorType } = parseIpcError(deleteError);

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

              <Dialog
                open={isDeleteErrorDialogOpen}
                onOpenChange={setIsDeleteErrorDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Could not delete this Collection</DialogTitle>
                    <DialogDescription>
                      {describeCoreError(
                        deleteErrorType,
                        deleteErrorDescriptions,
                        deleteErrorFallback
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </PageSection>
      </CollectionForm>
    </Page>
  );
}

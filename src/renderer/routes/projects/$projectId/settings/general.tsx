import { zodResolver } from '@hookform/resolvers/zod';
import { parseIpcError } from '@root/src/shared/ipcError';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Trash } from 'lucide-react';
import { type ReactElement, useEffect, useId, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { ProjectForm } from '@renderer/components/forms/project-form';
import { Page } from '@renderer/components/page';
import { PageSection } from '@renderer/components/page-section';
import { Button } from '@renderer/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog';
import { useBreadcrumb } from '@renderer/hooks/useBreadcrumb';
import { useProject } from '@renderer/hooks/useProject';
import { describeCoreError } from '@renderer/lib/coreErrorText';
import { queryOptions } from '@renderer/queries';

import {
  type CoreErrorType,
  type UpdateProjectProps,
  updateProjectSchema,
} from '@elek-io/core';

export const Route = createFileRoute('/projects/$projectId/settings/general')({
  component: ProjectSettingsGeneralPage,
});

// Why the normal delete was blocked, keyed by the CoreError type preserved
// across IPC. Unlisted types (and non-Core errors) fall back to the generic
// sentence below.
const forceDeleteDescriptions: Partial<Record<CoreErrorType, string>> = {
  PreconditionFailed:
    'This Project only exists on this device (no remote copy). Force delete removes it permanently.',
  Conflict:
    'This Project has local changes not yet pushed to its remote. Force delete discards those unpushed changes permanently.',
};

const forceDeleteFallback =
  'This Project is not synchronized to a remote, or it has changes that were never pushed. Deleting it now removes those changes permanently, with no way to recover them.';

function ProjectSettingsGeneralPage(): ReactElement {
  const router = useRouter();
  const { projectId } = Route.useParams();
  useBreadcrumb(Route, 'General');
  const {
    projectQuery: { data: project, isPending: isReadingProject },
  } = useProject();
  const formId = useId();
  const updateProjectForm = useForm<UpdateProjectProps>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      id: projectId,
      name: '',
      description: '',
      settings: {
        language: {
          default: 'en',
          supported: ['en'],
        },
      },
    },
  });

  // Reset form with Project data when it loads
  useEffect(() => {
    if (isReadingProject === false) {
      updateProjectForm.reset({
        id: project.id,
        name: project.name,
        description: project.description,
        settings: project.settings,
      });
    }
  }, [project, isReadingProject, updateProjectForm]);

  const { mutateAsync: updateProject, isPending: isUpdatingProject } =
    useMutation(queryOptions.projects.update);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isForceDeleteDialogOpen, setIsForceDeleteDialogOpen] = useState(false);
  const [forceDeleteError, setForceDeleteError] = useState<unknown>(null);

  const { mutateAsync: deleteProject, isPending: isDeletingProject } =
    useMutation({
      ...queryOptions.projects.delete,
      // Only the delete guard is handled in place by the force-delete dialog: a
      // local-only Project (PreconditionFailed) or one with unpushed commits
      // (Conflict). Every other failure is unexpected, so let it reach the root
      // error boundary, which logs it and reports it to Sentry.
      throwOnError: (error) => {
        const { type } = parseIpcError(error);
        return type !== 'PreconditionFailed' && type !== 'Conflict';
      },
      onError: () => {
        // The force-delete dialog is the surface for the handled guard, so
        // suppress the wrapper's error toast. Unexpected failures are logged and
        // reported by the boundary instead.
      },
    });

  function Description(): ReactElement {
    return <>Here you will be able to tweak this project to your liking</>;
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          type="submit"
          form={formId}
          Icon={Check}
          isLoading={isUpdatingProject}
          disabled={updateProjectForm.formState.isDirty === false}
        >
          Save changes
        </Button>
      </>
    );
  }

  const onUpdate: SubmitHandler<UpdateProjectProps> = async (project) => {
    await updateProject(project);
  };

  const onDelete = async (): Promise<void> => {
    try {
      await deleteProject({ id: projectId });
      await router.navigate({ to: '/projects' });
    } catch (error) {
      const { type } = parseIpcError(error);
      // Only the guard offers a force delete (see throwOnError above): a
      // local-only Project (PreconditionFailed) or one with unpushed commits
      // (Conflict). Keep the error so the force-delete dialog can explain the
      // reason. Any other failure was already routed to the root error boundary,
      // so there is nothing to handle here.
      if (type === 'PreconditionFailed' || type === 'Conflict') {
        setForceDeleteError(error);
        setIsDeleteDialogOpen(false);
        setIsForceDeleteDialogOpen(true);
      }
    }
  };

  const onForceDelete = async (): Promise<void> => {
    try {
      await deleteProject({ id: projectId, force: true });
      await router.navigate({ to: '/projects' });
    } catch {
      // A force delete bypasses the guard, so any failure here is unexpected.
      // throwOnError routes it to the root error boundary (which logs and reports
      // it); close this dialog so it is not left in front of the boundary.
      setIsForceDeleteDialogOpen(false);
    }
  };

  const { type: forceDeleteErrorType } = parseIpcError(forceDeleteError);

  return (
    <Page
      title="General Settings"
      description={<Description />}
      actions={<Actions />}
    >
      <ProjectForm
        id={formId}
        projectForm={updateProjectForm}
        isViewOnly={isReadingProject || isUpdatingProject}
        onFormSubmit={onUpdate}
      >
        <PageSection
          title="Delete this Project from this device"
          description="The action does not delete this Project from other devices - just
              from the device you are currently using. But if this is the only
              device your Project is stored at, you will remove it permanently -
              there is no going back. Please be certain."
          actions={
            <>
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button Icon={Trash} variant="destructive">
                    Delete Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove this Project?</DialogTitle>
                    <DialogDescription>
                      You are about to delete the Project from this device.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      Icon={Trash}
                      variant="destructive"
                      isLoading={isDeletingProject}
                      onClick={() => void onDelete()}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isForceDeleteDialogOpen}
                onOpenChange={setIsForceDeleteDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Force delete this Project?</DialogTitle>
                    <DialogDescription>
                      {describeCoreError(
                        forceDeleteErrorType,
                        forceDeleteDescriptions,
                        forceDeleteFallback
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      Icon={Trash}
                      variant="destructive"
                      isLoading={isDeletingProject}
                      onClick={() => void onForceDelete()}
                    >
                      Yes, delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          }
        />
      </ProjectForm>
    </Page>
  );
}

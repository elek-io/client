import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Trash } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';

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
import { queryOptions } from '@renderer/queries';

import { type UpdateProjectProps, updateProjectSchema } from '@elek-io/core';

export const Route = createFileRoute('/projects/$projectId/settings/general')({
  component: ProjectSettingsGeneralPage,
});

function ProjectSettingsGeneralPage(): ReactElement {
  const router = useRouter();
  const { projectId } = Route.useParams();
  useBreadcrumb(Route, 'General');
  const {
    projectQuery: { data: project, isPending: isReadingProject },
  } = useProject();
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

  const { mutateAsync: deleteProject, isPending: isDeletingProject } =
    useMutation({
      ...queryOptions.projects.delete,
      // We handle the guarded delete in place with the force-delete dialog below
      // instead of showing the root error boundary.
      throwOnError: false,
      onError: () => {
        // Prevents the error toast from showing up too
      },
    });

  function Description(): ReactElement {
    return <>Here you will be able to tweak this project to your liking</>;
  }

  /**
   * @todo Save Button should be in state "disabled" until there is a difference between props.currentProject and formData.
   * Otherwise git is throwing an error without a message (probably because there is no change that can be committed)
   */
  function Actions(): ReactElement {
    return (
      <>
        <Button
          Icon={Check}
          onClick={updateProjectForm.handleSubmit(onUpdate)}
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
    } catch {
      // Core guards deletion that would destroy unsynchronized work (a
      // local-only Project, or one with unpushed commits). Offer to force it.
      setIsDeleteDialogOpen(false);
      setIsForceDeleteDialogOpen(true);
    }
  };

  const onForceDelete = async (): Promise<void> => {
    try {
      await deleteProject({ id: projectId, force: true });
      await router.navigate({ to: '/projects' });
    } catch {
      setIsForceDeleteDialogOpen(false);
      toast.error('Could not delete this Project');
    }
  };

  return (
    <Page
      title="General Settings"
      description={<Description />}
      actions={<Actions />}
    >
      <ProjectForm
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
                      This Project is not synchronized to a remote, or it has
                      changes that were never pushed. Deleting it now removes
                      those changes permanently, with no way to recover them.
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

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Trash } from 'lucide-react';
import { type ReactElement, useEffect } from 'react';
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
import { queryOptions } from '@renderer/queries';

import {
  type DeleteProjectProps,
  type UpdateProjectProps,
  updateProjectSchema,
} from '@elek-io/core';

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

  const { mutateAsync: deleteProject, isPending: isDeletingProject } =
    useMutation(queryOptions.projects.delete);

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

  const onDelete: SubmitHandler<DeleteProjectProps> = async (project) => {
    // TODO: no force fallback. A local-only project has no origin, so Core
    // rejects with 412 (or 409 when commits are unpushed) and it can never be
    // deleted from the UI. On failure, open a force-delete confirmation modal
    // that retries with force true. Then add test P0-11 in
    // contributing/e2e-test-backlog.md.
    await deleteProject({ id: project.id });
    await router.navigate({ to: '/projects' });
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
            <Dialog>
              <DialogTrigger asChild>
                <Button Icon={Trash} variant="destructive">
                  Delete Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone if your Project is not
                    replicated somewhere else than this device.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      No, I&apos;ve changed my mind
                    </Button>
                  </DialogClose>
                  <Button
                    Icon={Trash}
                    variant="destructive"
                    isLoading={isDeletingProject}
                    onClick={() => onDelete({ id: projectId })}
                  >
                    Yes, delete this Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
      </ProjectForm>
    </Page>
  );
}

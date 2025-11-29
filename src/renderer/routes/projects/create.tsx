import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { CreateUpdateProjectPage } from '@renderer/components/pages/create-update-project-page';
import { Button } from '@renderer/components/ui/button';
import queryOptions from '@renderer/queries/options';

import { type CreateProjectProps, createProjectSchema } from '@elek-io/core';

export const Route = createFileRoute('/projects/create')({
  component: CreateProjectPage,
});

function CreateProjectPage(): ReactElement {
  const router = useRouter();
  const createProjectForm = useForm<CreateProjectProps>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
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
  const { mutateAsync: createProject, isPending: isCreatingProject } =
    useMutation(queryOptions.projects.create);

  function Description(): ReactElement {
    return (
      <>
        New Projects start with no history or data.
        <br />
        Read more about <a href="#">Projects in the documentation</a>.
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          Icon={Check}
          isLoading={isCreatingProject}
          onClick={createProjectForm.handleSubmit(onCreate)}
        >
          Create Project
        </Button>
      </>
    );
  }

  const onCreate: SubmitHandler<CreateProjectProps> = async (project) => {
    const newProject = await createProject(project);
    await router.navigate({
      to: '/projects/$projectId',
      params: { projectId: newProject.id },
    });
  };

  return (
    <CreateUpdateProjectPage
      title="Create a new Project"
      description={<Description />}
      actions={<Actions />}
      projectForm={createProjectForm}
      isLoading={isCreatingProject}
      onFormSubmit={onCreate}
    />
  );
}

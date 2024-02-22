import { Project } from '@elek-io/shared';
import { Button, FormInput, Page } from '@elek-io/ui';
import { CheckIcon } from '@heroicons/react/20/solid';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute('/projects/create')({
  component: CreateProjectPage,
});

function CreateProjectPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const data = Route.useLoaderData();
  const [isCreatingProject, setCreatingProject] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Project>();

  function Description(): ReactElement {
    return (
      <>
        New Projects start with no history or data.
        <br></br>
        Read more about{' '}
        <a href="#" className="text-brand-600 hover:underline">
          Projects in the documentation
        </a>
        .
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          intent="primary"
          prependIcon={CheckIcon}
          state={isCreatingProject ? 'loading' : undefined}
          onClick={handleSubmit(onCreate)}
        >
          Create Project
        </Button>
      </>
    );
  }

  const onCreate: SubmitHandler<Project> = async (project) => {
    try {
      setCreatingProject(true);
      const newProject = await context.core.projects.create({
        ...project,
      });
      // props.addNotification({
      //   intent: NotificationIntent.SUCCESS,
      //   title: 'Successfully created Project',
      //   description: `The Project "${project.name}" was successfully created.`,
      // });
      router.navigate({
        to: '/projects/$projectId',
        params: { projectId: newProject.id },
      });
    } catch (error) {
      setCreatingProject(false);
      console.error(error);
      // props.addNotification({
      //   intent: NotificationIntent.DANGER,
      //   title: 'Failed to create Project',
      //   description: 'There was an error creating the Project on disk.',
      // });
    }
  };

  return (
    <Page
      breadcrumbs={[]}
      title="Create a new Project"
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      {/* {JSON.stringify(watch())}
      <hr /> */}
      <FormInput
        name={'name'}
        type="text"
        label="Name"
        placeholder="The next big thing"
        description="Give your new Project a name"
        register={register}
        errors={errors}
      ></FormInput>
      <FormInput
        name={'description'}
        type="text"
        label="Description"
        placeholder="It's the best of all worlds, combined whith a sprinkle of magic dust."
        description="A describing text of what this new Project is about."
        register={register}
        errors={errors}
      ></FormInput>
    </Page>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@renderer/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import { Input } from '@renderer/components/ui/input';
import { Page } from '@renderer/components/ui/page';
import { Textarea } from '@renderer/components/ui/textarea';
import { useStore } from '@renderer/store';

import { type CreateProjectProps, createProjectSchema } from '@elek-io/core';

export const Route = createFileRoute('/projects/create')({
  component: CreateProjectPage,
});

function CreateProjectPage(): ReactElement {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isCreatingProject, setCreatingProject] = useState(false);
  const createProjectForm = useForm<CreateProjectProps>({
    resolver: async (data, context, options) => {
      return zodResolver(createProjectSchema)(data, context, options);
    },
    defaultValues: {
      name: '',
      description: '',
    },
  });

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
    try {
      setCreatingProject(true);
      const newProject = await context.core.projects.create({
        ...project,
      });
      addNotification({
        intent: 'success',
        title: 'Successfully created Project',
        description: `The Project "${project.name}" was successfully created.`,
      });
      await router.navigate({
        to: '/projects/$projectId',
        params: { projectId: newProject.id },
      });
    } catch (error) {
      setCreatingProject(false);
      await context.core.logger.error({
        source: 'desktop',
        message: 'Failed to create Project',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to create Project',
        description: 'There was an error creating the Project on disk.',
      });
    }
  };

  return (
    <Page
      title="Create a new Project"
      description={<Description />}
      actions={<Actions />}
    >
      <Form {...createProjectForm}>
        <form onSubmit={createProjectForm.handleSubmit(onCreate)}>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={createProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel isRequired>Project name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createProjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel isRequired>Project description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </Page>
  );
}

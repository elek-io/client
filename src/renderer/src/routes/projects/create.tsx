import { type CreateProjectProps, createProjectSchema } from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { NotificationIntent, useStore } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

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
      // you can debug your validation schema here
      console.log(
        'ProjectForm validation result',
        await zodResolver(createProjectSchema)(data, context, options)
      );
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
          isLoading={isCreatingProject}
          onClick={createProjectForm.handleSubmit(onCreate)}
        >
          <Check className="w-4 h-4 mr-2"></Check>
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
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully created Project',
        description: `The Project "${project.name}" was successfully created.`,
      });
      router.navigate({
        to: '/projects/$projectId',
        params: { projectId: newProject.id },
      });
    } catch (error) {
      setCreatingProject(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create Project',
        description: 'There was an error creating the Project on disk.',
      });
    }
  };

  return (
    <Page
      title="Create a new Project"
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <Form {...createProjectForm}>
        <form onSubmit={createProjectForm.handleSubmit(onCreate)}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={createProjectForm.control}
                name={'name'}
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel isRequired={true}>Project name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createProjectForm.control}
                name={'description'}
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel isRequired={true}>Project description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
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

import { Button } from '@/renderer/react/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/renderer/react/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/renderer/react/components/ui/form';
import { Input } from '@/renderer/react/components/ui/input';
import { Page } from '@/renderer/react/components/ui/page';
import { PageSection } from '@/renderer/react/components/ui/page-section';
import { Textarea } from '@/renderer/react/components/ui/textarea';
import { Project, projectSchema } from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Trash } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute('/projects/$projectId/settings/general')({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const projectForm = useForm<Project>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'ProjectForm validation result',
        await zodResolver(projectSchema)(data, context, options)
      );
      return zodResolver(projectSchema)(data, context, options);
    },
    defaultValues: context.currentProject,
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
          onClick={projectForm.handleSubmit(onUpdate)}
          isLoading={isUpdatingProject}
          disabled={projectForm.formState.isDirty === false}
        >
          <Check className="w-4 h-4 mr-2"></Check>
          Save changes
        </Button>
      </>
    );
  }

  const onUpdate: SubmitHandler<Project> = async (project) => {
    try {
      setIsUpdatingProject(true);
      await context.core.projects.update(project);
      setIsUpdatingProject(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully updated Project',
        description: 'The Project was successfully updated.',
      });
      router.invalidate();
    } catch (error) {
      setIsUpdatingProject(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Project',
        description: 'There was an error updating the Project on disk.',
      });
    }
  };

  const onDelete: SubmitHandler<Project> = async (project) => {
    try {
      await context.core.projects.delete({ id: project.id });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully deleted Project',
        description: 'The Project was successfully deleted.',
      });
      router.navigate({ to: '/projects' });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Project',
        description: 'There was an error deleting the Project from disk.',
      });
    }
  };

  return (
    <Page
      title={`General Settings`}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <Form {...projectForm}>
        <form onSubmit={projectForm.handleSubmit(onUpdate)}>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={projectForm.control}
                name={'name'}
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel>Project name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={projectForm.control}
                name={'description'}
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel>Project description</FormLabel>
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

          <PageSection
            title="Locale"
            description="Settings related to the supported languages of this Project"
          ></PageSection>

          <PageSection title="Danger Zone">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium leading-6">
                  Delete this Project from your current device
                </p>
                <p className="text-sm text-gray-500">
                  The action does not delete this Project from other devices -
                  just from the device you are currently using. But if this is
                  the only device your Project is stored at, you will remove it
                  permanently - there is no going back. Please be certain.
                </p>
              </div>
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash className="w-4 h-4 mr-2"></Trash>
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
                          No, I've changed my mind
                        </Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={projectForm.handleSubmit(onDelete)}
                      >
                        <Trash className="w-4 h-4 mr-2"></Trash>
                        Yes, delete this Project
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </PageSection>
        </form>
      </Form>
    </Page>
  );
}

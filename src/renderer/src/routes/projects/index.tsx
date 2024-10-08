import { CloneProjectProps } from '@elek-io/core';
import { Button } from '@renderer/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import { FormInput } from '@renderer/components/ui/form-input';
import { Page } from '@renderer/components/ui/page';
import { NotificationIntent, useStore } from '@renderer/store';
import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { DownloadCloud, Plus } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute('/projects/')({
  beforeLoad: async ({ context }) => {
    const projects = await context.core.projects.list({ limit: 0 });

    return { projects };
  },
  component: ListProjectsPage,
});

function ListProjectsPage(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const cloneProjectForm = useForm<CloneProjectProps>({
    defaultValues: {
      url: '',
    },
  });
  const [isCloningDialogOpen, setIsCloningDialogOpen] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const onCloneProject: SubmitHandler<CloneProjectProps> = async (props) => {
    setIsCloning(true);
    try {
      await context.core.projects.clone(props);
      setIsCloning(false);
      setIsCloningDialogOpen(false);
      await router.invalidate();
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully cloned Project',
        description: 'The Project was successfully cloned.',
      });
    } catch (error) {
      setIsCloning(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to clone Project',
        description: 'There was an error cloning the Project.',
      });
    }
  };

  function Description(): ReactElement {
    return (
      <>
        A Project ...
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
        <Button onClick={() => router.navigate({ to: '/projects/create' })}>
          <Plus className="w-4 h-4 mr-2"></Plus>
          Create Project
        </Button>
        <Dialog
          open={isCloningDialogOpen}
          onOpenChange={setIsCloningDialogOpen}
        >
          <DialogTrigger asChild>
            <Button variant={'outline'}>
              <DownloadCloud className="w-4 h-4 mr-2" />
              Clone Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clone a Project by URL</DialogTitle>
              <DialogDescription>
                You can clone an existing Project by providing the URL. Make
                sure you have the necessary permissions to access the Project.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-6">
              <Form {...cloneProjectForm}>
                <form onSubmit={cloneProjectForm.handleSubmit(onCloneProject)}>
                  <FormField
                    control={cloneProjectForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel isRequired={true}>URL</FormLabel>
                        <FormControl>
                          <FormInput field={field} type="text" />
                        </FormControl>
                        <FormDescription></FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            <DialogFooter>
              <Button
                onClick={cloneProjectForm.handleSubmit(onCloneProject)}
                isLoading={isCloning}
              >
                <DownloadCloud className="w-4 h-4 mr-2" /> Clone
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Page
      title="Projects"
      description={<Description></Description>}
      actions={<Actions></Actions>}
      layout="bare"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {context.projects.list.map((project) => {
          return (
            <Link
              key={project.id}
              to="/projects/$projectId/dashboard"
              params={{ projectId: project.id }}
              className="no-underline"
            >
              <Card className="transition hover:shadow-lg hover:dark:border-zinc-200">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                {/* <CardContent>
                  <Badge>Core version: {project.coreVersion}</Badge>
                </CardContent> */}
              </Card>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}

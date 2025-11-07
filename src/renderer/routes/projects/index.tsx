import { Link, createFileRoute, useRouter } from '@tanstack/react-router';
import { DownloadCloud, EllipsisIcon, Plus } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { Badge, RemoteOriginBadge } from '@renderer/components/ui/badge';
import { Button } from '@renderer/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@renderer/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@renderer/components/ui/empty';
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

import { type CloneProjectProps } from '@elek-io/core';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

export const Route = createFileRoute('/projects/')({
  beforeLoad: async ({ context }) => {
    const projects = await context.core.projects.list({ limit: 0 });

    return { projects };
  },
  component: ListProjectsPage,
});

function ListProjectsPage(): ReactElement {
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
        Read more about <a href="#">Projects in the documentation</a>.
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          Icon={Plus}
          onClick={() => router.navigate({ to: '/projects/create' })}
        >
          Create Project
        </Button>
        <Dialog
          open={isCloningDialogOpen}
          onOpenChange={setIsCloningDialogOpen}
        >
          <DialogTrigger asChild>
            <Button Icon={DownloadCloud} variant={'secondary'}>
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

            <DialogBody>
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
            </DialogBody>

            <DialogFooter>
              <Button
                Icon={DownloadCloud}
                onClick={cloneProjectForm.handleSubmit(onCloneProject)}
                isLoading={isCloning}
              >
                Clone
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
      {context.projects.total === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus />
            </EmptyMedia>
            <EmptyTitle>No Projects yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any Projects yet. Get started by creating
              a new or cloning an existing Project.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {context.projects.list.map((project) => {
            return (
              <Card key={project.id} className="hover:border-accent-foreground">
                <CardHeader>
                  <Link
                    to="/projects/$projectId/dashboard"
                    params={{ projectId: project.id }}
                    className="no-underline"
                  >
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </Link>
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon">
                          <EllipsisIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuItem>Subscription</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <RemoteOriginBadge
                    variant={'outline'}
                    remoteOriginUrl={project.remoteOriginUrl}
                  />
                  <Badge variant={'outline'}>
                    Core version: {project.coreVersion}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}

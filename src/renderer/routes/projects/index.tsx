import queryOptions from '@root/src/renderer/queries/options';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { DownloadCloud, Plus } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { FormInput } from '@renderer/components/form-input';
import { Page } from '@renderer/components/page';
import {
  ProjectCard,
  ProjectCardSkeleton,
} from '@renderer/components/project-card';
import { Button } from '@renderer/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import { type CloneProjectProps } from '@elek-io/core';

export const Route = createFileRoute('/projects/')({
  component: ListProjectsPage,
});

function ListProjectsPage(): ReactElement {
  const router = useRouter();
  const {
    data: projects,
    isPending: isProjectsPending,
    isError: isProjectsError,
    error: projectsError,
  } = useQuery(
    queryOptions.projects.list({
      limit: 0,
    })
  );
  const cloneProjectForm = useForm<CloneProjectProps>({
    defaultValues: {
      url: '',
    },
  });
  const { mutateAsync: cloneProject, isPending: isCloningProject } =
    useMutation(queryOptions.projects.clone);
  const [isCloningDialogOpen, setIsCloningDialogOpen] = useState(false);

  const onCloneProject: SubmitHandler<CloneProjectProps> = async (props) => {
    await cloneProject(props);
    setIsCloningDialogOpen(false);
  };

  function Description(): ReactElement {
    return (
      <>
        A Project ...
        <br />
        Read more about <a href="#">Projects in the documentation</a>.
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          Icon={Plus}
          onClick={async () => router.navigate({ to: '/projects/create' })}
        >
          Create Project
        </Button>
        <Button
          Icon={DownloadCloud}
          variant={'secondary'}
          onClick={() => setIsCloningDialogOpen(true)}
        >
          Clone Project
        </Button>
      </>
    );
  }

  if (isProjectsError) {
    throw projectsError;
  }

  return (
    <>
      <Page
        title="Projects"
        description={<Description></Description>}
        actions={<Actions></Actions>}
        layout="bare"
      >
        {isProjectsPending ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => {
              return <ProjectCardSkeleton key={i} />;
            })}
          </div>
        ) : projects.total === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Plus />
              </EmptyMedia>
              <EmptyTitle>No Projects yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t created any Projects yet. Get started by
                creating a new or cloning an existing Project.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {projects.list.map((project) => {
              return <ProjectCard key={project.id} project={project} />;
            })}
          </div>
        )}
      </Page>

      <Dialog open={isCloningDialogOpen} onOpenChange={setIsCloningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone a Project by URL</DialogTitle>
            <DialogDescription>
              You can clone an existing Project by providing the URL. Make sure
              you have the necessary permissions to access the Project.
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
              isLoading={isCloningProject}
            >
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

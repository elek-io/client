import { zodResolver } from '@hookform/resolvers/zod';
import { useProject } from '@root/src/renderer/hooks/useProject';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { Page } from '@renderer/components/page';
import { PageSection } from '@renderer/components/page-section';
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
import queryOptions from '@renderer/queries/options';

import {
  type SetRemoteOriginUrlProjectProps,
  setRemoteOriginUrlProjectSchema,
} from '@elek-io/core';

export const Route = createFileRoute(
  '/projects/$projectId/settings/version-control'
)({
  component: ProjectSettingsVersionControlPage,
});

function ProjectSettingsVersionControlPage(): ReactElement {
  const { projectId } = Route.useParams();
  const {
    projectQuery: { data: project, isPending: isReadingProject },
  } = useProject();
  const {
    mutateAsync: setRemoteOriginUrl,
    isPending: isSettingRemoteOriginUrl,
  } = useMutation(queryOptions.projects.setRemoteOriginUrl);
  const remoteOriginUrlForm = useForm<SetRemoteOriginUrlProjectProps>({
    resolver: async (data, context, options) => {
      return zodResolver(setRemoteOriginUrlProjectSchema)(
        data,
        context,
        options
      );
    },
    defaultValues: {
      id: projectId,
      url: '',
    },
  });
  // Reset form with Project data when it loads
  useEffect(() => {
    if (isReadingProject === false) {
      remoteOriginUrlForm.reset({
        id: project.id,
        url: project.remoteOriginUrl !== null ? project.remoteOriginUrl : '',
      });
    }
  }, [project, isReadingProject, remoteOriginUrlForm]);

  function Description(): ReactElement {
    return <></>;
  }

  function Actions(): ReactElement {
    return <></>;
  }

  const onSetRemoteOriginUrl: SubmitHandler<
    SetRemoteOriginUrlProjectProps
  > = async (props) => {
    await setRemoteOriginUrl(props);
  };

  return (
    <Page
      title="Version Control Settings"
      description={<Description />}
      actions={<Actions />}
    >
      <Form {...remoteOriginUrlForm}>
        <form>
          <PageSection
            title="Remote"
            description="A Projects remote is a place that makes it accessible for other users. By adding a remote you are able to work with multiple others together on the same Project."
            actions={
              <Button
                Icon={Check}
                onClick={remoteOriginUrlForm.handleSubmit(onSetRemoteOriginUrl)}
                isLoading={isSettingRemoteOriginUrl}
                disabled={remoteOriginUrlForm.formState.isDirty === false}
              >
                Save changes
              </Button>
            }
          >
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={remoteOriginUrlForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel isRequired>Remote URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </PageSection>
        </form>
      </Form>
    </Page>
  );
}

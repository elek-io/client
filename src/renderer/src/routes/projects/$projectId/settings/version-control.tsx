import {
  type SetRemoteOriginUrlProjectProps,
  setRemoteOriginUrlProjectSchema,
} from '@elek-io/core';
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
import { PageSection } from '@renderer/components/ui/page-section';
import { NotificationIntent, useStore } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute(
  '/projects/$projectId/settings/version-control'
)({
  component: ProjectSettingsVersionControlPage,
});

function ProjectSettingsVersionControlPage(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isSettingRemoteOriginUrl, setIsSettingRemoteOriginUrl] =
    useState(false);
  const remoteOriginUrlForm = useForm<SetRemoteOriginUrlProjectProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'GitRemoteForm validation result',
        await zodResolver(setRemoteOriginUrlProjectSchema)(
          data,
          context,
          options
        )
      );
      return zodResolver(setRemoteOriginUrlProjectSchema)(
        data,
        context,
        options
      );
    },
    defaultValues: {
      id: context.project.id,
      url: context.project.remoteOriginUrl || '',
    },
  });

  function Description(): ReactElement {
    return <></>;
  }

  function Actions(): ReactElement {
    return <></>;
  }

  const onSetRemoteOriginUrl: SubmitHandler<
    SetRemoteOriginUrlProjectProps
  > = async (props) => {
    try {
      setIsSettingRemoteOriginUrl(true);
      await context.core.projects.setRemoteOriginUrl(props);
      setIsSettingRemoteOriginUrl(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully updated Project remote',
        description: 'The Project was successfully updated.',
      });
      router.invalidate();
    } catch (error) {
      setIsSettingRemoteOriginUrl(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Project remote',
        description: 'There was an error updating the Project.',
      });
    }
  };

  return (
    <Page
      title={`Version Control Settings`}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <Form {...remoteOriginUrlForm}>
        <form>
          <PageSection
            title="Remote"
            description="A Projects remote is a place that makes it accessible for other users. By adding a remote you are able to work with multiple others together on the same Project."
            actions={
              <Button
                onClick={remoteOriginUrlForm.handleSubmit(onSetRemoteOriginUrl)}
                isLoading={isSettingRemoteOriginUrl}
                disabled={remoteOriginUrlForm.formState.isDirty === false}
              >
                <Check className="w-4 h-4 mr-2"></Check>
                Save changes
              </Button>
            }
          >
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={remoteOriginUrlForm.control}
                name={'url'}
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel isRequired={true}>Remote URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
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

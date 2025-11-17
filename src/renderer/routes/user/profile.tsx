import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { CommitHistory } from '@renderer/components/commit-history';
import { FormInput } from '@renderer/components/form-input';
import { Page } from '@renderer/components/page';
import { PageSection } from '@renderer/components/page-section';
import { Button } from '@renderer/components/ui/button';
import { Card } from '@renderer/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import { Switch } from '@renderer/components/ui/switch';
import { UserHeader } from '@renderer/components/user-header';
import { useStore } from '@renderer/store';

import {
  type GitCommit,
  type SetUserProps,
  setUserSchema,
  supportedLanguageSchema,
} from '@elek-io/core';

export const Route = createFileRoute('/user/profile')({
  beforeLoad: async ({ context }) => {
    const user = await context.core.user.get();

    return { user };
  },
  component: UserProfilePage,
});

function UserProfilePage(): ReactElement {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isSettingUser, setIsSettingUser] = useState(false);
  const setUserForm = useForm<SetUserProps>({
    resolver: async (data, context, options) => {
      return zodResolver(setUserSchema)(data, context, options);
    },
    defaultValues: {
      userType: 'local',
      name: context.user?.name !== undefined ? context.user.name : '',
      email: context.user?.email !== undefined ? context.user.email : '',
      language:
        context.user?.language !== undefined ? context.user.language : 'en',
      localApi: {
        port:
          context.user?.localApi.port !== undefined
            ? context.user.localApi.port
            : 31310,
        isEnabled:
          context.user?.localApi.isEnabled !== undefined
            ? context.user.localApi.isEnabled
            : false,
      },
    },
  });
  const exampleCommit: GitCommit = {
    hash: '1234567890',
    author: {
      name: setUserForm.watch('name'),
      email: setUserForm.watch('email'),
    },
    datetime: new Date().toISOString(),
    tag: null,
    message: {
      method: 'create',
      reference: {
        objectType: 'project',
        id: '1',
      },
    },
  };
  const localApiUrl = `http://localhost:${setUserForm.watch('localApi.port')}/v1/ui`;

  function Description(): ReactElement {
    if (context.user === null) {
      return (
        <>
          Before we start you need to set up a local User first. Don&apos;t
          worry, you are not creating an account and this information is only
          saved locally on this device! Read more about{' '}
          <a href="#">local Users in our documentation</a> if you have questions
          about this step.
        </>
      );
    }

    return (
      <>
        By editing your Users details, ... Read more about{' '}
        <a href="#">local Users in our documentation</a>.
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          onClick={setUserForm.handleSubmit(onSetUser)}
          isLoading={isSettingUser}
          Icon={Check}
        >
          Save local User
        </Button>
      </>
    );
  }

  function LocalApiDescription(): ReactElement {
    return (
      <>
        Use the local API to read data from your local Projects. The local API
        is only accessible on this device. You can access it at{' '}
        <a href={localApiUrl} target="_blank" rel="noreferrer">
          {localApiUrl}
        </a>{' '}
        once it is enabled.
      </>
    );
  }

  const onSetUser: SubmitHandler<SetUserProps> = async (props) => {
    setIsSettingUser(true);
    try {
      const user = await context.core.user.set(props);
      const isLocalApiRunning = await context.core.api.isRunning();

      if (user.localApi.isEnabled === true && isLocalApiRunning === false) {
        await context.core.api.start(user.localApi.port);
      }

      if (user.localApi.isEnabled === false && isLocalApiRunning === true) {
        await context.core.api.stop();
      }

      setIsSettingUser(false);
      await router.navigate({ to: '/projects' });
      addNotification({
        intent: 'success',
        title: 'Successfully setup User',
        description: 'The User was successfully setup.',
      });
    } catch (error) {
      setIsSettingUser(false);
      await context.core.logger.error({
        source: 'desktop',
        message: 'Failed to setup User',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to setup User',
        description: 'There was an error setting up the User.',
      });
    }
  };

  return (
    <>
      {context.user !== null ? <UserHeader user={context.user} /> : null}
      <Page
        title={
          context.user === null ? 'Welcome to elek.io Client' : 'User profile'
        }
        description={<Description />}
        actions={<Actions />}
        layout="bare"
      >
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
          <Card className="py-0 lg:col-span-2">
            <Form {...setUserForm}>
              <form>
                <PageSection
                  title="Local User"
                  description="Fill out your information below and watch it influence how your future changes will look like on the right."
                  className="rounded-t-xl border-t-0"
                >
                  <div className="grid gap-6">
                    <FormField
                      control={setUserForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired>Preferred language</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {supportedLanguageSchema.options.map(
                                  (option) => {
                                    return (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    );
                                  }
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Changing your preferred language will attempt to
                            translate everything you see in elek.io Client. You
                            can help translate elek.io Client by contributing to
                            our{' '}
                            <a
                              href="https://github.com/elek-io/client"
                              target="_blank"
                              rel="noreferrer"
                            >
                              GitHub repository
                            </a>
                            .
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={setUserForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired>Full name</FormLabel>
                          <FormControl>
                            <FormInput field={field} type="text" />
                          </FormControl>
                          <FormDescription>
                            Your name will be used by others to identify changes
                            made by you.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={setUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired>Email</FormLabel>
                          <FormControl>
                            <FormInput field={field} type="email" />
                          </FormControl>
                          <FormDescription>
                            Your email allows other members of Projects to
                            contact you.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </PageSection>
                <PageSection
                  title="Local API"
                  description={<LocalApiDescription />}
                >
                  <div className="grid gap-6">
                    <FormField
                      control={setUserForm.control}
                      name="localApi.port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired>Port</FormLabel>
                          <FormControl>
                            <FormInput field={field} type="number" />
                          </FormControl>
                          <FormDescription>
                            The port used to access the local API. Make sure it
                            is not in use by another application.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={setUserForm.control}
                      name="localApi.isEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-800">
                          <div className="mr-4">
                            <FormLabel isRequired>Enabled</FormLabel>
                            <FormDescription>
                              Enabling the local API allows you to read local
                              Project data.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </PageSection>
              </form>
            </Form>
          </Card>
          <aside className="grid grid-cols-1">
            <PageSection
              title="Example change"
              description="This is how a change made by you will look like based on the information you've given on the left."
              standalone
            >
              <CommitHistory
                projectId="1"
                commits={[exampleCommit]}
                language={setUserForm.watch('language')}
                disabled
              />
            </PageSection>
          </aside>
        </div>
      </Page>
    </>
  );
}

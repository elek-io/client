import {
  GitCommit,
  SetUserProps,
  setUserSchema,
  supportedLanguageSchema,
} from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@renderer/components/ui/button';
import { CommitHistory } from '@renderer/components/ui/commit-history';
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
import { PageSection } from '@renderer/components/ui/page-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import { Switch } from '@renderer/components/ui/switch';
import { UserHeader } from '@renderer/components/ui/user-header';
import { NotificationIntent, useStore } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute('/user/profile')({
  beforeLoad: async ({ context }) => {
    const user = await context.core.user.get();

    return { user };
  },
  component: UserProfilePage,
});

function UserProfilePage(): JSX.Element {
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
      name: context.user?.name || '',
      email: context.user?.email || '',
      language: context.user?.language || 'en',
      localApi: {
        port: context.user?.localApi.port || 31310,
        isEnabled: context.user?.localApi.isEnabled || false,
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
          Before we start you need to set up a local User first. Don't worry,
          you are not creating an account and this information is only saved
          locally on this device! Read more about{' '}
          <a href="#" className="text-brand-600 hover:underline">
            local Users in our documentation
          </a>{' '}
          if you have questions about this step.
        </>
      );
    }

    return (
      <>
        By editing your Users details, ... Read more about{' '}
        <a href="#" className="text-brand-600 hover:underline">
          local Users in our documentation
        </a>
        .
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          onClick={setUserForm.handleSubmit(onSetUser)}
          isLoading={isSettingUser}
        >
          <Check className="w-4 h-4 mr-2"></Check>
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
        context.core.api.start(user.localApi.port);
      }

      if (user.localApi.isEnabled === false && isLocalApiRunning === true) {
        context.core.api.stop();
      }

      setIsSettingUser(false);
      await router.navigate({ to: '/projects' });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully setup User',
        description: 'The User was successfully setup.',
      });
    } catch (error) {
      setIsSettingUser(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to setup User',
        description: 'There was an error setting up the User.',
      });
    }
  };

  return (
    <>
      {context.user && <UserHeader user={context.user} />}
      <Page
        title={
          context.user === null ? 'Welcome to elek.io Client' : 'User profile'
        }
        description={<Description />}
        actions={<Actions />}
        layout="bare"
      >
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
          <main className="grid-cols-1 gap-4 lg:col-span-2">
            <div className="rounded-lg bg-white dark:bg-zinc-900 shadow">
              <Form {...setUserForm}>
                <form>
                  <PageSection
                    className="border-none space-y-6"
                    title="Local User"
                    description="Fill out your information below and watch it influence how your future changes will look like on the right."
                  >
                    <FormField
                      control={setUserForm.control}
                      name={`language`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired={true}>
                            Preferred language
                          </FormLabel>
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
                      name={`name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired={true}>Full name</FormLabel>
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
                      name={`email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired={true}>Email</FormLabel>
                          <FormControl>
                            <FormInput field={field} type="text" />
                          </FormControl>
                          <FormDescription>
                            Your email allows other members of Projects to
                            contact you.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </PageSection>
                  <PageSection
                    title="Local API"
                    description={<LocalApiDescription />}
                    className="space-y-6"
                  >
                    <FormField
                      control={setUserForm.control}
                      name={`localApi.port`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired={true}>Port</FormLabel>
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
                      name={`localApi.isEnabled`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                          <div className="mr-4">
                            <FormLabel isRequired={true}>Enabled</FormLabel>
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
                  </PageSection>
                </form>
              </Form>
            </div>
          </main>
          <aside className="grid grid-cols-1 gap-4">
            <div className="rounded-lg bg-white dark:bg-zinc-900 shadow">
              <PageSection
                className="border-none"
                title="Example change"
                description="This is how a change made by you will look like based on the information you've given on the left."
              >
                <CommitHistory
                  projectId={'1'}
                  commits={[exampleCommit]}
                  language={setUserForm.watch('language')}
                  disabled={true}
                />
              </PageSection>
            </div>
          </aside>
        </div>
      </Page>
    </>
  );
}

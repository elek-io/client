import {
  SetUserProps,
  setUserSchema,
  supportedLanguageSchema,
} from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@renderer/components/ui/button';
import { Commit } from '@renderer/components/ui/commit';
import {
  Form,
  FormControl,
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
import { NotificationIntent, useStore } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute('/user/profile')({
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
      name: 'John Doe',
      email: 'john.doe@example.com',
      language: 'en',
      window: null,
    },
  });

  function Description(): ReactElement {
    return (
      <>
        Before we start you need to set up a local User first. Don't worry, you
        are not creating an account and this information is only saved locally
        on this device! Read more about{' '}
        <a href="#" className="text-brand-600 hover:underline">
          local Users in our documentation
        </a>{' '}
        if you have questions about this step.
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

  const onSetUser: SubmitHandler<SetUserProps> = async (props) => {
    setIsSettingUser(true);
    try {
      await context.core.user.set(props);
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
    <Page
      title="Welcome to elek.io Client"
      description={<Description />}
      actions={<Actions />}
      layout="bare"
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
        <main className="grid-cols-1 gap-4 lg:col-span-2">
          <div className="rounded-lg bg-white dark:bg-zinc-900 shadow">
            <PageSection
              className="border-none"
              title="Local User"
              description="Fill out your information below and watch it influence how your future changes will look like on the right."
            >
              <Form {...setUserForm}>
                <form className="space-y-4">
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
                              {supportedLanguageSchema.options.map((option) => {
                                return (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </PageSection>
          </div>
        </main>
        <aside className="grid grid-cols-1 gap-4">
          <div className="rounded-lg bg-white dark:bg-zinc-900 shadow">
            <PageSection
              className="border-none"
              title="Example change"
              description="This is how a change made by you will look like based on the information you've given on the left."
            >
              <Commit
                className="p-4 border border-zinc-200 dark:border-zinc-800"
                author={{
                  name: setUserForm.watch('name'),
                  email: setUserForm.watch('email'),
                }}
                datetime={new Date().toISOString()}
                language={setUserForm.watch('language')}
                message=":tada: This is your first change"
                hash="1234567890"
                tag={null}
              />
            </PageSection>
          </div>
        </aside>
      </div>
    </Page>
  );
}

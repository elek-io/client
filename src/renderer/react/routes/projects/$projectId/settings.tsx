import { Project } from '@elek-io/shared';
import {
  Button,
  FormInput,
  FormTextarea,
  NotificationIntent,
  Page,
} from '@elek-io/ui';
import { CheckIcon, TrashIcon } from '@heroicons/react/20/solid';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useStore } from '../../../store';

export const Route = createFileRoute('/projects/$projectId/settings')({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const addNotification = useStore((state) => state.addNotification);
  const router = useRouter();
  const context = Route.useRouteContext();
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<Project>({ defaultValues: context.currentProject });

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
          intent="primary"
          prependIcon={CheckIcon}
          state={
            isUpdatingProject
              ? 'loading'
              : isDirty === false
              ? 'disabled'
              : undefined
          }
          onClick={handleSubmit(onUpdate)}
        >
          Save changes
        </Button>
      </>
    );
  }

  const onUpdate: SubmitHandler<Project> = async (project) => {
    try {
      setIsUpdatingProject(true);
      await window.ipc.core.projects.update(project);
      setIsUpdatingProject(false);
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully updated Project',
        description: 'The Project was successfully updated.',
      });
      // await props.reloadCurrentProject();
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
      await window.ipc.core.projects.delete({ id: project.id });
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
      title={`Settings`}
      layout="overlap-card-no-space"
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <div className="divide-y divide-gray-200 lg:grid lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        <aside className="py-6 lg:col-span-3">
          {/* <nav className="space-y-1">
            {subNavigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <a
                  className={classNames(
                    item.current
                      ? 'border-brand-500 bg-brand-50 text-brand-700 hover:bg-brand-50 hover:text-brand-700'
                      : 'border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center border-l-4 px-3 py-2 text-sm font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  <item.icon
                    className={classNames(
                      item.current
                        ? 'text-brand-500 group-hover:text-brand-500'
                        : 'text-gray-400 group-hover:text-gray-500',
                      '-ml-1 mr-3 h-6 w-6 flex-shrink-0'
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </a>
              </Link>
            ))}
          </nav> */}
        </aside>

        <form className="divide-y divide-gray-200 lg:col-span-9">
          {/* <p>Original Project: {JSON.stringify(props.currentProject)}</p>
          <p>Changed Project: {JSON.stringify(watch())}</p>
          <hr /> */}
          <section className="px-4 py-6 sm:p-6 lg:pb-8 flex-grow space-y-4">
            <div>
              <FormInput
                name={'name'}
                type="text"
                label="Name"
                placeholder="My new Project"
                description="Give your Project a name"
                register={register}
                errors={errors}
              ></FormInput>
            </div>
            <div>
              <FormTextarea
                name={'description'}
                rows={3}
                label="Description"
                placeholder="This Project is about..."
                description="Give your Project a description"
                register={register}
                errors={errors}
              ></FormTextarea>
            </div>
          </section>
          <section className="px-4 py-6 sm:p-6 lg:pb-8">
            <h2 className="text-lg font-medium leading-6 text-gray-900 mb-6">
              Danger Zone
            </h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium leading-6 text-gray-900">
                  Delete this Project
                </p>
                <p className="text-sm text-gray-500">
                  Once you delete a Project, there is no going back. Please be
                  certain.
                </p>
              </div>
              <div>
                <Button
                  intent="danger"
                  prependIcon={TrashIcon}
                  onClick={handleSubmit(onDelete)}
                >
                  Delete Project
                </Button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </Page>
  );
}

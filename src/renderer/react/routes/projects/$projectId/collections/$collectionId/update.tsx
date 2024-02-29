import { Collection, supportedIconSchema } from '@elek-io/shared';
import {
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  NotificationIntent,
  Page,
  formatTimestamp,
} from '@elek-io/ui';
import { CheckIcon, TrashIcon } from '@heroicons/react/20/solid';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/update'
)({
  component: ProjectCollectionUpdate,
});

function ProjectCollectionUpdate() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [isUpdatingCollection, setIsUpdatingCollection] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<Collection>({ defaultValues: context.currentCollection });

  function Description(): ReactElement {
    return (
      <>
        <span className="mr-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">
          Created:{' '}
          {
            formatTimestamp(context.currentCollection?.created || 0, 'en')
              .absolute
          }
        </span>
        <span className="mr-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-800">
          Updated:{' '}
          {
            formatTimestamp(context.currentCollection?.updated || 0, 'en')
              .absolute
          }
        </span>
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          intent="primary"
          prependIcon={CheckIcon}
          state={
            isUpdatingCollection
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

  const onUpdate: SubmitHandler<Collection> = async (collection) => {
    try {
      await context.core.collections.update({
        ...collection,
        projectId: context.currentProject.id,
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId',
        params: {
          projectId: context.currentProject.id,
          collectionId: context.currentCollection.id,
        },
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Collection',
        description: 'There was an error updating the Collection.',
      });
    }
  };

  const onDelete: SubmitHandler<Collection> = async (collection) => {
    try {
      await context.core.collections.delete({
        projectId: context.currentProject.id,
        id: collection.id,
      });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully deleted Collection',
        description: 'The Collection was successfully deleted.',
      });
      router.navigate({
        to: '/projects/$projectId/collections',
        params: {
          projectId: context.currentProject.id,
        },
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Collection',
        description: 'There was an error deleting the Collection from disk.',
      });
    }
  };

  return (
    <Page
      title={`Configure Collection (${watch(
        `name.singular.${context.currentUser.locale.id}`
      )})`}
      actions={<Actions></Actions>}
      description={<Description></Description>}
      layout="overlap-card-no-space"
    >
      {/* {JSON.stringify(watch())}
      <hr /> */}
      <form className="divide-y divide-gray-200 lg:col-span-9">
        <section className="px-4 py-6 sm:p-6 lg:pb-8 flex-grow space-y-4">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 sm:col-span-3">
              <FormSelect
                name={`icon`}
                options={supportedIconSchema.options.map((option) => {
                  return {
                    name: option,
                    value: option,
                    disabled: false,
                  };
                })}
                label="Icon"
                description="The icon of this Collection"
                control={control}
                errors={errors}
              ></FormSelect>
            </div>
            <div className="col-span-12 sm:col-span-9">
              <FormInput
                name={`name.singular.${context.currentUser.locale.id}`}
                type="text"
                label="Name"
                placeholder="Blogposts"
                description="Give your new Collection a name"
                register={register}
                errors={errors}
                required
              ></FormInput>
            </div>
          </div>
          <div>
            <FormTextarea
              name={`description.${context.currentUser.locale.id}`}
              rows={3}
              label="Description"
              placeholder="Posts that are displayed inside the blog"
              description="Give your new Collection a description"
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
                Delete Collection
              </Button>
            </div>
          </div>
        </section>
      </form>
    </Page>
  );
}

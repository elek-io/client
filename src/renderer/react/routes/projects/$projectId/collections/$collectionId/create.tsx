import { Entry } from '@elek-io/shared';
import { Button, FormSelect, NotificationIntent, Page } from '@elek-io/ui';
import { CheckIcon } from '@heroicons/react/20/solid';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ReactElement } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/create'
)({
  component: ProjectCollectionEntryCreate,
});

function ProjectCollectionEntryCreate() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Entry>();

  const onCreate: SubmitHandler<Entry> = async (newEntry) => {
    if (!context.currentProject || !context.currentCollection) {
      return;
    }

    try {
      const entry = await context.core.entries.create({
        projectId: context.currentProject.id,
        collectionId: context.currentCollection.id,
        language: newEntry.language,
        valueReferences: newEntry.valueReferences,
      });
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId/$entryId',
        params: {
          projectId: context.currentProject.id,
          collectionId: context.currentCollection.id,
          entryId: entry.id,
        },
      });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to create new Item for this Collection',
        description:
          'There was an error creating the new Item for this Collection.',
      });
    }
  };

  function Title(): string {
    if (!context.currentCollection) {
      return '';
    }
    return `Create a new ${context.translate(
      'currentCollection.name',
      context.currentCollection.name.singular
    )}`;
  }

  function Description(): ReactElement {
    if (!context.currentCollection) {
      return <></>;
    }
    return (
      <>
        {context.translate(
          'currentCollection.description',
          context.currentCollection.description
        )}
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          intent="primary"
          prependIcon={CheckIcon}
          onClick={handleSubmit(onCreate)}
        >
          Create Item
        </Button>
      </>
    );
  }

  return (
    <Page
      title={Title()}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      {JSON.stringify(watch())}
      <form>
        <FormSelect
          name="language"
          label="Language"
          control={control}
          options={[
            {
              name: 'English',
              value: 'en',
            },
            {
              name: 'Deutsch',
              value: 'de',
            },
          ]}
          description="The language of this item"
          errors={errors}
        ></FormSelect>

        <h2>Definitions</h2>
        {
          // The Collections Field definitions are displayed here, so the user can either create a new field based on the definition or choose an existing one that matches the criterea
        }
        <ul className="grid grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
          {context.currentCollection &&
            context.currentCollection.valueDefinitions.map((definition) => {
              return (
                <li className={`col-span-${definition.inputWidth}`}>
                  Create a "
                  {context.translate('definition.name', definition.name)}" Value
                </li>
              );
            })}
        </ul>

        {/* <h2>Definitions</h2>
            <ul>
              {context.currentCollection.fieldDefinitions.map((fieldDefinition) => {
                return <li>{fieldDefinition.name[props.currentUser.locale.id]}</li>;
              })}
            </ul> */}
      </form>
    </Page>
  );
}

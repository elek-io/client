import { UpdateEntryProps, updateEntrySchema } from '@elek-io/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotificationIntent } from '@renderer/store';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  ValueInputFromDefinition,
  translatableDefault,
} from '../../../../../../components/forms/util';
import { Button } from '../../../../../../components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../../../components/ui/form';
import { Page } from '../../../../../../components/ui/page';
import { fieldWidth } from '../../../../../../util';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/$entryId/'
)({
  component: ProjectCollectionEntryIndexPage,
});

function ProjectCollectionEntryIndexPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [isUpdatingEntry, setIsUpdatingEntry] = useState(false);

  const updateEntryFormState = useForm<UpdateEntryProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log('formData', data);
      console.log(
        'validation result',
        await zodResolver(updateEntrySchema)(data, context, options)
      );
      return zodResolver(updateEntrySchema)(data, context, options);
    },
    defaultValues: {
      ...context.currentEntry,
      values: context.currentCollection.valueDefinitions.map(
        (definition, index) => {
          return {
            objectType: 'value',
            definitionId: definition.id,
            valueType: definition.valueType,
            content:
              context.currentEntry.values[index]?.content ||
              translatableDefault({
                supportedLanguages:
                  context.currentProject.settings.language.supported,
                default: definition.valueType === 'string' ? '' : null,
              }),
          };
        }
      ),
      collectionId: context.currentCollection.id,
      projectId: context.currentProject.id,
    },
  });

  function Title(): string {
    // @todo Should map to a Value defined by the user (which could also be used in the Collection index page and breadcrumb to always show a "title" of the Entry)
    // return context.translate(
    //   'currentCollection.name.plural',
    //   context.currentEntry.values[0].content
    // );
    return context.currentEntry.id;
  }

  function Description(): ReactElement {
    return <>Here you can edit this Entries Values</>;
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          isLoading={isUpdatingEntry}
          onClick={updateEntryFormState.handleSubmit(onUpdate)}
        >
          <Check className="w-4 h-4 mr-2"></Check>
          Save changes
        </Button>
      </>
    );
  }

  const onUpdate: SubmitHandler<UpdateEntryProps> = async (entry) => {
    setIsUpdatingEntry(true);
    try {
      await context.core.entries.update({
        ...entry,
      });
      setIsUpdatingEntry(false);
      router.navigate({
        to: '/projects/$projectId/collections/$collectionId/$entryId',
        params: {
          projectId: context.currentProject.id,
          collectionId: context.currentCollection.id,
          entryId: context.currentEntry.id,
        },
      });
    } catch (error) {
      setIsUpdatingEntry(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Entry',
        description: 'There was an error updating the Entry.',
      });
    }
  };

  return (
    <Page
      title={Title()}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      {JSON.stringify(updateEntryFormState.watch())}
      <Form {...updateEntryFormState}>
        <form>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-12 gap-6">
              {context.currentCollection.valueDefinitions.map(
                (definition, definitionIndex) => {
                  return (
                    <FormField
                      key={definition.id}
                      name={`values.${definitionIndex}.content.${context.currentProject.settings.language.default}`}
                      render={({ field }) => (
                        <FormItem
                          className={`col-span-12 ${fieldWidth(
                            definition.inputWidth
                          )}`}
                        >
                          <FormLabel
                            isRequired={
                              'isRequired' in definition
                                ? definition.isRequired
                                : false
                            }
                          >
                            {context.translate(
                              'definition.label',
                              definition.label
                            )}
                          </FormLabel>
                          <FormControl>
                            <Dialog>
                              <DialogTrigger asChild>
                                {ValueInputFromDefinition<UpdateEntryProps>(
                                  definition,
                                  updateEntryFormState,
                                  field
                                )}
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    {context.translate(
                                      'definition.label',
                                      definition.label
                                    )}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {context.translate(
                                      'definition.description',
                                      definition.description
                                    )}
                                  </DialogDescription>
                                </DialogHeader>

                                {context.currentProject.settings.language.supported.map(
                                  (language) => {
                                    return (
                                      <FormField
                                        key={language}
                                        control={updateEntryFormState.control}
                                        name={`values.${definitionIndex}.content.${language}`}
                                        render={({ field }) => (
                                          <FormItem className="col-span-12 sm:col-span-5">
                                            <FormLabel isRequired={true}>
                                              {language}
                                            </FormLabel>
                                            <FormControl>
                                              {ValueInputFromDefinition<UpdateEntryProps>(
                                                definition,
                                                updateEntryFormState,
                                                field
                                              )}
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    );
                                  }
                                )}

                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                      Done
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </FormControl>
                          <FormDescription>
                            {context.translate(
                              'definition.description',
                              definition.description
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                }
              )}
            </div>
          </div>
        </form>
      </Form>
    </Page>
  );
}

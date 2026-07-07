import type { ReactElement } from 'react';

import {
  DefaultFieldDefinitionForm,
  type DefaultFieldDefinitionFormProps,
} from '@renderer/components/forms/default-field-definition-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import { Switch } from '@renderer/components/ui/switch';
import { useProject } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { queryOptions } from '@renderer/queries';

import { type EntryFieldDefinition } from '@elek-io/core';

export type EntryFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<EntryFieldDefinition>;

const EntryFieldDefinitionForm = ({
  form,
  ...props
}: EntryFieldDefinitionFormProps): ReactElement => {
  const { projectId, translateContent } = useProject();
  const { data: collectionList, isPending: isReadingCollections } =
    useQueryNoError(queryOptions.collections.list({ projectId, limit: 0 }));

  const selectedCollectionIds: string[] = form.watch('ofCollections');

  function toggleCollection(collectionId: string): void {
    if (selectedCollectionIds.includes(collectionId)) {
      form.setValue(
        'ofCollections',
        selectedCollectionIds.filter((id) => id !== collectionId)
      );
    } else {
      form.setValue('ofCollections', [...selectedCollectionIds, collectionId]);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name="ofCollections"
            render={() => (
              <FormItem>
                <FormLabel isRequired={false}>
                  Restrict to Collections
                </FormLabel>
                <FormDescription>
                  Only Entries from the selected Collections can be referenced.
                  If none are selected, Entries from all Collections are
                  available.
                </FormDescription>
                <div className="space-y-2">
                  {isReadingCollections === true ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => {
                        const key = `skeleton-${String(i)}`;
                        return (
                          <div
                            key={key}
                            className="h-10 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800"
                          />
                        );
                      })}
                    </div>
                  ) : collectionList.list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No Collections available in this project.
                    </p>
                  ) : (
                    collectionList.list.map((collection) => {
                      const isSelected = selectedCollectionIds.includes(
                        collection.id
                      );
                      return (
                        <div
                          key={collection.id}
                          className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700"
                        >
                          <div className="mr-4">
                            <span className="text-sm font-medium">
                              {translateContent({
                                key: 'collection.name.plural',
                                record: collection.name.plural,
                              })}
                            </span>
                          </div>
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleCollection(collection.id)
                            }
                          />
                        </div>
                      );
                    })
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-row items-center justify-between space-x-2">
            <FormField
              control={form.control}
              name="min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={false}>Minimum</FormLabel>
                  <FormControl>
                    <FormInputField field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The minimum number of Entries the user needs to select.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={false}>Maximum</FormLabel>
                  <FormControl>
                    <FormInputField field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The maximum number of Entries the user is able to select.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};
EntryFieldDefinitionForm.displayName = 'EntryFieldDefinitionForm';

export { EntryFieldDefinitionForm };

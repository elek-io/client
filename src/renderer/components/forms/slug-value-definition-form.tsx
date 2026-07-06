import type { ReactElement } from 'react';

import {
  DefaultFieldDefinitionForm,
  type DefaultFieldDefinitionFormProps,
} from '@renderer/components/forms/default-field-definition-form';
import {
  Form,
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
import { useProject } from '@renderer/hooks/useProject';

import {
  flattenFieldDefinitions,
  type FieldDefinitionOrGroup,
  type SlugFieldDefinition,
} from '@elek-io/core';

// Radix Select items cannot hold an empty string, so "no separator" needs a sentinel
const NO_SEPARATOR = 'none';
const separatorOptions: { value: string; label: string }[] = [
  { value: '-', label: 'Hyphen (-)' },
  { value: '_', label: 'Underscore (_)' },
  { value: '.', label: 'Dot (.)' },
  { value: '~', label: 'Tilde (~)' },
  { value: NO_SEPARATOR, label: 'None' },
];

export type SlugFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<SlugFieldDefinition> & {
    // The definitions already added to the Collection, to pick slug sources from
    fieldDefinitions: FieldDefinitionOrGroup[];
  };

const SlugFieldDefinitionForm = ({
  form,
  fieldDefinitions,
  ...props
}: SlugFieldDefinitionFormProps): ReactElement => {
  const { translateContent } = useProject();

  // Slugs can only derive from text-like sibling fields
  const eligibleSources = flattenFieldDefinitions(fieldDefinitions).filter(
    (definition) =>
      definition.valueType === 'string' && definition.fieldType !== 'slug'
  );

  const selectedSourceIds: string[] = form.watch('ofFieldDefinitions');

  function toggleSource(sourceId: string): void {
    const next = selectedSourceIds.includes(sourceId)
      ? selectedSourceIds.filter((id) => id !== sourceId)
      : [...selectedSourceIds, sourceId];
    // Store the sources in the order their fields appear in the Collection,
    // so the derived slug is predictable no matter the toggle order
    form.setValue(
      'ofFieldDefinitions',
      eligibleSources
        .filter((definition) => next.includes(definition.id))
        .map((definition) => definition.id)
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name="ofFieldDefinitions"
            render={() => (
              <FormItem>
                <FormLabel isRequired={false}>Generate from Fields</FormLabel>
                <FormDescription>
                  The slug is generated from the selected Fields while creating
                  an Entry, in the order the Fields appear in the Collection. If
                  none are selected, users enter the slug manually.
                </FormDescription>
                <div className="space-y-2">
                  {eligibleSources.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No text based Fields to generate from yet. Add one first
                      or leave this empty.
                    </p>
                  ) : (
                    eligibleSources.map((definition) => (
                      <div
                        key={definition.id}
                        className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700"
                      >
                        <div className="mr-4">
                          <span className="text-sm font-medium">
                            {translateContent({
                              key: 'fieldDefinition.label',
                              record: definition.label,
                            })}
                          </span>
                        </div>
                        <Switch
                          checked={selectedSourceIds.includes(definition.id)}
                          onCheckedChange={() => toggleSource(definition.id)}
                        />
                      </div>
                    ))
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="separator"
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired>Separator</FormLabel>
                <Select
                  value={field.value === '' ? NO_SEPARATOR : field.value}
                  onValueChange={(selected) =>
                    field.onChange(selected === NO_SEPARATOR ? '' : selected)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {separatorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The character placed between words of the slug.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lowercase"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700">
                <div className="mr-4">
                  <FormLabel isRequired>Lowercase</FormLabel>
                  <FormDescription>
                    Convert the slug to lowercase.
                  </FormDescription>
                  <FormMessage />
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="decamelize"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700">
                <div className="mr-4">
                  <FormLabel isRequired>Decamelize</FormLabel>
                  <FormDescription>
                    Split camelCase words, so &quot;myWord&quot; becomes
                    &quot;my-word&quot;.
                  </FormDescription>
                  <FormMessage />
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItem>
            )}
          />
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};
SlugFieldDefinitionForm.displayName = 'SlugFieldDefinitionForm';

export { SlugFieldDefinitionForm };

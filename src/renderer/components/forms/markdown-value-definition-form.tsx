import type { ReactElement } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  DefaultFieldDefinitionForm,
  type AuthorableFieldType,
} from '@renderer/components/forms/default-field-definition-form';
import { FieldLegend, FieldSet } from '@renderer/components/ui/field';
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

import {
  markdownHeadingDepthSchema,
  type MarkdownFeatures,
  type MarkdownFieldDefinition,
  type SupportedLanguage,
} from '@elek-io/core';

// MarkdownFieldDefinition.defaultValue is a recursive mdast tree that blows
// react-hook-form's path type instantiation. The form never edits it (v1 keeps
// markdown defaults null), so the form values pin it to null. The resolver
// still validates and yields the full MarkdownFieldDefinition.
export type MarkdownFieldDefinitionFormValues = Omit<
  MarkdownFieldDefinition,
  'defaultValue'
> & { defaultValue: null };

type BooleanFeature = Exclude<keyof MarkdownFeatures, 'headings'>;

const blockFeatures: { key: BooleanFeature; label: string; hint: string }[] = [
  { key: 'blockquotes', label: 'Blockquotes', hint: 'Quoted text blocks.' },
  { key: 'lists', label: 'Lists', hint: 'Bulleted and numbered lists.' },
  {
    key: 'taskListItems',
    label: 'Task list items',
    hint: 'Checkboxes inside lists. Requires lists.',
  },
  {
    key: 'codeBlocks',
    label: 'Code blocks',
    hint: 'Multi line code with an optional language.',
  },
  {
    key: 'thematicBreak',
    label: 'Thematic breaks',
    hint: 'Horizontal rules between sections.',
  },
  { key: 'tables', label: 'Tables', hint: 'Tables with aligned columns.' },
  {
    key: 'footnotes',
    label: 'Footnotes',
    hint: 'Footnote references and definitions.',
  },
  {
    key: 'rawHtml',
    label: 'Raw HTML',
    hint: 'Raw HTML passes through unsanitized. Whatever renders this Field must sanitize it.',
  },
];

const inlineFeatures: { key: BooleanFeature; label: string; hint: string }[] = [
  { key: 'emphasis', label: 'Emphasis', hint: 'Italic text.' },
  { key: 'strong', label: 'Strong', hint: 'Bold text.' },
  { key: 'inlineCode', label: 'Inline code', hint: 'Code spans inside text.' },
  {
    key: 'strikethrough',
    label: 'Strikethrough',
    hint: 'Struck through text.',
  },
  {
    key: 'hardLineBreaks',
    label: 'Hard line breaks',
    hint: 'Line breaks inside a paragraph.',
  },
  {
    key: 'externalLinks',
    label: 'External links',
    hint: 'Links to external URLs.',
  },
  {
    key: 'externalImages',
    label: 'External images',
    hint: 'Images from external URLs.',
  },
  {
    key: 'entryReferences',
    label: 'Entry references',
    hint: 'Links to Entries of this Project.',
  },
  {
    key: 'assetReferences',
    label: 'Asset references',
    hint: "Images and files from this Project's Assets.",
  },
];

export interface MarkdownFieldDefinitionFormProps {
  form: UseFormReturn<
    MarkdownFieldDefinitionFormValues,
    unknown,
    MarkdownFieldDefinition
  >;
  supportedLanguages: SupportedLanguage[];
  currentLanguage: SupportedLanguage;
  fieldType: AuthorableFieldType;
}

const MarkdownFieldDefinitionForm = ({
  form: transformedForm,
  ...props
}: MarkdownFieldDefinitionFormProps): ReactElement => {
  const { projectId, translateContent } = useProject();
  const { data: collectionList, isPending: isReadingCollections } =
    useQueryNoError(queryOptions.collections.list({ projectId, limit: 0 }));

  // The inputs only read the form's control to register fields, so the submit
  // (transformed) type is irrelevant here. View it single-generic, same as
  // EntryForm does for its generated schema.
  const form =
    transformedForm as unknown as UseFormReturn<MarkdownFieldDefinitionFormValues>;

  const enabledHeadings = form.watch('features.headings');
  const listsEnabled = form.watch('features.lists');
  const entryReferencesEnabled = form.watch('features.entryReferences');
  const selectedCollectionIds = form.watch('ofCollections');

  function toggleHeadingDepth(
    depth: MarkdownFeatures['headings'][number]
  ): void {
    const next = enabledHeadings.includes(depth)
      ? enabledHeadings.filter((enabled) => enabled !== depth)
      : [...enabledHeadings, depth].sort((a, b) => a - b);
    form.setValue('features.headings', next);
  }

  function toggleCollection(collectionId: string): void {
    form.setValue(
      'ofCollections',
      selectedCollectionIds.includes(collectionId)
        ? selectedCollectionIds.filter((id) => id !== collectionId)
        : [...selectedCollectionIds, collectionId]
    );
  }

  const featureRow = (feature: {
    key: BooleanFeature;
    label: string;
    hint: string;
  }): ReactElement => (
    <FormField
      key={feature.key}
      control={form.control}
      name={`features.${feature.key}`}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700">
          <div className="mr-4">
            <FormLabel isRequired>{feature.label}</FormLabel>
            <FormDescription>{feature.hint}</FormDescription>
            <FormMessage />
          </div>
          <Switch
            checked={field.value}
            disabled={feature.key === 'taskListItems' && listsEnabled === false}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              // Core rejects task list items without lists
              if (feature.key === 'lists' && checked === false) {
                form.setValue('features.taskListItems', false);
              }
            }}
          />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
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
                    The minimum number of blocks (paragraphs, headings, lists)
                    the content needs.
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
                    The maximum number of blocks the content can hold.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FieldSet>
            <FieldLegend>Block features</FieldLegend>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="features.headings"
                render={() => (
                  <FormItem className="rounded-lg border border-zinc-200 p-3 shadow-xs dark:border-zinc-700">
                    <FormLabel isRequired>Headings</FormLabel>
                    <FormDescription>
                      Which heading levels can be used. None disables headings.
                    </FormDescription>
                    <div className="flex flex-row gap-4">
                      {markdownHeadingDepthSchema.options.map((option) => {
                        const depth = option.value;
                        return (
                          <label
                            key={depth}
                            className="flex flex-col items-center gap-1 text-sm"
                          >
                            H{depth}
                            <Switch
                              checked={enabledHeadings.includes(depth)}
                              onCheckedChange={() => toggleHeadingDepth(depth)}
                            />
                          </label>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {blockFeatures.map((feature) => featureRow(feature))}
            </div>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Inline features</FieldLegend>
            <div className="space-y-2">
              {inlineFeatures.map((feature) => featureRow(feature))}
            </div>
          </FieldSet>

          {entryReferencesEnabled === true ? (
            <FormField
              control={form.control}
              name="ofCollections"
              render={() => (
                <FormItem>
                  <FormLabel isRequired={false}>
                    Restrict Entry references to Collections
                  </FormLabel>
                  <FormDescription>
                    Only Entries from the selected Collections can be
                    referenced. If none are selected, Entries from all
                    Collections are available.
                  </FormDescription>
                  <div className="space-y-2">
                    {isReadingCollections === true ? (
                      <div className="h-10 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
                    ) : collectionList.list.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No Collections available in this project.
                      </p>
                    ) : (
                      collectionList.list.map((collection) => (
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
                            checked={selectedCollectionIds.includes(
                              collection.id
                            )}
                            onCheckedChange={() =>
                              toggleCollection(collection.id)
                            }
                          />
                        </div>
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};
MarkdownFieldDefinitionForm.displayName = 'MarkdownFieldDefinitionForm';

export { MarkdownFieldDefinitionForm };

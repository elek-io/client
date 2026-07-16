import { zodResolver } from '@hookform/resolvers/zod';
import {
  forwardRef,
  useImperativeHandle,
  useState,
  type ReactElement,
  type Ref,
} from 'react';
import {
  useForm,
  type FieldPath,
  type FieldValues,
  type PathValue,
  type Resolver,
  type UseFormReturn,
} from 'react-hook-form';

import { AssetFieldDefinitionForm } from '@renderer/components/forms/asset-value-definition-form';
import { DateFieldDefinitionForm } from '@renderer/components/forms/date-value-definition-form';
import { DatetimeFieldDefinitionForm } from '@renderer/components/forms/datetime-value-definition-form';
import { EmailFieldDefinitionForm } from '@renderer/components/forms/email-value-definition-form';
import { EntryFieldDefinitionForm } from '@renderer/components/forms/entry-value-definition-form';
import { Ipv4FieldDefinitionForm } from '@renderer/components/forms/ipv4-value-definition-form';
import {
  MarkdownFieldDefinitionForm,
  type MarkdownFieldDefinitionFormValues,
} from '@renderer/components/forms/markdown-value-definition-form';
import { NumberFieldDefinitionForm } from '@renderer/components/forms/number-value-definition-form';
import { RangeFieldDefinitionForm } from '@renderer/components/forms/range-value-definition-form';
import {
  SelectFieldDefinitionForm,
  type SelectValueType,
} from '@renderer/components/forms/select-value-definition-form';
import { SlugFieldDefinitionForm } from '@renderer/components/forms/slug-value-definition-form';
import { TelephoneFieldDefinitionForm } from '@renderer/components/forms/telephone-value-definition-form';
import { TextFieldDefinitionForm } from '@renderer/components/forms/text-value-definition-form';
import { TextareaFieldDefinitionForm } from '@renderer/components/forms/textarea-value-definition-form';
import { TimeFieldDefinitionForm } from '@renderer/components/forms/time-value-definition-form';
import { ToggleFieldDefinitionForm } from '@renderer/components/forms/toggle-value-definition-form';
import { UrlFieldDefinitionForm } from '@renderer/components/forms/url-value-definition-form';
import { translatableDefault } from '@renderer/lib/utils';

import {
  assetFieldDefinitionSchema,
  dateFieldDefinitionSchema,
  datetimeFieldDefinitionSchema,
  entryFieldDefinitionSchema,
  emailFieldDefinitionSchema,
  ipv4FieldDefinitionSchema,
  markdownFieldDefinitionSchema,
  numberFieldDefinitionSchema,
  numberSelectFieldDefinitionSchema,
  rangeFieldDefinitionSchema,
  slugFieldDefinitionSchema,
  stringSelectFieldDefinitionSchema,
  telephoneFieldDefinitionSchema,
  textareaFieldDefinitionSchema,
  textFieldDefinitionSchema,
  timeFieldDefinitionSchema,
  toggleFieldDefinitionSchema,
  urlFieldDefinitionSchema,
  uuid,
  type AssetFieldDefinition,
  type DateFieldDefinition,
  type DatetimeFieldDefinition,
  type EmailFieldDefinition,
  type EntryFieldDefinition,
  type FieldDefinition,
  type FieldDefinitionBase,
  type FieldDefinitionOrGroup,
  type FieldType,
  type Ipv4FieldDefinition,
  type MarkdownFieldDefinition,
  type NumberFieldDefinition,
  type NumberSelectFieldDefinition,
  type RangeFieldDefinition,
  type SlugFieldDefinition,
  type StringSelectFieldDefinition,
  type SupportedLanguage,
  type TelephoneFieldDefinition,
  type TextareaFieldDefinition,
  type TextFieldDefinition,
  type TimeFieldDefinition,
  type ToggleFieldDefinition,
  type UrlFieldDefinition,
} from '@elek-io/core';

export interface FieldDefinitionFormProps {
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  fieldType: FieldType;
  // The definitions already on the Collection, with their real ids. The slug
  // source picker reads these siblings and the duplicate-slug guard checks them,
  // so both see real UUIDs rather than react-hook-form's render keys. Edits are
  // appended through onAppend into the Collection form's Controller-bound value.
  fieldDefinitions: FieldDefinitionOrGroup[];
  onAppend: (definition: FieldDefinition) => void;
  setIsAddFieldDefinitionSheetOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

export interface FieldDefinitionFormRef {
  addDefinition: () => Promise<void>;
  getExampleFormField: () => ReactElement;
}

export const FieldDefinitionForm = forwardRef(
  (props: FieldDefinitionFormProps, ref: Ref<FieldDefinitionFormRef>) => {
    const FieldDefinitionBaseDefaults: Omit<FieldDefinitionBase, 'id'> = {
      slug: '',
      label: translatableDefault({
        supportedLanguages: props.supportedLanguages,
        defaultValue: '',
      }),
      description: translatableDefault({
        supportedLanguages: props.supportedLanguages,
        defaultValue: '',
      }),
      isRequired: true,
      isDisabled: false,
      isUnique: false,
      inputWidth: '12',
    };

    // Core throws on duplicate slugs when saving the Collection,
    // so reject them here where the user can still correct the slug
    const isDuplicateSlug = (definitionSlug: string): boolean =>
      props.fieldDefinitions.some((definition) =>
        'isGroup' in definition
          ? definition.fieldDefinitions.some(
              (member) => member.slug === definitionSlug
            )
          : definition.slug === definitionSlug
      );
    const duplicateSlugError = (
      definitionSlug: string
    ): { type: string; message: string } => ({
      type: 'duplicate',
      message: `A Field with the slug "${definitionSlug}" already exists`,
    });

    // Every definition form submits the same way: reject duplicate slugs, append
    // the definition, close the sheet and reset for the next add. RHF's FieldPath
    // cannot reduce the literal paths for an unresolved generic T, so they are
    // asserted here once (same tax as DefaultFieldDefinitionForm's base helper).
    // T is the form values (markdown pins the recursive defaultValue to null in
    // its values); TTransformed is the resolver output, a concrete FieldDefinition
    // the Collection form's onAppend accepts.
    const submitDefinition = async <
      T extends FieldValues,
      TTransformed extends FieldDefinition & FieldValues,
    >(
      formState: UseFormReturn<T, unknown, TTransformed>
    ): Promise<void> => {
      await formState.handleSubmit((definition) => {
        if (isDuplicateSlug(definition.slug)) {
          formState.setError(
            'slug' as FieldPath<T>,
            duplicateSlugError(definition.slug)
          );
          return;
        }
        props.onAppend(definition);
        props.setIsAddFieldDefinitionSheetOpen(false);
        formState.reset();
        formState.setValue(
          'id' as FieldPath<T>,
          uuid() as PathValue<T, FieldPath<T>>
        );
      })();
    };

    const textareaFieldDefinitionFormState = useForm<TextareaFieldDefinition>({
      resolver: zodResolver(textareaFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'textarea',
        defaultValue: null,
        min: null,
        max: null,
      },
    });

    const dateFieldDefinitionFormState = useForm<DateFieldDefinition>({
      resolver: zodResolver(dateFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'date',
        defaultValue: null,
      },
    });

    const datetimeFieldDefinitionFormState = useForm<DatetimeFieldDefinition>({
      resolver: zodResolver(datetimeFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'datetime',
        defaultValue: null,
      },
    });

    const timeFieldDefinitionFormState = useForm<TimeFieldDefinition>({
      resolver: zodResolver(timeFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'time',
        defaultValue: null,
      },
    });

    const ipv4FieldDefinitionFormState = useForm<Ipv4FieldDefinition>({
      resolver: zodResolver(ipv4FieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'ipv4',
        defaultValue: null,
      },
    });

    const markdownFieldDefinitionFormState = useForm<
      MarkdownFieldDefinitionFormValues,
      unknown,
      MarkdownFieldDefinition
    >({
      // The resolver is typed over the schema input, whose recursive
      // defaultValue tree the form values pin to null (see
      // MarkdownFieldDefinitionFormValues). Every value the form holds is
      // valid schema input, the Resolver generics just cannot express that.
      resolver: zodResolver(
        markdownFieldDefinitionSchema
      ) as unknown as Resolver<
        MarkdownFieldDefinitionFormValues,
        unknown,
        MarkdownFieldDefinition
      >,
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'mdast',
        fieldType: 'markdown',
        isUnique: false,
        defaultValue: null,
        min: null,
        max: null,
        // Core expects Desktop to default all features off
        features: {
          headings: [],
          blockquotes: false,
          lists: false,
          taskListItems: false,
          codeBlocks: false,
          thematicBreak: false,
          tables: false,
          footnotes: false,
          rawHtml: false,
          emphasis: false,
          strong: false,
          inlineCode: false,
          strikethrough: false,
          hardLineBreaks: false,
          externalLinks: false,
          externalImages: false,
          entryReferences: false,
          assetReferences: false,
        },
        ofCollections: [],
        ofAssetMimeTypes: [],
      },
    });

    const slugFieldDefinitionFormState = useForm<SlugFieldDefinition>({
      resolver: zodResolver(slugFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'slug',
        isUnique: true,
        defaultValue: null,
        separator: '-',
        lowercase: true,
        decamelize: true,
        ofFieldDefinitions: [],
      },
    });

    // One 'select' fieldType, two Core schemas. Which one addDefinition
    // validates is chosen inside the select definition form.
    const [selectValueType, setSelectValueType] =
      useState<SelectValueType>('string');

    const stringSelectFieldDefinitionFormState =
      useForm<StringSelectFieldDefinition>({
        resolver: zodResolver(stringSelectFieldDefinitionSchema),
        defaultValues: {
          ...FieldDefinitionBaseDefaults,
          id: uuid(),
          valueType: 'string',
          fieldType: 'select',
          defaultValue: null,
          options: [
            {
              value: '',
              label: translatableDefault({
                supportedLanguages: props.supportedLanguages,
                defaultValue: '',
              }),
            },
          ],
        },
      });

    const numberSelectFieldDefinitionFormState =
      useForm<NumberSelectFieldDefinition>({
        resolver: zodResolver(numberSelectFieldDefinitionSchema),
        defaultValues: {
          ...FieldDefinitionBaseDefaults,
          id: uuid(),
          valueType: 'number',
          fieldType: 'select',
          isUnique: false,
          defaultValue: null,
          min: null,
          max: null,
          options: [
            {
              value: 0,
              label: translatableDefault({
                supportedLanguages: props.supportedLanguages,
                defaultValue: '',
              }),
            },
          ],
        },
      });

    const emailFieldDefinitionFormState = useForm<EmailFieldDefinition>({
      resolver: zodResolver(emailFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'email',
        defaultValue: null,
      },
    });

    const telephoneFieldDefinitionFormState = useForm<TelephoneFieldDefinition>(
      {
        resolver: zodResolver(telephoneFieldDefinitionSchema),
        defaultValues: {
          ...FieldDefinitionBaseDefaults,
          id: uuid(),
          valueType: 'string',
          fieldType: 'telephone',
          defaultValue: null,
        },
      }
    );

    const urlFieldDefinitionFormState = useForm<UrlFieldDefinition>({
      resolver: zodResolver(urlFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'url',
        defaultValue: null,
      },
    });

    const numberFieldDefinitionFormState = useForm<NumberFieldDefinition>({
      resolver: zodResolver(numberFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'number',
        fieldType: 'number',
        defaultValue: null,
        min: null,
        max: null,
        isUnique: false,
      },
    });

    const rangeFieldDefinitionFormState = useForm<RangeFieldDefinition>({
      resolver: zodResolver(rangeFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'number',
        fieldType: 'range',
        defaultValue: 50,
        min: 0,
        max: 100,
        isRequired: true,
        isUnique: false,
      },
    });

    const toggleFieldDefinitionFormState = useForm<ToggleFieldDefinition>({
      resolver: zodResolver(toggleFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'boolean',
        fieldType: 'toggle',
        defaultValue: false,
        isRequired: true,
        isUnique: false,
      },
    });

    const textFieldDefinitionFormState = useForm<TextFieldDefinition>({
      resolver: zodResolver(textFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'text',
        defaultValue: null,
        min: null,
        max: 250,
      },
    });

    const assetFieldDefinitionFormState = useForm<AssetFieldDefinition>({
      resolver: zodResolver(assetFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'reference',
        fieldType: 'asset',
        isUnique: false,
        min: null,
        max: null,
      },
    });

    const entryFieldDefinitionFormState = useForm<EntryFieldDefinition>({
      resolver: zodResolver(entryFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'reference',
        fieldType: 'entry',
        isUnique: false,
        ofCollections: [],
        min: null,
        max: null,
      },
    });

    useImperativeHandle(ref, () => ({
      addDefinition: async () => {
        switch (props.fieldType) {
          case 'text':
            return await submitDefinition(textFieldDefinitionFormState);
          case 'textarea':
            return await submitDefinition(textareaFieldDefinitionFormState);
          case 'number':
            return await submitDefinition(numberFieldDefinitionFormState);
          case 'range':
            return await submitDefinition(rangeFieldDefinitionFormState);
          case 'toggle':
            return await submitDefinition(toggleFieldDefinitionFormState);
          case 'asset':
            return await submitDefinition(assetFieldDefinitionFormState);
          case 'entry':
            return await submitDefinition(entryFieldDefinitionFormState);
          case 'date':
            return await submitDefinition(dateFieldDefinitionFormState);
          case 'datetime':
            return await submitDefinition(datetimeFieldDefinitionFormState);
          case 'time':
            return await submitDefinition(timeFieldDefinitionFormState);
          case 'email':
            return await submitDefinition(emailFieldDefinitionFormState);
          case 'url':
            return await submitDefinition(urlFieldDefinitionFormState);
          case 'telephone':
            return await submitDefinition(telephoneFieldDefinitionFormState);
          case 'ipv4':
            return await submitDefinition(ipv4FieldDefinitionFormState);
          case 'select':
            if (selectValueType === 'string') {
              return await submitDefinition(
                stringSelectFieldDefinitionFormState
              );
            }
            return await submitDefinition(numberSelectFieldDefinitionFormState);
          case 'slug':
            return await submitDefinition(slugFieldDefinitionFormState);
          case 'markdown':
            return await submitDefinition(markdownFieldDefinitionFormState);
          case 'dynamic':
          default:
            throw new Error(
              `Tried to validate unsupported fieldType "${props.fieldType}" of Value definition`
            );
        }
      },
      // @todo Field preview parked until it is wired up (its only caller is
      // commented out in collection-form). The previous version bound a preview
      // input to a placeholder path that is not a field of the definition form,
      // so it could not type-check. Recover it from git history when implementing.
      getExampleFormField: () => <></>,
    }));

    switch (props.fieldType) {
      case 'number':
        return (
          <NumberFieldDefinitionForm
            form={numberFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'range':
        return (
          <RangeFieldDefinitionForm
            form={rangeFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'text':
        return (
          <TextFieldDefinitionForm
            form={textFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'textarea':
        return (
          <TextareaFieldDefinitionForm
            form={textareaFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'toggle':
        return (
          <ToggleFieldDefinitionForm
            form={toggleFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'asset':
        return (
          <AssetFieldDefinitionForm
            form={assetFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'entry':
        return (
          <EntryFieldDefinitionForm
            form={entryFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'date':
        return (
          <DateFieldDefinitionForm
            form={dateFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'datetime':
        return (
          <DatetimeFieldDefinitionForm
            form={datetimeFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'time':
        return (
          <TimeFieldDefinitionForm
            form={timeFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'ipv4':
        return (
          <Ipv4FieldDefinitionForm
            form={ipv4FieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'email':
        return (
          <EmailFieldDefinitionForm
            form={emailFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'url':
        return (
          <UrlFieldDefinitionForm
            form={urlFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'telephone':
        return (
          <TelephoneFieldDefinitionForm
            form={telephoneFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'select':
        return (
          <SelectFieldDefinitionForm
            stringForm={stringSelectFieldDefinitionFormState}
            numberForm={numberSelectFieldDefinitionFormState}
            valueType={selectValueType}
            onValueTypeChange={setSelectValueType}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
          />
        );
      case 'slug':
        return (
          <SlugFieldDefinitionForm
            form={slugFieldDefinitionFormState}
            fieldDefinitions={props.fieldDefinitions}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'markdown':
        return (
          <MarkdownFieldDefinitionForm
            form={markdownFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      case 'dynamic':
      default:
        throw new Error(`Unsupported definition form "${props.fieldType}"`);
    }
  }
);
FieldDefinitionForm.displayName = 'FieldDefinitionForm';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  forwardRef,
  useImperativeHandle,
  type ReactElement,
  type Ref,
} from 'react';
import { useForm, type UseFieldArrayReturn } from 'react-hook-form';

import { AssetFieldDefinitionForm } from '@renderer/components/forms/asset-value-definition-form';
import { DateFieldDefinitionForm } from '@renderer/components/forms/date-value-definition-form';
import { EmailFieldDefinitionForm } from '@renderer/components/forms/email-value-definition-form';
import { EntryFieldDefinitionForm } from '@renderer/components/forms/entry-value-definition-form';
import { NumberFieldDefinitionForm } from '@renderer/components/forms/number-value-definition-form';
import { RangeFieldDefinitionForm } from '@renderer/components/forms/range-value-definition-form';
import { TelephoneFieldDefinitionForm } from '@renderer/components/forms/telephone-value-definition-form';
import { TextFieldDefinitionForm } from '@renderer/components/forms/text-value-definition-form';
import { TextareaFieldDefinitionForm } from '@renderer/components/forms/textarea-value-definition-form';
import { ToggleFieldDefinitionForm } from '@renderer/components/forms/toggle-value-definition-form';
import { UrlFieldDefinitionForm } from '@renderer/components/forms/url-value-definition-form';
import { FormFieldFromDefinition } from '@renderer/components/ui/form';
import { translatableDefault } from '@renderer/lib/utils';

import {
  assetFieldDefinitionSchema,
  dateFieldDefinitionSchema,
  entryFieldDefinitionSchema,
  emailFieldDefinitionSchema,
  numberFieldDefinitionSchema,
  rangeFieldDefinitionSchema,
  telephoneFieldDefinitionSchema,
  textareaFieldDefinitionSchema,
  textFieldDefinitionSchema,
  toggleFieldDefinitionSchema,
  urlFieldDefinitionSchema,
  uuid,
  type AssetFieldDefinition,
  type CreateCollectionProps,
  type DateFieldDefinition,
  type EmailFieldDefinition,
  type EntryFieldDefinition,
  type FieldDefinitionBase,
  type FieldType,
  type NumberFieldDefinition,
  type RangeFieldDefinition,
  type SupportedLanguage,
  type TelephoneFieldDefinition,
  type TextareaFieldDefinition,
  type TextFieldDefinition,
  type ToggleFieldDefinition,
  type UpdateCollectionProps,
  type UrlFieldDefinition,
} from '@elek-io/core';

export interface FieldDefinitionFormProps {
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  fieldType: FieldType;
  fieldDefinitions: UseFieldArrayReturn<
    CreateCollectionProps | UpdateCollectionProps,
    'fieldDefinitions'
  >;
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
      props.fieldDefinitions.fields.some((field) =>
        'isGroup' in field
          ? field.fieldDefinitions.some(
              (member) => member.slug === definitionSlug
            )
          : field.slug === definitionSlug
      );
    const duplicateSlugError = (
      definitionSlug: string
    ): { type: string; message: string } => ({
      type: 'duplicate',
      message: `A Field with the slug "${definitionSlug}" already exists`,
    });

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
            return await textFieldDefinitionFormState.handleSubmit(
              (textDefinition) => {
                if (isDuplicateSlug(textDefinition.slug)) {
                  textFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(textDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(textDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                textFieldDefinitionFormState.reset();
                textFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'textarea':
            return await textareaFieldDefinitionFormState.handleSubmit(
              (textareaDefinition) => {
                if (isDuplicateSlug(textareaDefinition.slug)) {
                  textareaFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(textareaDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(textareaDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                textareaFieldDefinitionFormState.reset();
                textareaFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'number':
            return await numberFieldDefinitionFormState.handleSubmit(
              (numberDefinition) => {
                if (isDuplicateSlug(numberDefinition.slug)) {
                  numberFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(numberDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(numberDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                numberFieldDefinitionFormState.reset();
                numberFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'range':
            return await rangeFieldDefinitionFormState.handleSubmit(
              (rangeDefinition) => {
                if (isDuplicateSlug(rangeDefinition.slug)) {
                  rangeFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(rangeDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(rangeDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                rangeFieldDefinitionFormState.reset();
                rangeFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'toggle':
            return await toggleFieldDefinitionFormState.handleSubmit(
              (toggleDefinition) => {
                if (isDuplicateSlug(toggleDefinition.slug)) {
                  toggleFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(toggleDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(toggleDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                toggleFieldDefinitionFormState.reset();
                toggleFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'asset':
            return await assetFieldDefinitionFormState.handleSubmit(
              (assetDefinition) => {
                if (isDuplicateSlug(assetDefinition.slug)) {
                  assetFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(assetDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(assetDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                assetFieldDefinitionFormState.reset();
                assetFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'entry':
            return await entryFieldDefinitionFormState.handleSubmit(
              (entryDefinition) => {
                if (isDuplicateSlug(entryDefinition.slug)) {
                  entryFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(entryDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(entryDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                entryFieldDefinitionFormState.reset();
                entryFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'datetime':
          case 'date':
            return await dateFieldDefinitionFormState.handleSubmit(
              (dateDefinition) => {
                if (isDuplicateSlug(dateDefinition.slug)) {
                  dateFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(dateDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(dateDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                dateFieldDefinitionFormState.reset();
                dateFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'email':
            return await emailFieldDefinitionFormState.handleSubmit(
              (emailDefinition) => {
                if (isDuplicateSlug(emailDefinition.slug)) {
                  emailFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(emailDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(emailDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                emailFieldDefinitionFormState.reset();
                emailFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'url':
            return await urlFieldDefinitionFormState.handleSubmit(
              (urlDefinition) => {
                if (isDuplicateSlug(urlDefinition.slug)) {
                  urlFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(urlDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(urlDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                urlFieldDefinitionFormState.reset();
                urlFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'ipv4':
          case 'time':
          case 'telephone':
            return await telephoneFieldDefinitionFormState.handleSubmit(
              (telephoneDefinition) => {
                if (isDuplicateSlug(telephoneDefinition.slug)) {
                  telephoneFieldDefinitionFormState.setError(
                    'slug',
                    duplicateSlugError(telephoneDefinition.slug)
                  );
                  return;
                }
                props.fieldDefinitions.append(telephoneDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                telephoneFieldDefinitionFormState.reset();
                telephoneFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          default:
            throw new Error(
              `Tried to validate unsupported fieldType "${props.fieldType}" of Value definition`
            );
        }
      },
      getExampleFormField: (fieldType: FieldType) => {
        switch (fieldType) {
          case 'number':
            return (
              <FormFieldFromDefinition
                form={numberFieldDefinitionFormState}
                fieldDefinition={numberFieldDefinitionFormState.watch()}
                name="exampleFields.number.content"
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'range':
            return (
              <FormFieldFromDefinition
                form={rangeFieldDefinitionFormState}
                fieldDefinition={rangeFieldDefinitionFormState.watch()}
                name="exampleFields.range.content"
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'text':
            return (
              <FormFieldFromDefinition
                form={textFieldDefinitionFormState}
                fieldDefinition={textFieldDefinitionFormState.watch()}
                name="exampleFields.text.content"
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'textarea':
            return (
              <FormFieldFromDefinition
                form={textareaFieldDefinitionFormState}
                fieldDefinition={textareaFieldDefinitionFormState.watch()}
                name="exampleFields.textarea.content"
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'toggle':
            return (
              <FormFieldFromDefinition
                form={toggleFieldDefinitionFormState}
                fieldDefinition={toggleFieldDefinitionFormState.watch()}
                name="exampleFields.toggle.content"
              />
            );
          case 'asset':
            return (
              <FormFieldFromDefinition
                form={assetFieldDefinitionFormState}
                fieldDefinition={assetFieldDefinitionFormState.watch()}
                name="exampleFields.asset.content"
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'entry':
            return (
              <FormFieldFromDefinition
                form={entryFieldDefinitionFormState}
                fieldDefinition={entryFieldDefinitionFormState.watch()}
                name="exampleFields.entry.content"
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'datetime':
          case 'date':
          case 'email':
          case 'url':
          case 'ipv4':
          case 'time':
          case 'telephone':
          default:
            throw new Error(`Unsupported example form Field "${fieldType}"`);
        }
      },
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
      case 'datetime':
      case 'date':
        return (
          <DateFieldDefinitionForm
            form={dateFieldDefinitionFormState}
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
      case 'ipv4':
      case 'time':
      case 'telephone':
        return (
          <TelephoneFieldDefinitionForm
            form={telephoneFieldDefinitionFormState}
            currentLanguage={props.defaultLanguage}
            supportedLanguages={props.supportedLanguages}
            fieldType={props.fieldType}
          />
        );
      default:
        throw new Error(`Unsupported definition form "${props.fieldType}"`);
    }
  }
);
FieldDefinitionForm.displayName = 'FieldDefinitionForm';

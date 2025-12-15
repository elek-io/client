import { zodResolver } from '@hookform/resolvers/zod';
import {
  forwardRef,
  useImperativeHandle,
  type ReactElement,
  type Ref,
} from 'react';
import { useForm, type UseFieldArrayReturn } from 'react-hook-form';

import { DateFieldDefinitionForm } from '@renderer/components/forms/date-value-definition-form';
import { EmailFieldDefinitionForm } from '@renderer/components/forms/email-value-definition-form';
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
  dateFieldDefinitionSchema,
  emailFieldDefinitionSchema,
  numberFieldDefinitionSchema,
  rangeFieldDefinitionSchema,
  telephoneFieldDefinitionSchema,
  textareaFieldDefinitionSchema,
  textFieldDefinitionSchema,
  toggleFieldDefinitionSchema,
  urlFieldDefinitionSchema,
  uuid,
  type DateFieldDefinition,
  type EmailFieldDefinition,
  type FieldDefinition,
  type FieldDefinitionBase,
  type FieldType,
  type NumberFieldDefinition,
  type RangeFieldDefinition,
  type SupportedLanguage,
  type TelephoneFieldDefinition,
  type TextareaFieldDefinition,
  type TextFieldDefinition,
  type ToggleFieldDefinition,
  type UrlFieldDefinition,
} from '@elek-io/core';

export interface FieldDefinitionFormProps {
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  fieldType: FieldType;
  fieldDefinitions: UseFieldArrayReturn<FieldDefinition>;
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
      label: translatableDefault({
        supportedLanguages: props.supportedLanguages,
        defaultValue: null,
      }),
      description: translatableDefault({
        supportedLanguages: props.supportedLanguages,
        defaultValue: null,
      }),
      isRequired: true,
      isDisabled: false,
      isUnique: false,
      inputWidth: '12',
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

    useImperativeHandle(ref, () => ({
      addDefinition: async () => {
        switch (props.fieldType) {
          case 'text':
            return await textFieldDefinitionFormState.handleSubmit(
              (textDefinition) => {
                props.fieldDefinitions.append(textDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                textFieldDefinitionFormState.reset();
                textFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'textarea':
            return await textareaFieldDefinitionFormState.handleSubmit(
              (textareaDefinition) => {
                props.fieldDefinitions.append(textareaDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                textareaFieldDefinitionFormState.reset();
                textareaFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'number':
            return await numberFieldDefinitionFormState.handleSubmit(
              (numberDefinition) => {
                props.fieldDefinitions.append(numberDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                numberFieldDefinitionFormState.reset();
                numberFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'range':
            return await rangeFieldDefinitionFormState.handleSubmit(
              (rangeDefinition) => {
                props.fieldDefinitions.append(rangeDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                rangeFieldDefinitionFormState.reset();
                rangeFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'toggle':
            return await toggleFieldDefinitionFormState.handleSubmit(
              (toggleDefinition) => {
                props.fieldDefinitions.append(toggleDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                toggleFieldDefinitionFormState.reset();
                toggleFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'asset':
          case 'entry':
          case 'datetime':
          case 'date':
            return await dateFieldDefinitionFormState.handleSubmit(
              (dateDefinition) => {
                props.fieldDefinitions.append(dateDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                dateFieldDefinitionFormState.reset();
                dateFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'email':
            return await emailFieldDefinitionFormState.handleSubmit(
              (emailDefinition) => {
                props.fieldDefinitions.append(emailDefinition);
                props.setIsAddFieldDefinitionSheetOpen(false);
                dateFieldDefinitionFormState.reset();
                dateFieldDefinitionFormState.setValue('id', uuid());
              }
            )();
          case 'url':
            return await urlFieldDefinitionFormState.handleSubmit(
              (urlDefinition) => {
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
          case 'entry':
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
      case 'entry':
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

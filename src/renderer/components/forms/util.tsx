import { zodResolver } from '@hookform/resolvers/zod';
import {
  forwardRef,
  useId,
  useImperativeHandle,
  type ReactElement,
  type Ref,
} from 'react';
import { useForm, type UseFieldArrayReturn } from 'react-hook-form';

import { NumberFieldDefinitionForm } from '@renderer/components/forms/number-value-definition-form';
import { RangeFieldDefinitionForm } from '@renderer/components/forms/range-value-definition-form';
import { TextFieldDefinitionForm } from '@renderer/components/forms/text-value-definition-form';
import { TextareaFieldDefinitionForm } from '@renderer/components/forms/textarea-value-definition-form';
import { ToggleFieldDefinitionForm } from '@renderer/components/forms/toggle-value-definition-form';
import { translatableDefaultNull } from '@renderer/components/pages/util';
import { FormFieldFromDefinition } from '@renderer/components/ui/form';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Slider } from '@renderer/components/ui/slider';
import { Switch } from '@renderer/components/ui/switch';
import { Textarea } from '@renderer/components/ui/textarea';
import { fieldWidth } from '@renderer/lib/utils';

import {
  dateFieldDefinitionSchema,
  numberFieldDefinitionSchema,
  rangeFieldDefinitionSchema,
  textareaFieldDefinitionSchema,
  textFieldDefinitionSchema,
  toggleFieldDefinitionSchema,
  uuid,
  type DateFieldDefinition,
  type FieldDefinition,
  type FieldDefinitionBase,
  type FieldType,
  type NumberFieldDefinition,
  type RangeFieldDefinition,
  type SupportedLanguage,
  type TextareaFieldDefinition,
  type TextFieldDefinition,
  type ToggleFieldDefinition,
  type TranslatableString,
} from '@elek-io/core';

export interface FieldDefinitionFormProps {
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  fieldType: FieldType;
  fieldDefinitions: UseFieldArrayReturn<FieldDefinition>;
  setIsAddFieldDefinitionSheetOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  translateContent: (key: string, record: TranslatableString) => string;
}

export interface FieldDefinitionFormRef {
  addDefinition: () => Promise<void>;
  getExampleFormField: () => ReactElement;
}

export const FieldDefinitionForm = forwardRef(
  (props: FieldDefinitionFormProps, ref: Ref<FieldDefinitionFormRef>) => {
    const FieldDefinitionBaseDefaults: Omit<FieldDefinitionBase, 'id'> = {
      label: translatableDefaultNull(props.supportedLanguages),
      description: translatableDefaultNull(props.supportedLanguages),
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

    const _dateFieldDefinitionFormState = useForm<DateFieldDefinition>({
      resolver: zodResolver(dateFieldDefinitionSchema),
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'date',
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
          case 'email':
          case 'url':
          case 'ipv4':
          case 'time':
          case 'telephone':
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
                translateContent={props.translateContent}
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'range':
            return (
              <FormFieldFromDefinition
                form={rangeFieldDefinitionFormState}
                fieldDefinition={rangeFieldDefinitionFormState.watch()}
                name="exampleFields.range.content"
                translateContent={props.translateContent}
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'text':
            return (
              <FormFieldFromDefinition
                form={textFieldDefinitionFormState}
                fieldDefinition={textFieldDefinitionFormState.watch()}
                name="exampleFields.text.content"
                translateContent={props.translateContent}
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'textarea':
            return (
              <FormFieldFromDefinition
                form={textareaFieldDefinitionFormState}
                fieldDefinition={textareaFieldDefinitionFormState.watch()}
                name="exampleFields.textarea.content"
                translateContent={props.translateContent}
                supportedLanguages={props.supportedLanguages}
              />
            );
          case 'toggle':
            return (
              <FormFieldFromDefinition
                form={toggleFieldDefinitionFormState}
                fieldDefinition={toggleFieldDefinitionFormState.watch()}
                name="exampleFields.toggle.content"
                translateContent={props.translateContent}
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
      case 'email':
      case 'url':
      case 'ipv4':
      case 'time':
      case 'telephone':
      default:
        throw new Error(`Unsupported definition form "${props.fieldType}"`);
    }
  }
);
FieldDefinitionForm.displayName = 'FieldDefinitionForm';

interface DisabledInputFromDefinitionProps {
  id: string;
  'aria-describedby': string;
  fieldDefinition: FieldDefinition;
  value?: string | number | boolean | undefined;
}

function DisabledInputFromDefinition({
  id,
  'aria-describedby': ariaDescribedBy,
  fieldDefinition,
  value,
}: DisabledInputFromDefinitionProps): ReactElement {
  switch (fieldDefinition.fieldType) {
    case 'text':
      if (typeof value !== 'string') {
        throw new Error(
          `Expected value to be a string, but got "${typeof value}"`
        );
      }
      return (
        <Input
          id={id}
          aria-describedby={ariaDescribedBy}
          type="text"
          value={value}
          disabled
        />
      );
    case 'textarea':
      if (typeof value !== 'string') {
        throw new Error(
          `Expected value to be a string, but got "${typeof value}"`
        );
      }
      return (
        <Textarea
          id={id}
          aria-describedby={ariaDescribedBy}
          value={value}
          disabled
        />
      );
    case 'number':
      if (typeof value !== 'number') {
        throw new Error(
          `Expected value to be a number, but got "${typeof value}"`
        );
      }
      return (
        <Input
          id={id}
          aria-describedby={ariaDescribedBy}
          type="number"
          value={value}
          disabled
        />
      );
    case 'range':
      if (typeof value !== 'number') {
        throw new Error(
          `Expected value to be a number, but got "${typeof value}"`
        );
      }
      return (
        <Slider
          id={id}
          aria-describedby={ariaDescribedBy}
          value={value ? [value] : []}
          step={1} // @todo Core needs to support this too
          disabled
        />
      );
    case 'toggle':
      if (typeof value !== 'boolean') {
        throw new Error(
          `Expected value to be a boolean, but got "${typeof value}"`
        );
      }
      return (
        <Switch
          id={id}
          aria-describedby={ariaDescribedBy}
          checked={value}
          disabled
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
      throw new Error(
        `Unsupported Entry definition FieldType "${fieldDefinition.fieldType}"`
      );
  }
}

interface DisabledFieldFromDefinitionProps {
  fieldDefinition: FieldDefinition;
  translateContent: (key: string, record: TranslatableString) => string;
  value: string | number | boolean;
}

/**
 * Used to render a disabled Field based on a FieldDefinition to view it's value
 *
 * @note Does not connect to a form context.
 * If you need a usable form field, use FormFieldFromDefinition instead.
 */
export function DisabledFieldFromDefinition({
  fieldDefinition,
  translateContent,
  value,
}: DisabledFieldFromDefinitionProps): ReactElement {
  const inputId = useId();
  const descriptionId = useId();

  return (
    <div
      className={`col-span-12 grid gap-2 ${fieldWidth(fieldDefinition.inputWidth)}`}
    >
      <Label
        htmlFor={inputId}
        isRequired={
          'isRequired' in fieldDefinition ? fieldDefinition.isRequired : false
        }
      >
        {translateContent('fieldDefinition.label', fieldDefinition.label)}
      </Label>

      <DisabledInputFromDefinition
        id={inputId}
        aria-describedby={descriptionId}
        fieldDefinition={fieldDefinition}
        value={value}
      />

      {fieldDefinition.description ? (
        <p
          id={descriptionId}
          className="text-sm text-zinc-500 dark:text-zinc-400"
        >
          {translateContent(
            'fieldDefinition.description',
            fieldDefinition.description
          )}
        </p>
      ) : null}
    </div>
  );
}

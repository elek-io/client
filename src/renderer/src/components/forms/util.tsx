import {
  FieldDefinition,
  SupportedLanguage,
  TranslatableString,
} from '@elek-io/core';
import { fieldWidth } from '@renderer/util';
import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { FormInput } from '../ui/form-input';
import { FormTextarea } from '../ui/form-textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

export function translatableDefaultNull(props: {
  supportedLanguages: SupportedLanguage[];
}): {
  [x: string]: null;
} {
  return props.supportedLanguages
    .map((language) => {
      return { [language]: null };
    })
    .reduce((prev, curr) => {
      return {
        ...prev,
        ...curr,
      };
    });
}

export function translatableDefaultArray(props: {
  supportedLanguages: SupportedLanguage[];
}): {
  [x: string]: never[];
} {
  return props.supportedLanguages
    .map((language) => {
      return { [language]: [] };
    })
    .reduce((prev, curr) => {
      return {
        ...prev,
        ...curr,
      };
    });
}

/**
 * Used to render a Field based on a FieldDefinition and attaches it to a form context
 *
 * If you only want to render the field without it being connected to a form context,
 * use FieldFromDefinition instead.
 */
export function FormFieldFromDefinition<T extends FieldValues>(
  fieldDefinition: FieldDefinition,
  name: Path<T>,
  translateContent: (key: string, record: TranslatableString) => string
): JSX.Element {
  return (
    <FormField
      key={fieldDefinition.id}
      name={name}
      render={({ field }) => (
        <FormItem
          className={`col-span-12 ${fieldWidth(fieldDefinition.inputWidth)}`}
        >
          <FormLabel
            isRequired={
              'isRequired' in fieldDefinition
                ? fieldDefinition.isRequired
                : false
            }
          >
            {translateContent('fieldDefinition.label', fieldDefinition.label)}
          </FormLabel>
          <FormControl>
            {/* @todo add styling for toggle switches */}
            {FormInputFromDefinition<T>(fieldDefinition, field)}
          </FormControl>
          <FormDescription>
            {translateContent(
              'fieldDefinition.description',
              fieldDefinition.description
            )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FormInputFromDefinition<T extends FieldValues>(
  fieldDefinition: FieldDefinition,
  field: ControllerRenderProps<FieldValues, Path<T>>
): JSX.Element {
  switch (fieldDefinition.fieldType) {
    case 'text':
      return (
        <FormInput
          field={field}
          type="text"
          minLength={fieldDefinition.min || undefined}
          maxLength={fieldDefinition.max || undefined}
          defaultValue={fieldDefinition.defaultValue || undefined}
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
        />
      );
    case 'textarea':
      return (
        <FormTextarea
          field={field}
          minLength={fieldDefinition.min || undefined}
          maxLength={fieldDefinition.max || undefined}
          defaultValue={fieldDefinition.defaultValue || undefined}
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
        />
      );
    case 'number':
      return (
        <FormInput
          field={field}
          type="number"
          min={fieldDefinition.min || undefined}
          max={fieldDefinition.max || undefined}
          defaultValue={fieldDefinition.defaultValue || undefined}
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
        />
      );
    case 'range':
      return (
        <Slider
          {...field}
          defaultValue={[fieldDefinition.defaultValue]}
          min={fieldDefinition.min}
          max={fieldDefinition.max}
          step={1} // @todo Core needs to support this too
          disabled={fieldDefinition.isDisabled}
        />
      );
    case 'toggle':
      return (
        <Switch
          {...field}
          defaultChecked={fieldDefinition.defaultValue}
          checked={fieldDefinition.defaultValue}
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
        />
      );
    default:
      throw new Error(
        `Unsupported Entry definition FieldType "${fieldDefinition.fieldType}"`
      );
  }
}

/**
 * Used to render a Field based on a FieldDefinition
 *
 * Only renders an input based on given definition and does not
 * connect to a form context. If you need a usable form field,
 * use FormFieldFromDefinition instead.
 */
export function FieldFromDefinition(
  fieldDefinition: FieldDefinition,
  translateContent: (key: string, record: TranslatableString) => string,
  value?: any
): JSX.Element {
  return (
    <FormItem
      className={`col-span-12 ${fieldWidth(fieldDefinition.inputWidth)}`}
    >
      <Label
        isRequired={
          'isRequired' in fieldDefinition ? fieldDefinition.isRequired : false
        }
      >
        {translateContent('fieldDefinition.label', fieldDefinition.label)}
      </Label>
      {InputFromDefinition(fieldDefinition, value)}
      <p className={'text-[0.8rem] text-zinc-500 dark:text-zinc-400'}>
        {translateContent(
          'fieldDefinition.description',
          fieldDefinition.description
        )}
      </p>
    </FormItem>
  );
}

function InputFromDefinition(
  fieldDefinition: FieldDefinition,
  value?: any
): JSX.Element {
  switch (fieldDefinition.fieldType) {
    case 'text':
      return (
        <Input
          type="text"
          minLength={fieldDefinition.min || undefined}
          maxLength={fieldDefinition.max || undefined}
          defaultValue={fieldDefinition.defaultValue || undefined}
          value={value}
          required={fieldDefinition.isRequired}
          disabled={true}
        />
      );
    case 'textarea':
      return (
        <Textarea
          minLength={fieldDefinition.min || undefined}
          maxLength={fieldDefinition.max || undefined}
          defaultValue={fieldDefinition.defaultValue || undefined}
          value={value}
          required={fieldDefinition.isRequired}
          disabled={true}
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          min={fieldDefinition.min || undefined}
          max={fieldDefinition.max || undefined}
          defaultValue={fieldDefinition.defaultValue || undefined}
          value={value}
          required={fieldDefinition.isRequired}
          disabled={true}
        />
      );
    case 'range':
      return (
        <Slider
          defaultValue={[fieldDefinition.defaultValue]}
          value={[value]}
          min={fieldDefinition.min}
          max={fieldDefinition.max}
          step={1} // @todo Core needs to support this too
          disabled={true}
        />
      );
    case 'toggle':
      return (
        <Switch
          defaultChecked={fieldDefinition.defaultValue}
          checked={value || fieldDefinition.defaultValue}
          required={fieldDefinition.isRequired}
          disabled={true}
        />
      );
    default:
      throw new Error(
        `Unsupported Entry definition FieldType "${fieldDefinition.fieldType}"`
      );
  }
}

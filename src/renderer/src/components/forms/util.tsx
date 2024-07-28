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
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';

export function translatableDefault(props: {
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

export function FormFieldFromDefinition<T extends FieldValues>(
  fieldDefinition: FieldDefinition,
  name: Path<T>,
  translate: (key: string, record: TranslatableString) => string
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
            {translate('fieldDefinition.label', fieldDefinition.label)}
          </FormLabel>
          <FormControl>
            {/* @todo add styling for toggle switches */}
            {InputFromDefinition<T>(fieldDefinition, field)}
          </FormControl>
          <FormDescription>
            {translate(
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

export function InputFromDefinition<T extends FieldValues>(
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

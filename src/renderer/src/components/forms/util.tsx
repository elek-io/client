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

export interface FormFieldFromDefinitionProps<T extends FieldValues> {
  fieldDefinition: FieldDefinition;
  name: Path<T>;
  translateContent: (key: string, record: TranslatableString) => string;
}

/**
 * Used to render a Field based on a FieldDefinition and attaches it to a form context
 *
 * If you only want to render the field without it being connected to a form context,
 * use FieldFromDefinition instead.
 */
export function FormFieldFromDefinition<T extends FieldValues>(
  props: FormFieldFromDefinitionProps<T>
): JSX.Element {
  return (
    <FormField
      key={props.fieldDefinition.id}
      name={props.name}
      render={({ field }) => (
        <FormItem
          className={`col-span-12 ${fieldWidth(props.fieldDefinition.inputWidth)}`}
        >
          <FormLabel
            isRequired={
              'isRequired' in props.fieldDefinition
                ? props.fieldDefinition.isRequired
                : false
            }
          >
            {props.translateContent(
              'fieldDefinition.label',
              props.fieldDefinition.label
            )}
          </FormLabel>
          <FormControl>
            {/* @todo add styling for toggle switches */}
            <FormInputFromDefinition
              fieldDefinition={props.fieldDefinition}
              field={field}
            />
          </FormControl>
          <FormDescription>
            {props.translateContent(
              'fieldDefinition.description',
              props.fieldDefinition.description
            )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export interface FormInputFromDefinitionProps<T extends FieldValues> {
  fieldDefinition: FieldDefinition;
  field: ControllerRenderProps<FieldValues, Path<T>>;
}

function FormInputFromDefinition<T extends FieldValues>(
  props: FormInputFromDefinitionProps<T>
): JSX.Element {
  switch (props.fieldDefinition.fieldType) {
    case 'text':
      return (
        <FormInput
          field={props.field}
          type="text"
          minLength={props.fieldDefinition.min || undefined}
          maxLength={props.fieldDefinition.max || undefined}
          defaultValue={props.fieldDefinition.defaultValue || undefined}
          required={props.fieldDefinition.isRequired}
          disabled={props.fieldDefinition.isDisabled}
        />
      );
    case 'textarea':
      return (
        <FormTextarea
          field={props.field}
          minLength={props.fieldDefinition.min || undefined}
          maxLength={props.fieldDefinition.max || undefined}
          defaultValue={props.fieldDefinition.defaultValue || undefined}
          required={props.fieldDefinition.isRequired}
          disabled={props.fieldDefinition.isDisabled}
        />
      );
    case 'number':
      return (
        <FormInput
          field={props.field}
          type="number"
          min={props.fieldDefinition.min || undefined}
          max={props.fieldDefinition.max || undefined}
          defaultValue={props.fieldDefinition.defaultValue || undefined}
          required={props.fieldDefinition.isRequired}
          disabled={props.fieldDefinition.isDisabled}
        />
      );
    case 'range':
      return (
        <Slider
          {...props.field}
          defaultValue={[props.fieldDefinition.defaultValue]}
          min={props.fieldDefinition.min}
          max={props.fieldDefinition.max}
          step={1} // @todo Core needs to support this too
          disabled={props.fieldDefinition.isDisabled}
        />
      );
    case 'toggle':
      return (
        <Switch
          {...props.field}
          defaultChecked={props.fieldDefinition.defaultValue}
          checked={props.fieldDefinition.defaultValue}
          required={props.fieldDefinition.isRequired}
          disabled={props.fieldDefinition.isDisabled}
        />
      );
    default:
      throw new Error(
        `Unsupported Entry definition FieldType "${props.fieldDefinition.fieldType}"`
      );
  }
}

export interface FieldFromDefinitionProps {
  fieldDefinition: FieldDefinition;
  translateContent: (key: string, record: TranslatableString) => string;
  value?: any;
}

/**
 * Used to render a Field based on a FieldDefinition
 *
 * Only renders an input based on given definition and does not
 * connect to a form context. If you need a usable form field,
 * use FormFieldFromDefinition instead.
 */
export function FieldFromDefinition(
  props: FieldFromDefinitionProps
): JSX.Element {
  return (
    <FormItem
      className={`col-span-12 ${fieldWidth(props.fieldDefinition.inputWidth)}`}
    >
      <Label
        isRequired={
          'isRequired' in props.fieldDefinition
            ? props.fieldDefinition.isRequired
            : false
        }
      >
        {props.translateContent(
          'fieldDefinition.label',
          props.fieldDefinition.label
        )}
      </Label>
      <InputFromDefinition
        fieldDefinition={props.fieldDefinition}
        value={props.value}
      />
      <p className={'text-[0.8rem] text-zinc-500 dark:text-zinc-400'}>
        {props.translateContent(
          'fieldDefinition.description',
          props.fieldDefinition.description
        )}
      </p>
    </FormItem>
  );
}

export interface InputFromDefinitionProps {
  fieldDefinition: FieldDefinition;
  value?: any;
}

function InputFromDefinition(props: InputFromDefinitionProps): JSX.Element {
  switch (props.fieldDefinition.fieldType) {
    case 'text':
      return (
        <Input
          type="text"
          minLength={props.fieldDefinition.min || undefined}
          maxLength={props.fieldDefinition.max || undefined}
          defaultValue={props.fieldDefinition.defaultValue || undefined}
          value={props.value}
          required={props.fieldDefinition.isRequired}
          disabled={true}
        />
      );
    case 'textarea':
      return (
        <Textarea
          minLength={props.fieldDefinition.min || undefined}
          maxLength={props.fieldDefinition.max || undefined}
          defaultValue={props.fieldDefinition.defaultValue || undefined}
          value={props.value}
          required={props.fieldDefinition.isRequired}
          disabled={true}
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          min={props.fieldDefinition.min || undefined}
          max={props.fieldDefinition.max || undefined}
          defaultValue={props.fieldDefinition.defaultValue || undefined}
          value={props.value}
          required={props.fieldDefinition.isRequired}
          disabled={true}
        />
      );
    case 'range':
      return (
        <Slider
          defaultValue={[props.fieldDefinition.defaultValue]}
          value={[props.value]}
          min={props.fieldDefinition.min}
          max={props.fieldDefinition.max}
          step={1} // @todo Core needs to support this too
          disabled={true}
        />
      );
    case 'toggle':
      return (
        <Switch
          defaultChecked={props.fieldDefinition.defaultValue}
          checked={props.value || props.fieldDefinition.defaultValue}
          required={props.fieldDefinition.isRequired}
          disabled={true}
        />
      );
    default:
      throw new Error(
        `Unsupported Entry definition FieldType "${props.fieldDefinition.fieldType}"`
      );
  }
}

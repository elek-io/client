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
import { zodResolver } from '@hookform/resolvers/zod';
import { cn, fieldWidth } from '@renderer/util';
import { clsx } from 'clsx';
import { EditIcon, TrashIcon } from 'lucide-react';
import {
  forwardRef,
  useImperativeHandle,
  type ReactElement,
  type Ref,
} from 'react';
import {
  useForm,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
  type UseFieldArrayReturn,
} from 'react-hook-form';
import { Button } from '../ui/button';
import { DragHandle } from '../ui/drag-and-drop';
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
import { NumberFieldDefinitionForm } from './number-value-definition-form';
import { RangeFieldDefinitionForm } from './range-value-definition-form';
import { TextFieldDefinitionForm } from './text-value-definition-form';
import { TextareaFieldDefinitionForm } from './textarea-value-definition-form';
import { ToggleFieldDefinitionForm } from './toggle-value-definition-form';

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
  addDefinition: () => void;
  getExampleFormField: () => ReactElement;
}

export const FieldDefinitionForm = forwardRef(
  (props: FieldDefinitionFormProps, ref: Ref<FieldDefinitionFormRef>) => {
    const FieldDefinitionBaseDefaults: Omit<FieldDefinitionBase, 'id'> = {
      label: translatableDefaultNull({
        supportedLanguages: props.supportedLanguages,
      }),
      description: translatableDefaultNull({
        supportedLanguages: props.supportedLanguages,
      }),
      isRequired: true,
      isDisabled: false,
      isUnique: false,
      inputWidth: '12',
    };

    const textareaFieldDefinitionFormState = useForm<TextareaFieldDefinition>({
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'TextareaFieldDefinition validation result',
          await zodResolver(textareaFieldDefinitionSchema)(
            data,
            context,
            options
          )
        );
        return zodResolver(textareaFieldDefinitionSchema)(
          data,
          context,
          options
        );
      },
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
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'DateFieldDefinition validation result',
          await zodResolver(dateFieldDefinitionSchema)(data, context, options)
        );
        return zodResolver(dateFieldDefinitionSchema)(data, context, options);
      },
      defaultValues: {
        ...FieldDefinitionBaseDefaults,
        id: uuid(),
        valueType: 'string',
        fieldType: 'date',
        defaultValue: null,
      },
    });

    const numberFieldDefinitionFormState = useForm<NumberFieldDefinition>({
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'NumberFieldDefinition validation result',
          await zodResolver(numberFieldDefinitionSchema)(data, context, options)
        );
        return zodResolver(numberFieldDefinitionSchema)(data, context, options);
      },
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
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'RangeFieldDefinition validation result',
          await zodResolver(rangeFieldDefinitionSchema)(data, context, options)
        );
        return zodResolver(rangeFieldDefinitionSchema)(data, context, options);
      },
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
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'ToggleFieldDefinition validation result',
          await zodResolver(toggleFieldDefinitionSchema)(data, context, options)
        );
        return zodResolver(toggleFieldDefinitionSchema)(data, context, options);
      },
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
      resolver: async (data, context, options) => {
        // you can debug your validation schema here
        console.log(
          'TextFieldDefinition validation result',
          await zodResolver(textFieldDefinitionSchema)(data, context, options)
        );
        return zodResolver(textFieldDefinitionSchema)(data, context, options);
      },
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
          default:
            throw new Error(
              `Tried to validate unsupported fieldType "${props.fieldType}" of Value definition`
            );
        }
      },
      getExampleFormField: () => {
        switch (props.fieldType) {
          case 'number':
            return (
              <FormFieldFromDefinition
                fieldDefinition={numberFieldDefinitionFormState.getValues()}
                name="exampleFields.number.content"
                translateContent={props.translateContent}
              />
            );
          case 'range':
            return (
              <FormFieldFromDefinition
                fieldDefinition={rangeFieldDefinitionFormState.getValues()}
                name="exampleFields.range.content"
                translateContent={props.translateContent}
              />
            );
          case 'text':
            return (
              <FormFieldFromDefinition
                fieldDefinition={textFieldDefinitionFormState.getValues()}
                name="exampleFields.text.content"
                translateContent={props.translateContent}
              />
            );
          case 'textarea':
            return (
              <FormFieldFromDefinition
                fieldDefinition={textareaFieldDefinitionFormState.getValues()}
                name="exampleFields.textarea.content"
                translateContent={props.translateContent}
              />
            );
          case 'toggle':
            return (
              <FormFieldFromDefinition
                fieldDefinition={toggleFieldDefinitionFormState.getValues()}
                name="exampleFields.toggle.content"
                translateContent={props.translateContent}
              />
            );
          default:
            throw new Error(
              `Unsupported example form Field "${props.fieldType}"`
            );
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
      default:
        throw new Error(`Unsupported definition form "${props.fieldType}"`);
    }
  }
);
FieldDefinitionForm.displayName = 'FieldDefinitionForm';

export interface FormFieldFromDefinitionProps<T extends FieldValues> {
  fieldDefinition: FieldDefinition;
  name: Path<T>;
  translateContent: (key: string, record: TranslatableString) => string;
  className?: string;
  isDraggable?: boolean;
  isEditable?: boolean;
  onDelete?: (fieldDefinition: FieldDefinition) => void;
}

/**
 * Used to render a Field based on a FieldDefinition and attaches it to a form context
 *
 * If you only want to render the field without it being connected to a form context,
 * use FieldFromDefinition instead.
 */
export function FormFieldFromDefinition<T extends FieldValues>({
  fieldDefinition,
  name,
  translateContent,
  isDraggable = false,
  isEditable = false,
  onDelete,
  className,
  ...props
}: FormFieldFromDefinitionProps<T>): ReactElement {
  return (
    <FormField
      key={fieldDefinition.id}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            `flex items-center col-span-12 ${fieldWidth(fieldDefinition.inputWidth)}`,
            className
          )}
          {...props}
        >
          <div className="flex flex-col">
            {isDraggable && (
              <DragHandle
                id={fieldDefinition.id}
                className={clsx({ 'rounded-b-none': isEditable || onDelete })}
              />
            )}
            {isEditable && (
              <Button
                variant="secondary"
                size="icon"
                className={clsx({
                  'rounded-none': isDraggable && onDelete,
                  'rounded-t-none': isDraggable,
                  'rounded-b-none': onDelete,
                })}
              >
                <EditIcon />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onDelete(fieldDefinition)}
                className={clsx({
                  'rounded-t-none': isDraggable || isEditable,
                })}
              >
                <TrashIcon />
              </Button>
            )}
          </div>
          <div className="flex flex-col w-full gap-2">
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
              <FormInputFromDefinition
                fieldDefinition={fieldDefinition}
                field={field}
              />
            </FormControl>
            <FormDescription>
              {translateContent(
                'fieldDefinition.description',
                fieldDefinition.description
              )}
            </FormDescription>
            <FormMessage />
          </div>
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
): ReactElement {
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
  value?: string | number | boolean;
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
): ReactElement {
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
  value?: string | number | boolean | undefined;
}

function InputFromDefinition(props: InputFromDefinitionProps): ReactElement {
  switch (props.fieldDefinition.fieldType) {
    case 'text':
      if (typeof props.value !== 'string' && props.value !== undefined) {
        throw new Error(
          `Expected value to be a string, but got "${typeof props.value}"`
        );
      }
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
      if (typeof props.value !== 'string' && props.value !== undefined) {
        throw new Error(
          `Expected value to be a string, but got "${typeof props.value}"`
        );
      }
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
      if (typeof props.value !== 'number' && props.value !== undefined) {
        throw new Error(
          `Expected value to be a number, but got "${typeof props.value}"`
        );
      }
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
      if (typeof props.value !== 'number' && props.value !== undefined) {
        throw new Error(
          `Expected value to be a number, but got "${typeof props.value}"`
        );
      }
      return (
        <Slider
          defaultValue={[props.fieldDefinition.defaultValue]}
          value={props.value ? [props.value] : []}
          min={props.fieldDefinition.min}
          max={props.fieldDefinition.max}
          step={1} // @todo Core needs to support this too
          disabled={true}
        />
      );
    case 'toggle':
      if (typeof props.value !== 'boolean' && props.value !== undefined) {
        throw new Error(
          `Expected value to be a boolean, but got "${typeof props.value}"`
        );
      }
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

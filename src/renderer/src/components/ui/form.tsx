'use client';

import { Slot } from '@radix-ui/react-slot';
import { cn, fieldWidth } from '@renderer/util';
import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { Label } from './label';
import type {
  FieldDefinition,
  FieldType,
  SupportedLanguage,
  TranslatableString,
} from '@elek-io/core';
import { Input } from './input';
import { Textarea } from './textarea';
import { Slider } from './slider';
import { Switch } from './switch';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { EditIcon, LanguagesIcon, TrashIcon } from 'lucide-react';
import { Button } from './button';
import { DragHandle } from './drag-and-drop';
import clsx from 'clsx';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

function FormItem({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn('grid gap-2', className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>): React.ReactElement {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn('data-[error=true]:text-red-500', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({
  ...props
}: React.ComponentProps<typeof Slot>): React.ReactElement {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.ReactElement {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-zinc-500 dark:text-zinc-400 text-sm', className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  ...props
}: React.ComponentProps<'p'>): React.ReactElement | null {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? '') : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-red-500 text-sm', className)}
      {...props}
    >
      {body}
    </p>
  );
}

interface FormInputFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends React.ComponentProps<'input'> {
  field: ControllerRenderProps<TFieldValues, TName>;
  type: FieldType;
}

/**
 * Special variant of the Input component
 * that transforms the value the user put in
 * e.g. to a number before handing it back to the form field.
 * It also returns null instead of an empty string
 * if the user did not put in a value.
 */
function FormInputField<TFieldValues extends FieldValues>({
  field,
  type,
  ...props
}: FormInputFieldProps<TFieldValues>): React.ReactElement {
  function transform(value: string): string | number | null {
    if (value.trim() === '') {
      return null;
    }
    if (type === 'number') {
      return parseInt(value);
    }
    return value;
  }

  return (
    <Input
      type={type === 'telephone' ? 'tel' : type}
      {...field}
      value={field.value || ''} // The value can now also be null but the input can't handle it, so we set a default empty string instead
      onChange={(event) => field.onChange(transform(event.target.value))}
      {...props}
    />
  );
}

interface FormTextareaFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends React.ComponentProps<'textarea'> {
  field: ControllerRenderProps<TFieldValues, TName>;
}

/**
 * Special variant of the Textarea component
 * that returns null instead of an empty string
 * if the user did not put in a value and hands
 * it back to the given form field.
 */
function FormTextareaField<TFieldValues extends FieldValues>({
  field,
  ...props
}: FormTextareaFieldProps<TFieldValues>): React.ReactElement {
  function transform(value: string): string | number | null {
    if (value.trim() === '') {
      return null;
    }
    return value;
  }

  return (
    <Textarea
      {...field}
      value={field.value || ''} // The value can now also be null but the input can't handle it, so we set a default empty string instead
      onChange={(event) => field.onChange(transform(event.target.value))}
      {...props}
    />
  );
}

interface FormRangeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends React.ComponentProps<typeof SliderPrimitive.Root> {
  field: ControllerRenderProps<TFieldValues, TName>;
}

function FormRangeField<TFieldValues extends FieldValues>({
  field,
  ...props
}: FormRangeFieldProps<TFieldValues>): React.ReactElement {
  return (
    <Slider
      {...field}
      onValueChange={(value) => field.onChange(value[0])}
      {...props}
    />
  );
}

interface FormToggleFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  field: ControllerRenderProps<TFieldValues, TName>;
}

function FormToggleField<TFieldValues extends FieldValues>({
  field,
  ...props
}: FormToggleFieldProps<TFieldValues>): React.ReactElement {
  return (
    <Switch
      {...field}
      checked={field.value}
      onCheckedChange={field.onChange}
      {...props}
    />
  );
}

export interface FormComponentFromFieldDefinitionProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldDefinition: FieldDefinition;
  className?: string;
}

/**
 * Renders a component based on the fieldDefinition property
 * e.g. a text input for fieldType "text"
 * or a toggle switch for fieldType "toggle".
 */
function FormComponentFromFieldDefinition<TFieldValues extends FieldValues>({
  field,
  fieldDefinition,
  ...props
}: FormComponentFromFieldDefinitionProps<TFieldValues>): React.ReactElement {
  switch (fieldDefinition.fieldType) {
    case 'text':
    case 'telephone':
    case 'email':
    case 'number':
    case 'url':
      return (
        <FormInputField
          type={fieldDefinition.fieldType}
          // Text input specific props
          minLength={
            'min' in fieldDefinition
              ? fieldDefinition.min || undefined
              : undefined
          }
          maxLength={
            'max' in fieldDefinition
              ? fieldDefinition.max || undefined
              : undefined
          }
          // Number input specific props
          min={
            'min' in fieldDefinition
              ? fieldDefinition.min || undefined
              : undefined
          }
          max={
            'max' in fieldDefinition
              ? fieldDefinition.max || undefined
              : undefined
          }
          // Props common to all input types
          defaultValue={fieldDefinition.defaultValue || undefined}
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
          field={field}
          {...props}
        />
      );
    case 'textarea':
      return (
        <FormTextareaField
          minLength={fieldDefinition.min || undefined}
          maxLength={fieldDefinition.max || undefined}
          defaultValue={fieldDefinition.defaultValue || undefined}
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
          field={field}
          {...props}
        />
      );
    case 'range':
      return (
        <FormRangeField
          defaultValue={[fieldDefinition.defaultValue]}
          min={fieldDefinition.min}
          max={fieldDefinition.max}
          step={1} // @todo Core needs to support this too
          disabled={fieldDefinition.isDisabled}
          field={field}
          {...props}
        />
      );
    case 'toggle':
      return (
        <FormToggleField
          defaultChecked={fieldDefinition.defaultValue}
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
          field={field}
          {...props}
        />
      );
    case 'date':
    case 'time':
    case 'datetime':
    case 'ipv4':
    case 'asset':
    case 'entry':
      throw new Error(
        `[FormComponentFromFieldDefinition] Unsupported fieldType "${fieldDefinition.fieldType}"`
      );
  }
}

export interface FormComponentFromFieldDefinitionTranslatableProps<
  TFieldValues extends FieldValues,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TContext = any,
  TTransformedValues = TFieldValues,
> extends FormComponentFromFieldDefinitionProps<TFieldValues> {
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
  supportedLanguages: SupportedLanguage[];
  translateContent(key: string, record: TranslatableString): string;
}

/**
 * Renders a component based on the fieldDefinition property
 * e.g. a text input for fieldType "text"
 * or a toggle switch for fieldType "toggle".
 *
 * Additionally, if there are multiple supported languages,
 * it renders a button next to the field that opens a dialog
 * where translations for all supported languages can be entered.
 */
function FormComponentFromFieldDefinitionTranslatable<
  TFieldValues extends FieldValues,
>({
  form,
  field,
  fieldDefinition,
  supportedLanguages,
  translateContent,
  className,
  ...props
}: FormComponentFromFieldDefinitionTranslatableProps<TFieldValues>): React.ReactElement {
  const nameArray = field.name.split('.');
  const currentLanguage = nameArray[nameArray.length - 1] as SupportedLanguage;
  const baseName = field.name
    .split('.')
    .slice(0, -1)
    .join('.') as FieldPath<TFieldValues>;

  /**
   * Returns true if there are errors in the translations for the current field
   * other than the current language.
   */
  function hasErrorsInTranslations(): boolean {
    // Traverse the errors object to reach the base field errors
    let fieldErrors = form.formState.errors;
    for (const segment of baseName.split('.')) {
      if (!fieldErrors || typeof fieldErrors !== 'object') {
        return false;
      }
      fieldErrors = fieldErrors[segment];
    }

    if (!fieldErrors || typeof fieldErrors !== 'object') {
      return false;
    }

    // Check for errors in other languages
    return supportedLanguages.some(
      (language) => language !== currentLanguage && !!fieldErrors[language]
    );
  }

  return (
    <>
      {supportedLanguages.length > 1 ? (
        <div className={cn('flex items-center', className)}>
          <FormComponentFromFieldDefinition
            field={field}
            fieldDefinition={fieldDefinition}
            className="rounded-r-none"
            {...props}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="rounded-l-none h-full"
                aria-invalid={hasErrorsInTranslations()}
                Icon={LanguagesIcon}
              />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {translateContent(
                    'fieldDefinition.label',
                    fieldDefinition.label
                  )}
                </DialogTitle>
                {fieldDefinition.description && (
                  <DialogDescription>
                    {translateContent(
                      'fieldDefinition.description',
                      fieldDefinition.description
                    )}
                  </DialogDescription>
                )}
              </DialogHeader>

              <DialogBody>
                {supportedLanguages.map((language) => {
                  return (
                    <FormField
                      key={language}
                      name={`${baseName}.${language}`}
                      render={({ field }) => (
                        <FormItem>
                          {/* Translations into supported languages are always required! */}
                          <FormLabel isRequired={true}>{language}</FormLabel>
                          <FormControl>
                            <FormComponentFromFieldDefinition
                              field={field}
                              fieldDefinition={fieldDefinition}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </DialogBody>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Done</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <FormComponentFromFieldDefinition
          field={field}
          fieldDefinition={fieldDefinition}
          {...props}
        />
      )}
    </>
  );
}

export interface FormFieldFromDefinitionProps<
  TFieldValues extends FieldValues,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TContext = any,
  TTransformedValues = TFieldValues,
> {
  fieldDefinition: FieldDefinition;
  form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
  name: FieldPath<TFieldValues>;
  supportedLanguages: SupportedLanguage[];
  translateContent(key: string, record: TranslatableString): string;
  isDraggable?: boolean;
  isEditable?: boolean;
  onDelete?: (fieldDefinition: FieldDefinition) => void;
  className?: string;
}

/**
 * Renders a complete, translatable form field with label, description, validation message
 * and the actual input component based on the given field definition.
 */
function FormFieldFromDefinition<TFieldValues extends FieldValues>({
  form,
  name,
  fieldDefinition,
  translateContent,
  supportedLanguages,
  isDraggable = false,
  isEditable = false,
  onDelete,
  className,
}: FormFieldFromDefinitionProps<TFieldValues>): React.ReactElement {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            `flex items-center col-span-12 ${fieldWidth(fieldDefinition.inputWidth)}`,
            className
          )}
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
                Icon={EditIcon}
                variant="secondary"
                size="icon"
                className={clsx({
                  'rounded-none': isDraggable && onDelete,
                  'rounded-t-none': isDraggable,
                  'rounded-b-none': onDelete,
                })}
              />
            )}
            {onDelete && (
              <Button
                Icon={TrashIcon}
                variant="destructive"
                size="icon"
                onClick={() => onDelete(fieldDefinition)}
                className={clsx({
                  'rounded-t-none': isDraggable || isEditable,
                })}
              />
            )}
          </div>
          <div className="flex flex-col w-full gap-2">
            <FormLabel isRequired={fieldDefinition.isRequired}>
              {translateContent('fieldDefinition.label', fieldDefinition.label)}
            </FormLabel>
            <FormControl>
              <FormComponentFromFieldDefinitionTranslatable
                form={form}
                field={field}
                fieldDefinition={fieldDefinition}
                supportedLanguages={supportedLanguages}
                translateContent={translateContent}
              />
            </FormControl>
            {fieldDefinition.description && (
              <FormDescription>
                {translateContent(
                  'fieldDefinition.description',
                  fieldDefinition.description
                )}
              </FormDescription>
            )}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
  FormFieldFromDefinition,
};

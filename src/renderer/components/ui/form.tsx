'use client';

import type * as SliderPrimitive from '@radix-ui/react-slider';
import { Slot } from '@radix-ui/react-slot';
import type * as SwitchPrimitive from '@radix-ui/react-switch';
import { EditIcon, LanguagesIcon, TrashIcon } from 'lucide-react';
import * as React from 'react';
import {
  Controller,
  FormProvider,
  type ControllerProps,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';

import { DragHandle } from '@renderer/components/drag-and-drop';
import { Button } from '@renderer/components/ui/button';
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
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Slider } from '@renderer/components/ui/slider';
import { Switch } from '@renderer/components/ui/switch';
import { Textarea } from '@renderer/components/ui/textarea';
import {
  FormFieldContext,
  FormItemContext,
  useFormField,
} from '@renderer/hooks/useFormField';
import { useProject } from '@renderer/hooks/useProject';
import { cn, fieldWidth } from '@renderer/lib/utils';

import type {
  FieldDefinition,
  FieldType,
  SupportedLanguage,
} from '@elek-io/core';

const Form = FormProvider;

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>): React.JSX.Element => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

function FormItem({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
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
}: React.ComponentProps<typeof Label>): React.JSX.Element {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({
  ...props
}: React.ComponentProps<typeof Slot>): React.JSX.Element {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        error === undefined
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={error !== undefined}
      {...props}
    />
  );
}

function FormDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.JSX.Element {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function FormMessage({
  className,
  ...props
}: React.ComponentProps<'p'>): React.JSX.Element | null {
  const { error, formMessageId } = useFormField();
  const body =
    error !== undefined ? String(error.message ?? '') : props.children;

  if (body === undefined || body === null || body === '') {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-sm text-destructive', className)}
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
      value={field.value !== null ? field.value : ''} // The value can now also be null but the input can't handle it, so we set a default empty string instead
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
      value={field.value !== null ? field.value : ''} // The value can now also be null but the input can't handle it, so we set a default empty string instead
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
              ? fieldDefinition.min !== null
                ? fieldDefinition.min
                : undefined
              : undefined
          }
          maxLength={
            'max' in fieldDefinition
              ? fieldDefinition.max !== null
                ? fieldDefinition.max
                : undefined
              : undefined
          }
          // Number input specific props
          min={
            'min' in fieldDefinition
              ? fieldDefinition.min !== null
                ? fieldDefinition.min
                : undefined
              : undefined
          }
          max={
            'max' in fieldDefinition
              ? fieldDefinition.max !== null
                ? fieldDefinition.max
                : undefined
              : undefined
          }
          // Props common to all input types
          defaultValue={
            fieldDefinition.defaultValue !== null
              ? fieldDefinition.defaultValue
              : undefined
          }
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
          field={field}
          {...props}
        />
      );
    case 'textarea':
      return (
        <FormTextareaField
          minLength={
            fieldDefinition.min !== null ? fieldDefinition.min : undefined
          }
          maxLength={
            fieldDefinition.max !== null ? fieldDefinition.max : undefined
          }
          defaultValue={
            fieldDefinition.defaultValue !== null
              ? fieldDefinition.defaultValue
              : undefined
          }
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
  className,
  ...props
}: FormComponentFromFieldDefinitionTranslatableProps<TFieldValues>): React.ReactElement {
  const { translateContent } = useProject();
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
    let fieldErrors: unknown = form.formState.errors;
    for (const segment of baseName.split('.')) {
      if (typeof fieldErrors !== 'object' || fieldErrors === null) {
        return false;
      }
      fieldErrors = (fieldErrors as Record<string, unknown>)[segment];
    }

    if (typeof fieldErrors !== 'object' || fieldErrors === null) {
      return false;
    }

    // Check for errors in other languages
    return supportedLanguages.some(
      (language) =>
        language !== currentLanguage && fieldErrors[language] !== undefined
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
                className="h-full rounded-l-none"
                aria-invalid={hasErrorsInTranslations()}
                Icon={LanguagesIcon}
              />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {translateContent({
                    key: 'fieldDefinition.label',
                    record: fieldDefinition.label,
                  })}
                </DialogTitle>
                {fieldDefinition.description !== null ? (
                  <DialogDescription>
                    {translateContent({
                      key: 'fieldDefinition.description',
                      record: fieldDefinition.description,
                    })}
                  </DialogDescription>
                ) : null}
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
                          <FormLabel isRequired>{language}</FormLabel>
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

interface FormFieldFromDefinitionProps<TFieldValues extends FieldValues> {
  fieldDefinition: FieldDefinition;
  form: UseFormReturn<TFieldValues>;
  name: FieldPath<TFieldValues>;
  supportedLanguages: SupportedLanguage[];
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
  supportedLanguages,
  isDraggable = false,
  isEditable = false,
  onDelete,
  className,
}: FormFieldFromDefinitionProps<TFieldValues>): React.ReactElement {
  const { translateContent } = useProject();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            `col-span-12 flex items-center ${fieldWidth(fieldDefinition.inputWidth)}`,
            className
          )}
        >
          <div className="flex flex-col">
            {isDraggable === true ? (
              <DragHandle
                id={fieldDefinition.id}
                className={cn({
                  'rounded-b-none':
                    isEditable === true || onDelete !== undefined,
                })}
              />
            ) : null}
            {isEditable === true ? (
              <Button
                Icon={EditIcon}
                variant="secondary"
                size="icon"
                className={cn({
                  'rounded-none':
                    isDraggable === true && onDelete !== undefined,
                  'rounded-t-none': isDraggable === true,
                  'rounded-b-none': onDelete !== undefined,
                })}
              />
            ) : null}
            {onDelete !== undefined ? (
              <Button
                Icon={TrashIcon}
                variant="destructive"
                size="icon"
                onClick={() => onDelete(fieldDefinition)}
                className={cn({
                  'rounded-t-none': isDraggable === true || isEditable === true,
                })}
              />
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-2">
            <FormLabel isRequired={fieldDefinition.isRequired}>
              {translateContent({
                key: 'fieldDefinition.label',
                record: fieldDefinition.label,
              })}
            </FormLabel>
            <FormControl>
              <FormComponentFromFieldDefinitionTranslatable
                form={form}
                field={field}
                fieldDefinition={fieldDefinition}
                supportedLanguages={supportedLanguages}
              />
            </FormControl>
            {fieldDefinition.description !== null ? (
              <FormDescription>
                {translateContent({
                  key: 'fieldDefinition.description',
                  record: fieldDefinition.description,
                })}
              </FormDescription>
            ) : null}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormFieldFromDefinition,
};

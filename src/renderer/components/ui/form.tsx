'use client';

import type * as SliderPrimitive from '@radix-ui/react-slider';
import { Slot } from '@radix-ui/react-slot';
import type * as SwitchPrimitive from '@radix-ui/react-switch';
import {
  CheckIcon,
  EditIcon,
  ImagePlusIcon,
  LanguagesIcon,
  ListPlusIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import * as React from 'react';
import {
  Controller,
  FormProvider,
  type ControllerProps,
  type ControllerRenderProps,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';

import { AssetDisplay } from '@renderer/components/asset-display';
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
import { useQueriesNoError } from '@renderer/hooks/useQueriesNoError';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { cn, fieldWidth } from '@renderer/lib/utils';
import { queryOptions } from '@renderer/queries';

import type {
  Asset,
  AssetFieldDefinition,
  Collection,
  Entry,
  EntryFieldDefinition,
  FieldDefinition,
  FieldType,
  SupportedLanguage,
  ValueContentReferenceToAsset,
  ValueContentReferenceToEntry,
} from '@elek-io/core';

import { DatePicker } from './date-picker';
import { InputGroup, InputGroupAddon } from './input-group';

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

export interface FormInputFieldProps<
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
export function FormInputField<TFieldValues extends FieldValues>({
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

  // Some field types have no matching HTML input type of the same name
  const htmlInputType =
    type === 'telephone'
      ? 'tel'
      : type === 'ipv4'
        ? 'text'
        : type === 'datetime'
          ? 'datetime-local'
          : type;

  return (
    <Input
      type={htmlInputType}
      {...field}
      value={field.value ?? ''} // Content can be null (cleared) or undefined (language absent from the partial record); the input needs a string either way
      onChange={(event) => field.onChange(transform(event.target.value))}
      {...props}
    />
  );
}

export interface TranslatableFormInputFieldProps<T extends FieldValues>
  extends FormInputFieldProps<T> {
  title: string;
  description: string;
  supportedLanguages: SupportedLanguage[];
  errors: FieldErrors;
}

/**
 * Renders a FormInputField component with additional button to manage translations
 *
 * @todo TranslatableFormInputField and TranslatableFormTextareaField are almost identical. Consider refactoring to reduce duplication.
 */
export function TranslatableFormInputField<T extends FieldValues>({
  title,
  description,
  field,
  supportedLanguages,
  className,
  type,
  errors,
  ...props
}: TranslatableFormInputFieldProps<T>): React.ReactElement {
  const currentLanguage = field.name.split('.').pop() as SupportedLanguage;
  const baseName = field.name.split('.').slice(0, -1).join('.');

  /**
   * Returns true if there are errors in the translations for the current field
   * other than the current language.
   */
  function hasErrorsInTranslations(): boolean {
    // Traverse the errors object to reach the base field errors
    let fieldErrors: unknown = errors;
    for (const segment of baseName.split('.')) {
      if (
        fieldErrors === null ||
        fieldErrors === undefined ||
        typeof fieldErrors !== 'object'
      ) {
        return false;
      }
      fieldErrors = (fieldErrors as Record<string, unknown>)[segment];
    }

    if (
      fieldErrors === null ||
      fieldErrors === undefined ||
      typeof fieldErrors !== 'object'
    ) {
      return false;
    }

    // Check for errors in other languages
    return supportedLanguages.some(
      (language) =>
        language !== currentLanguage &&
        (fieldErrors as Record<string, unknown>)[language] !== undefined
    );
  }

  return (
    <>
      {supportedLanguages.length > 1 ? (
        <div className={cn('flex items-center', className)}>
          <FormInputField
            field={field}
            type={type}
            className="rounded-r-none"
            {...props}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="rounded-l-none"
                aria-invalid={hasErrorsInTranslations()}
              >
                <LanguagesIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>

              <DialogBody>
                {supportedLanguages.map((language) => {
                  return (
                    <FormField
                      key={language}
                      name={`${baseName}.${language}` as Path<T>}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired>{language}</FormLabel>
                          <FormControl>
                            <FormInputField field={field} type={type} />
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
        <FormInputField field={field} type={type} />
      )}
    </>
  );
}

export interface FormTextareaFieldProps<
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
export function FormTextareaField<TFieldValues extends FieldValues>({
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
      value={field.value ?? ''} // Content can be null (cleared) or undefined (language absent from the partial record); the input needs a string either way
      onChange={(event) => field.onChange(transform(event.target.value))}
      {...props}
    />
  );
}

export interface TranslatableFormTextareaFieldProps<T extends FieldValues>
  extends FormTextareaFieldProps<T> {
  title: string;
  description: string;
  supportedLanguages: SupportedLanguage[];
  errors: FieldErrors;
}

/**
 * Renders a FormTextarea component with additional button to manage translations
 *
 * @todo TranslatableFormTextareaField and TranslatableFormInputField are almost identical. Consider refactoring to reduce duplication.
 */
export function TranslatableFormTextareaField<T extends FieldValues>({
  title,
  description,
  field,
  supportedLanguages,
  className,
  errors,
  ...props
}: TranslatableFormTextareaFieldProps<T>): React.ReactElement {
  const currentLanguage = field.name.split('.').pop() as SupportedLanguage;
  const baseName = field.name.split('.').slice(0, -1).join('.');

  /**
   * Returns true if there are errors in the translations for the current field
   * other than the current language.
   */
  function hasErrorsInTranslations(): boolean {
    // Traverse the errors object to reach the base field errors
    let fieldErrors: unknown = errors;
    for (const segment of baseName.split('.')) {
      if (
        fieldErrors === null ||
        fieldErrors === undefined ||
        typeof fieldErrors !== 'object'
      ) {
        return false;
      }
      fieldErrors = (fieldErrors as Record<string, unknown>)[segment];
    }

    if (
      fieldErrors === null ||
      fieldErrors === undefined ||
      typeof fieldErrors !== 'object'
    ) {
      return false;
    }

    // Check for errors in other languages
    return supportedLanguages.some(
      (language) =>
        language !== currentLanguage &&
        (fieldErrors as Record<string, unknown>)[language] !== undefined
    );
  }

  return (
    <>
      {supportedLanguages.length > 1 ? (
        <div className={cn('flex', className)}>
          <FormTextareaField
            field={field}
            className="rounded-r-none"
            {...props}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="h-full rounded-l-none"
                aria-invalid={hasErrorsInTranslations()}
              >
                <LanguagesIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </DialogHeader>

              <DialogBody>
                {supportedLanguages.map((language) => {
                  return (
                    <FormField
                      key={language}
                      name={
                        `${field.name.split('.').slice(0, -1).join('.')}.${language}` as Path<T>
                      }
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isRequired={false}>{language}</FormLabel>
                          <FormControl>
                            <FormTextareaField field={field} />
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
        <FormTextareaField field={field} />
      )}
    </>
  );
}

interface FormDateFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends React.ComponentProps<'input'> {
  field: ControllerRenderProps<TFieldValues, TName>;
}

/**
 * Special variant of the Input component
 * that uses the custom DatePicker component.
 */
function FormDateField<TFieldValues extends FieldValues>({
  field,
  className,
  ...props
}: FormDateFieldProps<TFieldValues>): React.ReactElement {
  const dateFromValue = React.useMemo(() => {
    if (typeof field.value === 'string' && field.value !== '') {
      const parsedDate = new Date(field.value);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
    return null;
  }, [field.value]);

  function dateToString(date: Date | null): string {
    if (date === null) {
      return '';
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  }

  return (
    <InputGroup>
      <FormInputField
        field={field}
        data-slot="input-group-control"
        className={cn(
          'flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent',
          className
        )}
        {...props}
        value={field.value ?? ''}
        onChange={(event) => {
          field.onChange(event.target.value || null);
        }}
        type="date"
      />
      <InputGroupAddon align="inline-end">
        <DatePicker
          variant="ghost"
          size="xs"
          date={dateFromValue}
          setDate={(value) => {
            const newDate =
              typeof value === 'function' ? value(dateFromValue) : value;
            field.onChange(dateToString(newDate));
          }}
        />
      </InputGroupAddon>
    </InputGroup>
  );
}

interface FormDatetimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends React.ComponentProps<'input'> {
  field: ControllerRenderProps<TFieldValues, TName>;
}

/**
 * Special variant of the Input component for datetime Values.
 * Core stores an ISO datetime with timezone (UTC), while the native
 * datetime-local input speaks the user's local time without one,
 * so this converts in both directions.
 */
function FormDatetimeField<TFieldValues extends FieldValues>({
  field,
  className,
  ...props
}: FormDatetimeFieldProps<TFieldValues>): React.ReactElement {
  const dateFromValue = React.useMemo(() => {
    if (typeof field.value === 'string' && field.value !== '') {
      const parsedDate = new Date(field.value);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
    return null;
  }, [field.value]);

  function dateToLocalInputValue(date: Date | null): string {
    if (date === null) {
      return '';
    }

    const pad = (value: number): string => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return (
    <InputGroup>
      <FormInputField
        field={field}
        data-slot="input-group-control"
        className={cn(
          'flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent',
          className
        )}
        {...props}
        value={dateToLocalInputValue(dateFromValue)}
        onChange={(event) => {
          field.onChange(
            event.target.value === ''
              ? null
              : new Date(event.target.value).toISOString()
          );
        }}
        type="datetime"
      />
      <InputGroupAddon align="inline-end">
        <DatePicker
          variant="ghost"
          size="xs"
          date={dateFromValue}
          setDate={(value) => {
            const newDate =
              typeof value === 'function' ? value(dateFromValue) : value;
            if (newDate === null) {
              field.onChange(null);
              return;
            }
            // Picking a date keeps the already entered time of day
            const merged = new Date(newDate);
            if (dateFromValue !== null) {
              merged.setHours(
                dateFromValue.getHours(),
                dateFromValue.getMinutes(),
                0,
                0
              );
            }
            field.onChange(merged.toISOString());
          }}
        />
      </InputGroupAddon>
    </InputGroup>
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
      {...props}
      name={field.name}
      ref={field.ref}
      onBlur={field.onBlur}
      // Radix Slider is a range control (value is number[]), but a range Value's
      // content is a single number, so wrap it and tolerate a null/empty content.
      value={typeof field.value === 'number' ? [field.value] : []}
      onValueChange={(value) => field.onChange(value[0])}
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

interface FormAssetFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldDefinition: AssetFieldDefinition;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Form field component for selecting one or multiple existing Assets.
 * Opens a dialog to browse and select assets from the project.
 * The field value is an array of ValueContentReferenceToAsset objects.
 */
function FormAssetField<TFieldValues extends FieldValues>({
  field,
  fieldDefinition,
  disabled,
}: FormAssetFieldProps<TFieldValues>): React.ReactElement {
  const { projectId } = useProject();
  const { data: assetList, isPending: isReadingAssets } = useQueryNoError(
    queryOptions.assets.list({ projectId, limit: 0 })
  );

  const selectedRefs: ValueContentReferenceToAsset[] = Array.isArray(
    field.value
  )
    ? field.value
    : [];

  const selectedIds = new Set(selectedRefs.map((ref) => ref.id));

  const maxReached =
    fieldDefinition.max !== null && selectedRefs.length >= fieldDefinition.max;

  function toggleAsset(asset: Asset): void {
    if (selectedIds.has(asset.id)) {
      field.onChange(
        selectedRefs.filter((ref) => ref.id !== asset.id) as typeof field.value
      );
    } else if (!maxReached) {
      field.onChange([
        ...selectedRefs,
        { id: asset.id, objectType: 'asset' as const },
      ] as typeof field.value);
    }
  }

  function removeAsset(assetId: string): void {
    field.onChange(
      selectedRefs.filter((ref) => ref.id !== assetId) as typeof field.value
    );
  }

  // Resolve selected refs to full Asset objects for display
  const selectedAssets: Asset[] = isReadingAssets
    ? []
    : selectedRefs
        .map((ref) => assetList.list.find((a) => a.id === ref.id))
        .filter((a): a is Asset => a !== undefined);

  return (
    <div className="space-y-3">
      {selectedAssets.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {selectedAssets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
            >
              <AssetDisplay {...asset} static className="aspect-4/3" />
              <div className="truncate px-2 py-1 text-xs text-muted-foreground">
                {asset.name}
              </div>
              {disabled !== true && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeAsset(asset.id)}
                  type="button"
                  Icon={XIcon}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            type="button"
            disabled={disabled === true || maxReached}
            Icon={ImagePlusIcon}
          >
            Select Assets
            {fieldDefinition.min !== null || fieldDefinition.max !== null ? (
              <span className="ml-1 text-muted-foreground">
                ({selectedRefs.length}
                {fieldDefinition.max !== null
                  ? ` / ${fieldDefinition.max}`
                  : ''}
                )
              </span>
            ) : null}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Assets</DialogTitle>
            <DialogDescription>
              {fieldDefinition.max !== null
                ? `Select up to ${fieldDefinition.max} asset${fieldDefinition.max !== 1 ? 's' : ''}.`
                : 'Select one or more assets.'}
              {fieldDefinition.min !== null
                ? ` At least ${fieldDefinition.min} required.`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {isReadingAssets ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => {
                  const key = `skeleton-${String(i)}`;
                  return (
                    <div
                      key={key}
                      className="aspect-4/3 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800"
                    />
                  );
                })}
              </div>
            ) : assetList.list.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No assets available. Add assets to the project first.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {assetList.list.map((asset) => {
                  const isSelected = selectedIds.has(asset.id);
                  const isDisabledOption = !isSelected && maxReached;

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      disabled={isDisabledOption}
                      onClick={() => toggleAsset(asset)}
                      className={cn(
                        'relative cursor-pointer overflow-hidden rounded-md border-2 transition-all',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500',
                        isDisabledOption && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <AssetDisplay {...asset} static />
                      <div className="truncate px-2 py-1 text-xs text-muted-foreground">
                        {asset.name}
                      </div>
                      {isSelected === true ? (
                        <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <CheckIcon className="h-3 w-3" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FormEntryFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldDefinition: EntryFieldDefinition;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Form field component for selecting one or multiple existing Entries.
 * Opens a dialog to browse and select entries from allowed collections.
 * The field value is an array of ValueContentReferenceToEntry objects.
 */
function FormEntryField<TFieldValues extends FieldValues>({
  field,
  fieldDefinition,
  disabled,
}: FormEntryFieldProps<TFieldValues>): React.ReactElement {
  const { projectId, translateContent } = useProject();
  const { data: collectionList, isPending: isReadingCollections } =
    useQueryNoError(queryOptions.collections.list({ projectId, limit: 0 }));

  // Filter collections based on ofCollections restriction
  const allowedCollections: Collection[] = isReadingCollections
    ? []
    : fieldDefinition.ofCollections.length > 0
      ? collectionList.list.filter((c) =>
          fieldDefinition.ofCollections.includes(c.id)
        )
      : collectionList.list;

  // Fetch entries for each allowed collection
  const entryQueries = useQueriesNoError(
    allowedCollections.map((c) =>
      queryOptions.entries.list({ projectId, collectionId: c.id, limit: 0 })
    )
  );

  const isReadingEntries = entryQueries.some((q) => q.isPending);

  // Build a flat list of all available entries with their collection context
  const availableEntries: Array<{ entry: Entry; collection: Collection }> = [];
  if (isReadingEntries === false) {
    allowedCollections.forEach((collection, index) => {
      const entryQuery = entryQueries[index];
      if (entryQuery !== undefined && entryQuery.isPending === false) {
        entryQuery.data.list.forEach((entry) => {
          availableEntries.push({ entry, collection });
        });
      }
    });
  }

  const selectedRefs: ValueContentReferenceToEntry[] = Array.isArray(
    field.value
  )
    ? field.value
    : [];

  const selectedIds = new Set(selectedRefs.map((ref) => ref.id));

  const maxReached =
    fieldDefinition.max !== null && selectedRefs.length >= fieldDefinition.max;

  function toggleEntry(entryId: string): void {
    if (selectedIds.has(entryId)) {
      field.onChange(
        selectedRefs.filter((ref) => ref.id !== entryId) as typeof field.value
      );
    } else if (maxReached === false) {
      field.onChange([
        ...selectedRefs,
        { id: entryId, objectType: 'entry' as const },
      ] as typeof field.value);
    }
  }

  function removeEntry(entryId: string): void {
    field.onChange(
      selectedRefs.filter((ref) => ref.id !== entryId) as typeof field.value
    );
  }

  /**
   * Returns a human-readable label for an entry by extracting the first
   * string value from its content, or falls back to a truncated ID.
   */
  function getEntryLabel(entry: Entry): string {
    for (const value in entry.values) {
      if (entry.values[value]?.valueType === 'string') {
        const content = Object.values(entry.values[value].content).find(
          (v) => typeof v === 'string' && v.length > 0
        );
        if (content !== undefined) {
          return String(content);
        }
      }
    }
    return entry.id.slice(0, 8);
  }

  // Resolve selected refs to entries with collection context for display
  const selectedEntries = selectedRefs
    .map((ref) => {
      const found = availableEntries.find((ae) => ae.entry.id === ref.id);
      return found !== undefined ? found : null;
    })
    .filter(
      (item): item is { entry: Entry; collection: Collection } => item !== null
    );

  // Group available entries by collection for the picker dialog
  const entriesByCollection = allowedCollections.map((collection, index) => ({
    collection,
    entries:
      isReadingEntries === false &&
      entryQueries[index] !== undefined &&
      entryQueries[index].isPending === false
        ? entryQueries[index].data.list
        : [],
  }));

  return (
    <div className="space-y-3">
      {selectedEntries.length > 0 && (
        <div className="space-y-1">
          {selectedEntries.map(({ entry, collection }) => (
            <div
              key={entry.id}
              className="group flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-700"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">
                  {getEntryLabel(entry)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {translateContent({
                    key: 'collection.name.singular',
                    record: collection.name.singular,
                  })}
                </span>
              </div>
              {disabled !== true && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeEntry(entry.id)}
                  type="button"
                  Icon={XIcon}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="secondary"
            type="button"
            disabled={disabled === true || maxReached}
            Icon={ListPlusIcon}
          >
            Select Entries
            {fieldDefinition.min !== null || fieldDefinition.max !== null ? (
              <span className="ml-1 text-muted-foreground">
                ({selectedRefs.length}
                {fieldDefinition.max !== null
                  ? ` / ${fieldDefinition.max}`
                  : ''}
                )
              </span>
            ) : null}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Entries</DialogTitle>
            <DialogDescription>
              {fieldDefinition.max !== null
                ? `Select up to ${fieldDefinition.max} ${fieldDefinition.max !== 1 ? 'entries' : 'entry'}.`
                : 'Select one or more entries.'}
              {fieldDefinition.min !== null
                ? ` At least ${fieldDefinition.min} required.`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {isReadingCollections === true || isReadingEntries === true ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => {
                  const key = `skeleton-${String(i)}`;
                  return (
                    <div
                      key={key}
                      className="h-10 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800"
                    />
                  );
                })}
              </div>
            ) : availableEntries.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No entries available. Create entries in the allowed collections
                first.
              </p>
            ) : (
              <div className="space-y-6">
                {entriesByCollection.map(({ collection, entries }) => {
                  if (entries.length === 0) return null;
                  return (
                    <div key={collection.id}>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                        {translateContent({
                          key: 'collection.name.plural',
                          record: collection.name.plural,
                        })}
                      </h4>
                      <div className="space-y-1">
                        {entries.map((entry) => {
                          const isSelected = selectedIds.has(entry.id);
                          const isDisabledOption =
                            isSelected === false && maxReached;

                          return (
                            <button
                              key={entry.id}
                              type="button"
                              disabled={isDisabledOption}
                              onClick={() => toggleEntry(entry.id)}
                              className={cn(
                                'flex w-full items-center rounded-md border-2 px-3 py-2 text-left transition-all',
                                isSelected === true
                                  ? 'border-primary bg-primary/5'
                                  : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500',
                                isDisabledOption === true &&
                                  'cursor-not-allowed opacity-50'
                              )}
                            >
                              <span className="min-w-0 flex-1 truncate text-sm">
                                {getEntryLabel(entry)}
                              </span>
                              {isSelected === true ? (
                                <div className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <CheckIcon className="h-3 w-3" />
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
    case 'ipv4':
    case 'time':
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
      return (
        <FormDateField
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
          field={field}
          {...props}
          value={
            fieldDefinition.defaultValue !== null
              ? fieldDefinition.defaultValue
              : undefined
          }
        />
      );
    case 'asset':
      return (
        <FormAssetField
          fieldDefinition={fieldDefinition}
          disabled={fieldDefinition.isDisabled}
          required={fieldDefinition.isRequired}
          field={field}
          {...props}
        />
      );
    case 'entry':
      return (
        <FormEntryField
          fieldDefinition={fieldDefinition}
          disabled={fieldDefinition.isDisabled}
          required={fieldDefinition.isRequired}
          field={field}
          {...props}
        />
      );
    case 'datetime':
      return (
        <FormDatetimeField
          required={fieldDefinition.isRequired}
          disabled={fieldDefinition.isDisabled}
          field={field}
          {...props}
        />
      );
    case 'select':
    case 'slug':
    case 'dynamic':
    case 'markdown':
      throw new Error(
        `[FormComponentFromFieldDefinition] Unsupported fieldType "${fieldDefinition.fieldType}"`
      );
  }
}

// Field types FormComponentFromFieldDefinition can render. Keep in sync with the
// switch above. FormFieldFromDefinition uses this to show a placeholder instead of
// crashing when a Collection contains a not-yet-supported type (which can arrive via
// Core, the API, or a migration). See contributing/not-yet-implemented.md.
const renderableFieldTypes: ReadonlySet<FieldType> = new Set([
  'text',
  'textarea',
  'number',
  'range',
  'toggle',
  'asset',
  'entry',
  'date',
  'datetime',
  'time',
  'email',
  'url',
  'telephone',
  'ipv4',
]);

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
        language !== currentLanguage &&
        (fieldErrors as Record<string, unknown>)[language] !== undefined
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
            {renderableFieldTypes.has(fieldDefinition.fieldType) ? (
              <FormControl>
                <FormComponentFromFieldDefinitionTranslatable
                  form={form}
                  field={field}
                  fieldDefinition={fieldDefinition}
                  supportedLanguages={supportedLanguages}
                />
              </FormControl>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                The &quot;{fieldDefinition.fieldType}&quot; field type
                can&apos;t be displayed yet.
              </div>
            )}
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
  FormAssetField,
  FormEntryField,
  FormDateField,
  FormDatetimeField,
  FormFieldFromDefinition,
};

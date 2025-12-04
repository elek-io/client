import { LanguagesIcon } from 'lucide-react';
import {
  type ControllerRenderProps,
  type FieldErrors,
  type FieldValues,
  type Path,
} from 'react-hook-form';

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
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import { Textarea } from '@renderer/components/ui/textarea';
import { cn } from '@renderer/lib/utils';

import type { SupportedLanguage } from '@elek-io/core';

export interface FormTextareaProps<T extends FieldValues>
  extends React.ComponentProps<'textarea'> {
  field: ControllerRenderProps<T>;
}

/**
 * Special variant of the Textarea component
 * that returns null instead of an empty string
 * if the user did not put in a value.
 */
function FormTextarea<T extends FieldValues>({
  field,
  ...props
}: FormTextareaProps<T>): React.ReactElement {
  function transform(value: string): string | null {
    if (value.trim() === '') {
      return null;
    }
    return value;
  }

  return (
    <Textarea
      {...field}
      {...props}
      value={field.value !== null ? field.value : ''} // The value can now also be null but the textarea cannot handle it, so we set a default empty string instead
      onChange={(event) => field.onChange(transform(event.target.value))}
    />
  );
}

export interface TranslatableFormTextareaProps<T extends FieldValues>
  extends FormTextareaProps<T> {
  title: string;
  description: string;
  supportedLanguages: SupportedLanguage[];
  errors: FieldErrors;
}

/**
 * Renders a FormTextarea component with additional button to manage translations
 *
 * @todo TranslatableFormTextarea and TranslatableFormInput are almost identical. Consider refactoring to reduce duplication.
 */
function TranslatableFormTextarea<T extends FieldValues>({
  title,
  description,
  field,
  supportedLanguages,
  className,
  errors,
  ...props
}: TranslatableFormTextareaProps<T>): React.ReactElement {
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
      fieldErrors = fieldErrors[segment];
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
        language !== currentLanguage && fieldErrors[language] !== undefined
    );
  }

  return (
    <>
      {supportedLanguages.length > 1 ? (
        <div className={cn('flex', className)}>
          <FormTextarea field={field} className="rounded-r-none" {...props} />
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
                            <FormTextarea field={field} />
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
        <FormTextarea field={field} />
      )}
    </>
  );
}

export { FormTextarea, TranslatableFormTextarea };

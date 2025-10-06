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
import { Input } from '@renderer/components/ui/input';
import { cn } from '@renderer/lib/utils';

import type { SupportedLanguage } from '@elek-io/core';

export interface FormInputProps<T extends FieldValues>
  extends React.ComponentProps<'input'> {
  field: ControllerRenderProps<T>;
}

/**
 * Special variant of the Input component
 * that transforms the value the user put in
 * e.g. to a number before handing it back to the form field.
 * It also returns null instead of an empty string
 * if the user did not put in a value.
 */
function FormInput<T extends FieldValues>({
  type,
  field,
  ...props
}: FormInputProps<T>): React.ReactElement {
  function transform(value: string): string | number | null {
    if (value.trim() === '') {
      return null;
    }

    switch (type) {
      case 'text':
      case 'email':
        return value;
      case 'number':
        return parseInt(value);
      default:
        throw new Error(`[FormInput] Unsupported input type "${type}"`);
    }
  }

  return (
    <Input
      {...field}
      {...props}
      type={type}
      value={field.value || ''} // The value can now also be null but the input cannot handle it, so we set a default empty string instead
      onChange={(event) => field.onChange(transform(event.target.value))}
    />
  );
}

export interface TranslatableFormInputProps<T extends FieldValues>
  extends FormInputProps<T> {
  title: string;
  description: string;
  supportedLanguages: SupportedLanguage[];
  errors: FieldErrors;
}

/**
 * Renders a FormInput component with additional button to manage translations
 *
 * @todo TranslatableFormInput and TranslatableFormTextarea are almost identical. Consider refactoring to reduce duplication.
 */
function TranslatableFormInput<T extends FieldValues>({
  title,
  description,
  field,
  supportedLanguages,
  className,
  type,
  errors,
  ...props
}: TranslatableFormInputProps<T>): React.ReactElement {
  const currentLanguage = field.name.split('.').pop() as SupportedLanguage;
  const baseName = field.name.split('.').slice(0, -1).join('.');

  /**
   * Returns true if there are errors in the translations for the current field
   * other than the current language.
   */
  function hasErrorsInTranslations(): boolean {
    // Traverse the errors object to reach the base field errors
    let fieldErrors: any = errors;
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
          <FormInput
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
                          <FormLabel isRequired={true}>{language}</FormLabel>
                          <FormControl>
                            <FormInput field={field} type={type} />
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
        <FormInput field={field} type={type} />
      )}
    </>
  );
}

export { FormInput, TranslatableFormInput };

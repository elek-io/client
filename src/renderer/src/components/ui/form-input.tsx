import type { SupportedLanguage } from '@elek-io/core';
import { cn } from '@renderer/util';
import { LanguagesIcon } from 'lucide-react';
import {
  type ControllerRenderProps,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { Button } from './button';
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
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './form';
import { Input } from './input';

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
}

function TranslatableFormInput<T extends FieldValues>({
  title,
  description,
  field,
  supportedLanguages,
  className,
  type,
  ...props
}: TranslatableFormInputProps<T>): React.ReactElement {
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
              <Button variant="secondary" className="rounded-l-none border-l-0">
                <LanguagesIcon className="w-4 h-4" />
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

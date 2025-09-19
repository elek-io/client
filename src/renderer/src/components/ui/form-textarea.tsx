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
import { Textarea } from './textarea';

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
      value={field.value || ''} // The value can now also be null but the textarea cannot handle it, so we set a default empty string instead
      onChange={(event) => field.onChange(transform(event.target.value))}
    />
  );
}

export interface TranslatableFormTextareaProps<T extends FieldValues>
  extends FormTextareaProps<T> {
  title: string;
  description: string;
  supportedLanguages: SupportedLanguage[];
}

function TranslatableFormTextarea<T extends FieldValues>({
  title,
  description,
  field,
  supportedLanguages,
  className,
  ...props
}: TranslatableFormTextareaProps<T>): React.ReactElement {
  return (
    <>
      {supportedLanguages.length > 1 ? (
        <div className={cn('flex', className)}>
          <FormTextarea field={field} className="rounded-r-none" {...props} />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="h-full rounded-l-none border-l-0"
              >
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

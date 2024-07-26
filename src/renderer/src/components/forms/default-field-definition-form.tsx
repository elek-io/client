import { FieldType, SupportedLanguage } from '@elek-io/core';
import * as React from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
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
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';

export interface DefaultFieldDefinitionFormProps<T extends FieldValues>
  extends React.HTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<T>;
  supportedLanguages: SupportedLanguage[];
  currentLanguage: SupportedLanguage;
  fieldType: FieldType;
}

const DefaultFieldDefinitionForm = React.forwardRef<
  HTMLFormElement,
  DefaultFieldDefinitionFormProps<any>
>(({ form, currentLanguage, supportedLanguages, children, fieldType }) => {
  return (
    <>
      <FormField
        control={form.control}
        name={`label.${currentLanguage}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={true}>Label</FormLabel>
            <FormControl>
              <Dialog>
                <DialogTrigger asChild>
                  <FormInput field={field} type="text" />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Label</DialogTitle>
                    <DialogDescription>
                      The label is displayed above the input Field and should
                      indicate what the user is supposed to enter. For example
                      "Title", "Date of birth" or "Summary".
                    </DialogDescription>
                  </DialogHeader>

                  {supportedLanguages.map((language) => {
                    return (
                      <FormField
                        control={form.control}
                        name={`label.${language}`}
                        render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-5">
                            <FormLabel isRequired={true}>{language}</FormLabel>
                            <FormControl>
                              <FormInput field={field} type="text" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Done
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </FormControl>
            <FormDescription>
              The label is displayed above the input Field and should indicate
              what the user is supposed to enter. For example "Title", "Date of
              birth" or "Summary".
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`description.${currentLanguage}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={true}>Description</FormLabel>
            <FormControl>
              <Dialog>
                <DialogTrigger asChild>
                  <FormTextarea field={field} />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Label</DialogTitle>
                    <DialogDescription>
                      The label is displayed above the input Field and should
                      indicate what the user is supposed to enter. For example
                      "Title", "Date of birth" or "Summary".
                    </DialogDescription>
                  </DialogHeader>

                  {supportedLanguages.map((language) => {
                    return (
                      <FormField
                        control={form.control}
                        name={`description.${language}`}
                        render={({ field }) => (
                          <FormItem className="col-span-12 sm:col-span-5">
                            <FormLabel isRequired={true}>{language}</FormLabel>
                            <FormControl>
                              <FormTextarea field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Done
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </FormControl>
            <FormDescription>
              Describe what to input into this field. This text will be
              displayed under the field to guide users.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {children}

      <FormField
        control={form.control}
        name={`isRequired`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
            <div className="mr-4">
              <FormLabel isRequired={true}>Required</FormLabel>
              <FormDescription>
                Required fields need to be filled before an Item of the
                Collection can be created or updated.{' '}
                {fieldType === 'toggle' && (
                  <>
                    <Separator className="my-2" />
                    <i>
                      Toggles are always required, since they can only be
                      checked or unchecked.
                    </i>
                  </>
                )}
              </FormDescription>
              <FormMessage />
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={fieldType === 'toggle'}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`isUnique`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
            <div className="mr-4">
              <FormLabel isRequired={true}>Unique</FormLabel>
              <FormDescription>
                You won't be able to create an Entry if there is an existing
                Entry with identical content.
                {fieldType === 'toggle' && (
                  <>
                    <Separator className="my-2" />
                    <i>
                      Toggles cannot be unique, since they can only be checked
                      or unchecked.
                    </i>
                  </>
                )}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={fieldType === 'toggle'}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`isDisabled`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
            <div className="mr-4">
              <FormLabel isRequired={true}>Disabled</FormLabel>
              <FormDescription>
                You won't be able to change the Value if this is active.
              </FormDescription>
              <FormMessage />
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
});
DefaultFieldDefinitionForm.displayName = 'DefaultFieldDefinitionForm';

export { DefaultFieldDefinitionForm };

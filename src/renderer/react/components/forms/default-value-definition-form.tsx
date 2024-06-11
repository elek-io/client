import { SupportedLanguage } from '@elek-io/shared';
import { Button } from '@elek-io/ui';
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
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
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

export interface DefaultValueDefinitionFormProps<T>
  extends React.HTMLAttributes<HTMLFormElement> {
  state: UseFormReturn<T>;
  supportedLanguages: SupportedLanguage[];
  currentLanguage: SupportedLanguage;
}

const DefaultValueDefinitionForm = React.forwardRef<
  HTMLFormElement,
  DefaultValueDefinitionFormProps<any>
>(
  (
    { className, state, currentLanguage, supportedLanguages, ...props },
    ref
  ) => {
    return (
      <>
        <FormField
          control={state.control}
          name={`label.${currentLanguage}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel isRequired={true}>Label</FormLabel>
              <FormControl>
                <Dialog>
                  <DialogTrigger asChild>
                    <Input {...field} />
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
                          control={state.control}
                          name={`label.${language}`}
                          render={({ field }) => (
                            <FormItem className="col-span-12 sm:col-span-5">
                              <FormLabel isRequired={true}>
                                {language}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                what the user is supposed to enter. For example "Title", "Date
                of birth" or "Summary".
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={state.control}
          name={`description.${currentLanguage}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel isRequired={true}>Description</FormLabel>
              <FormControl>
                <Dialog>
                  <DialogTrigger asChild>
                    <Textarea {...field} />
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
                          control={state.control}
                          name={`description.${language}`}
                          render={({ field }) => (
                            <FormItem className="col-span-12 sm:col-span-5">
                              <FormLabel isRequired={true}>
                                {language}
                              </FormLabel>
                              <FormControl>
                                <Textarea {...field} />
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

        {props.children}

        <FormField
          control={state.control}
          name={`isRequired`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
              <div>
                <FormLabel isRequired={true}>Required</FormLabel>
                <FormDescription>
                  Required fields need to be filled before an Item of the
                  Collection can be created or updated.
                </FormDescription>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={state.control}
          name={`isDisabled`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
              <div>
                <FormLabel isRequired={true}>Disabled</FormLabel>
                <FormDescription>
                  You won't be able to change the Value if this is active.
                </FormDescription>
                <FormMessage />
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </>
    );
  }
);
DefaultValueDefinitionForm.displayName = 'DefaultValueDefinitionForm';

export { DefaultValueDefinitionForm };

import { Cross2Icon } from '@radix-ui/react-icons';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import { Page, type PageProps } from '@renderer/components/page';
import { PageSection } from '@renderer/components/page-section';
import { Button } from '@renderer/components/ui/button';
import { Chip } from '@renderer/components/ui/chip';
import {
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
  Command,
} from '@renderer/components/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';
import { Input } from '@renderer/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@renderer/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import { Skeleton } from '@renderer/components/ui/skeleton';
import { Textarea } from '@renderer/components/ui/textarea';

import {
  supportedLanguageSchema,
  type CreateProjectProps,
  type SupportedLanguage,
  type UpdateProjectProps,
} from '@elek-io/core';

interface CreateUpdateProjectPageProps<TFieldValues extends FieldValues>
  extends PageProps {
  projectForm: UseFormReturn<TFieldValues>;
  isLoading: boolean;
  onFormSubmit: SubmitHandler<TFieldValues>;
}

export function CreateUpdateProjectPage({
  projectForm,
  isLoading,
  onFormSubmit,
  children,
  ...props
}: CreateUpdateProjectPageProps<
  CreateProjectProps | UpdateProjectProps
>): React.JSX.Element {
  const [
    isDeleteDefaultLanguageDialogOpen,
    setIsDeleteDefaultLanguageDialogOpen,
  ] = useState(false);
  const supportedLanguages = supportedLanguageSchema.options.map((option) => {
    return {
      value: option,
      label: option,
    };
  });

  return (
    <Page {...props}>
      <Form {...projectForm}>
        <form onSubmit={projectForm.handleSubmit(onFormSubmit)}>
          <fieldset disabled={isLoading}>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-12 gap-6">
                <FormField
                  control={projectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel isRequired>Project name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={projectForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel isRequired>Project description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <PageSection
              title="Language"
              description="Settings related to the languages used in this Project"
            >
              <div className="grid grid-cols-12 gap-6">
                <FormField
                  control={projectForm.control}
                  name="settings.language.supported"
                  render={({ field }) => (
                    <FormItem className="col-span-6">
                      <FormLabel isRequired>Supported</FormLabel>
                      <FormControl>
                        <div>
                          <ul className="flex flex-wrap">
                            {field.value.map((language, index) => {
                              return (
                                <li key={language} className="mr-2 mb-2">
                                  <Chip className="py-0 pr-0">
                                    {language}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="ml-4 rounded-full"
                                      onClick={() => {
                                        if (
                                          language ===
                                          projectForm.watch(
                                            'settings.language.default'
                                          )
                                        ) {
                                          setIsDeleteDefaultLanguageDialogOpen(
                                            true
                                          );
                                        } else {
                                          field.value.splice(index, 1);
                                          projectForm.setValue(
                                            'settings.language.supported',
                                            [
                                              ...projectForm
                                                .watch(
                                                  'settings.language.supported'
                                                )
                                                .filter(
                                                  (value) => value !== language
                                                ),
                                            ],
                                            {
                                              shouldValidate: true,
                                              shouldDirty: true,
                                            }
                                          );
                                        }
                                      }}
                                    >
                                      <Cross2Icon className="h-4 w-4" />
                                    </Button>
                                  </Chip>
                                </li>
                              );
                            })}
                          </ul>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button role="combobox">
                                <Plus className="mr-2 h-4 w-4" />
                                Add language
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                              <Command>
                                <CommandInput placeholder="Search language..." />
                                <CommandEmpty>No framework found.</CommandEmpty>
                                <CommandGroup>
                                  <CommandList>
                                    {supportedLanguages
                                      .filter(
                                        (language) =>
                                          projectForm
                                            .watch(
                                              'settings.language.supported'
                                            )
                                            .includes(language.value) === false
                                      )
                                      .map((language) => (
                                        <CommandItem
                                          key={language.value}
                                          value={language.value}
                                          onSelect={(
                                            currentValue: SupportedLanguage
                                          ) => {
                                            projectForm.setValue(
                                              'settings.language.supported',
                                              [
                                                ...projectForm.watch(
                                                  'settings.language.supported'
                                                ),
                                                currentValue,
                                              ],
                                              {
                                                shouldValidate: true,
                                                shouldDirty: true,
                                              }
                                            );
                                          }}
                                        >
                                          {language.label}
                                        </CommandItem>
                                      ))}
                                  </CommandList>
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Select which languages this Projects content has to be
                        translated into
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  // Setting the key to force React to completely unmount and remount the entire field whenever the supported languages array changes
                  // Radix UI Select seems to clear its internal state when its options change
                  key={projectForm
                    .watch('settings.language.supported')
                    .join(',')}
                  control={projectForm.control}
                  name="settings.language.default"
                  render={({ field }) => {
                    const supported = projectForm.watch(
                      'settings.language.supported'
                    );
                    const availableOptions = supportedLanguages.filter(
                      (language) => supported.includes(language.value)
                    );

                    return (
                      <FormItem className="col-span-6">
                        <FormLabel isRequired>Default</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableOptions.map((option) => {
                              return (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The default language of this Project. Needs to be one
                          of the supported languages.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <Dialog
                open={isDeleteDefaultLanguageDialogOpen}
                onOpenChange={setIsDeleteDefaultLanguageDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deleting the default language</DialogTitle>
                    <DialogDescription>
                      The default language can&apos;t be deleted. Please select
                      another language as the default and then delete this
                      language.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Ok
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </PageSection>
          </fieldset>
        </form>
      </Form>
      {children}
    </Page>
  );
}

export function CreateUpdateProjectPageSkeleton(
  props: PageProps
): React.JSX.Element {
  return (
    <Page {...props}>
      <div className="grid grid-cols-12 gap-x-4 gap-y-8 p-6 sm:gap-x-6 xl:gap-x-8">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Page>
  );
}

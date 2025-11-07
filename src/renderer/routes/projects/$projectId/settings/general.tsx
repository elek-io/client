import { zodResolver } from '@hookform/resolvers/zod';
import { Cross2Icon } from '@radix-ui/react-icons';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Plus, Trash } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@renderer/components/ui/button';
import { Chip } from '@renderer/components/ui/chip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@renderer/components/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Page } from '@renderer/components/ui/page';
import { PageSection } from '@renderer/components/ui/page-section';
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
import { Textarea } from '@renderer/components/ui/textarea';
import { useStore } from '@renderer/store';

import {
  type DeleteProjectProps,
  type SupportedLanguage,
  type UpdateProjectProps,
  supportedLanguageSchema,
  updateProjectSchema,
} from '@elek-io/core';

export const Route = createFileRoute('/projects/$projectId/settings/general')({
  component: ProjectSettingsGeneralPage,
});

function ProjectSettingsGeneralPage(): ReactElement {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [
    isDeleteDefaultLanguageDialogOpen,
    setIsDeleteDefaultLanguageDialogOpen,
  ] = useState(false);
  const projectForm = useForm<UpdateProjectProps>({
    resolver: async (data, context, options) => {
      return zodResolver(updateProjectSchema)(data, context, options);
    },
    defaultValues: context.project,
  });
  const supportedLanguages = supportedLanguageSchema.options.map((option) => {
    return {
      value: option,
      label: option,
    };
  });

  function Description(): ReactElement {
    return <>Here you will be able to tweak this project to your liking</>;
  }

  /**
   * @todo Save Button should be in state "disabled" until there is a difference between props.currentProject and formData.
   * Otherwise git is throwing an error without a message (probably because there is no change that can be committed)
   */
  function Actions(): ReactElement {
    return (
      <>
        <Button
          Icon={Check}
          onClick={projectForm.handleSubmit(onUpdate)}
          isLoading={isUpdatingProject}
          disabled={projectForm.formState.isDirty === false}
        >
          Save changes
        </Button>
      </>
    );
  }

  const onUpdate: SubmitHandler<UpdateProjectProps> = async (project) => {
    try {
      setIsUpdatingProject(true);
      await context.core.projects.update(project);
      setIsUpdatingProject(false);
      addNotification({
        intent: 'success',
        title: 'Successfully updated Project',
        description: 'The Project was successfully updated.',
      });
      await router.invalidate();
    } catch (error) {
      setIsUpdatingProject(false);
      await context.core.logger.error({
        source: 'desktop',
        message: 'Failed to update Project',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to update Project',
        description: 'There was an error updating the Project on disk.',
      });
    }
  };

  const onDelete: SubmitHandler<DeleteProjectProps> = async (project) => {
    try {
      await context.core.projects.delete({ id: project.id });
      addNotification({
        intent: 'success',
        title: 'Successfully deleted Project',
        description: 'The Project was successfully deleted.',
      });
      await router.navigate({ to: '/projects' });
    } catch (error) {
      await context.core.logger.error({
        source: 'desktop',
        message: 'Failed to delete Project',
        meta: { error },
      });
      addNotification({
        intent: 'danger',
        title: 'Failed to delete Project',
        description: 'There was an error deleting the Project from disk.',
      });
    }
  };

  return (
    <Page
      title="General Settings"
      description={<Description />}
      actions={<Actions />}
    >
      <Form {...projectForm}>
        <form>
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
            {/* {JSON.stringify(projectForm.watch('settings.language'))} */}
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={projectForm.control}
                name="settings.language.supported"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel isRequired>Supported</FormLabel>
                    <FormControl>
                      <>
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
                                        projectForm.getValues(
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
                                              .getValues(
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
                                          .getValues(
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
                                              ...projectForm.getValues(
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
                      </>
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
                control={projectForm.control}
                name="settings.language.default"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel isRequired>Default</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedLanguages
                            .filter(
                              (language) =>
                                projectForm
                                  .getValues('settings.language.supported')
                                  .includes(language.value) === true
                            )
                            .map((option) => {
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
                    </FormControl>
                    <FormDescription>
                      The default language of this Project. Needs to be one of
                      the supported languages.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
        </form>
      </Form>
      <PageSection
        title="Delete this Project from this device"
        description="The action does not delete this Project from other devices - just
              from the device you are currently using. But if this is the only
              device your Project is stored at, you will remove it permanently -
              there is no going back. Please be certain."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button Icon={Trash} variant="destructive">
                Delete Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone if your Project is not replicated
                  somewhere else than this device.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    No, I&apos;ve changed my mind
                  </Button>
                </DialogClose>
                <Button
                  Icon={Trash}
                  variant="destructive"
                  onClick={projectForm.handleSubmit(onDelete)}
                >
                  Yes, delete this Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
    </Page>
  );
}

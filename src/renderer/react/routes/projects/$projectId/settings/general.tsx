import { Button } from '@/renderer/react/components/ui/button';
import { Chip } from '@/renderer/react/components/ui/chip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/react/components/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/renderer/react/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/renderer/react/components/ui/form';
import { Input } from '@/renderer/react/components/ui/input';
import { Page } from '@/renderer/react/components/ui/page';
import { PageSection } from '@/renderer/react/components/ui/page-section';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/react/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/react/components/ui/select';
import { Textarea } from '@/renderer/react/components/ui/textarea';
import {
  DeleteProjectProps,
  SupportedLanguage,
  UpdateProjectProps,
  supportedLanguageSchema,
  updateProjectSchema,
} from '@elek-io/shared';
import { NotificationIntent } from '@elek-io/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Cross2Icon } from '@radix-ui/react-icons';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Check, Plus, Trash } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

export const Route = createFileRoute('/projects/$projectId/settings/general')({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [
    isDeleteDefaultLanguageDialogOpen,
    setIsDeleteDefaultLanguageDialogOpen,
  ] = useState(false);
  const projectForm = useForm<UpdateProjectProps>({
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      console.log(
        'ProjectForm validation result',
        await zodResolver(updateProjectSchema)(data, context, options)
      );
      return zodResolver(updateProjectSchema)(data, context, options);
    },
    defaultValues: context.currentProject,
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
          onClick={projectForm.handleSubmit(onUpdate)}
          isLoading={isUpdatingProject}
          disabled={projectForm.formState.isDirty === false}
        >
          <Check className="w-4 h-4 mr-2"></Check>
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
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully updated Project',
        description: 'The Project was successfully updated.',
      });
      router.invalidate();
    } catch (error) {
      setIsUpdatingProject(false);
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to update Project',
        description: 'There was an error updating the Project on disk.',
      });
    }
  };

  const onDelete: SubmitHandler<DeleteProjectProps> = async (project) => {
    try {
      await context.core.projects.delete({ id: project.id });
      addNotification({
        intent: NotificationIntent.SUCCESS,
        title: 'Successfully deleted Project',
        description: 'The Project was successfully deleted.',
      });
      router.navigate({ to: '/projects' });
    } catch (error) {
      console.error(error);
      addNotification({
        intent: NotificationIntent.DANGER,
        title: 'Failed to delete Project',
        description: 'There was an error deleting the Project from disk.',
      });
    }
  };

  return (
    <Page
      title={`General Settings`}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <Form {...projectForm}>
        <form>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-12 gap-6">
              <FormField
                control={projectForm.control}
                name={'name'}
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel isRequired={true}>Project name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={projectForm.control}
                name={'description'}
                render={({ field }) => (
                  <FormItem className="col-span-12">
                    <FormLabel isRequired={false}>
                      Project description
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription></FormDescription>
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
                name={'settings.language.supported'}
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel isRequired={true}>Supported</FormLabel>
                    <FormControl>
                      <>
                        <ul className="flex flex-wrap">
                          {field.value.map((language, index) => {
                            return (
                              <li key={language} className="mr-2 mb-2">
                                <Chip>
                                  {language}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-4 rounded-full"
                                    onClick={(event) => {
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
                              <Plus className="w-4 h-4 mr-2"></Plus>
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
                name={'settings.language.default'}
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel isRequired={true}>Default</FormLabel>
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
                    The default language can't be deleted. Please select another
                    language as the default and then delete this language.
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

          <PageSection title="Danger Zone">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium leading-6">
                  Delete this Project from your current device
                </p>
                <p className="text-sm text-gray-500">
                  The action does not delete this Project from other devices -
                  just from the device you are currently using. But if this is
                  the only device your Project is stored at, you will remove it
                  permanently - there is no going back. Please be certain.
                </p>
              </div>
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash className="w-4 h-4 mr-2"></Trash>
                      Delete Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone if your Project is not
                        replicated somewhere else than this device.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          No, I've changed my mind
                        </Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={projectForm.handleSubmit(onDelete)}
                      >
                        <Trash className="w-4 h-4 mr-2"></Trash>
                        Yes, delete this Project
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </PageSection>
        </form>
      </Form>
    </Page>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useProject } from '@root/src/renderer/hooks/useProject';
import { useMutation } from '@tanstack/react-query';
import {
  DownloadIcon,
  Edit2Icon,
  ExpandIcon,
  ImageIcon,
  TrashIcon,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { AssetDisplay } from '@renderer/components/asset-display';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@renderer/components/ui/alert-dialog';
import { Button } from '@renderer/components/ui/button';
import { ButtonGroup } from '@renderer/components/ui/button-group';
import {
  Dialog,
  DialogBody,
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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from '@renderer/components/ui/item';
import { Separator } from '@renderer/components/ui/separator';
import { Skeleton } from '@renderer/components/ui/skeleton';
import { Textarea } from '@renderer/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { formatBytes } from '@renderer/lib/utils';
import { queryOptions } from '@renderer/queries';

import {
  updateAssetSchema,
  type Asset,
  type UpdateAssetProps,
} from '@elek-io/core';

export function AssetTeaser(
  props: Asset & { projectId: string }
): React.JSX.Element {
  const { formatDatetime } = useProject();
  const { mutateAsync: saveAsset } = useMutation(queryOptions.assets.save);
  const { mutateAsync: updateAsset } = useMutation(queryOptions.assets.update);
  const [isUpdateAssetDialogOpen, setIsUpdateAssetDialogOpen] =
    useState<boolean>(false);
  const { mutateAsync: deleteAsset } = useMutation(queryOptions.assets.delete);
  const updateAssetForm = useForm<UpdateAssetProps>({
    resolver: async (data, context, options) => {
      return zodResolver(updateAssetSchema)(data, context, options);
    },
    defaultValues: {
      id: props.id,
      name: props.name,
      description: props.description,
      projectId: props.projectId,
      newFilePath: undefined,
    },
  });
  const createdTime = formatDatetime({ datetime: props.created });
  const updatedTime = formatDatetime({ datetime: props.updated });
  const information = [
    {
      key: 'Size',
      value: formatBytes(props.size),
    },
    {
      key: 'Type',
      value: props.extension.toUpperCase(),
      tooltip: props.mimeType,
    },
    {
      key: 'Created',
      value: createdTime.relative,
      tooltip: createdTime.absolute,
    },
    {
      key: 'Updated',
      value: updatedTime.relative,
      tooltip: updatedTime.absolute,
    },
  ];

  async function onAssetSave(): Promise<void> {
    const result = await window.ipc.electron.dialog.showSaveDialog({
      title: `Save Asset ${props.name}.${props.extension} to disk`,
      buttonLabel: 'Save Asset',
      defaultPath: `${props.name}.${props.extension}`,
      // properties: ['createDirectory', 'showOverwriteConfirmation'],
      // filters: [
      //   {
      //     name: 'Supported files',
      //     extensions: [...supportedAssetExtensionSchema.options],
      //   },
      // ],
    });

    if (result.canceled === true) {
      return;
    }

    await saveAsset({
      projectId: props.projectId,
      id: props.id,
      filePath: result.filePath,
    });
  }

  const onAssetUpdate: SubmitHandler<UpdateAssetProps> = async (
    asset
  ): Promise<void> => {
    await updateAsset(asset);
    setIsUpdateAssetDialogOpen(false);
  };

  return (
    <Item variant="outline">
      <ItemHeader>
        <AssetDisplay {...props} static className="rounded-t-md" />
      </ItemHeader>
      <ItemContent>
        <ItemTitle className="line-clamp-1">{props.name}</ItemTitle>

        <ItemDescription>
          <span className="line-clamp-1">{props.description || '-'}</span>
        </ItemDescription>

        {information.map((info, index, array) => {
          return (
            <Fragment key={info.key}>
              <div className="flex justify-between">
                <div className="">{info.key}</div>
                <div className="whitespace-nowrap">
                  {info.tooltip !== undefined && info.tooltip !== '-' ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{info.value}</TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          <p>{info.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    info.value
                  )}
                </div>
              </div>
              {array.length !== index + 1 ? <Separator /> : null}
            </Fragment>
          );
        })}
      </ItemContent>
      <ItemFooter>
        <ButtonGroup className="w-full">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="flex-1"
                Icon={ExpandIcon}
              >
                <span className="sr-only">View</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>{props.name}</DialogTitle>
                <DialogDescription>{props.description}</DialogDescription>
              </DialogHeader>

              <DialogBody>
                <AssetDisplay {...props} />
              </DialogBody>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isUpdateAssetDialogOpen}
            onOpenChange={setIsUpdateAssetDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="flex-1"
                Icon={Edit2Icon}
              >
                <span className="sr-only">Update</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{props.name}</DialogTitle>
                <DialogDescription>{props.description}</DialogDescription>
              </DialogHeader>

              <DialogBody>
                <Item className="flex-col">
                  <div className="m-auto aspect-4/3 size-48">
                    <AssetDisplay {...props} static />
                  </div>
                  <ItemContent className="w-full p-0">
                    <Form {...updateAssetForm}>
                      <form
                        onSubmit={updateAssetForm.handleSubmit(onAssetUpdate)}
                      >
                        <div className="grid grid-cols-12 gap-6">
                          <FormField
                            control={updateAssetForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="col-span-12">
                                <FormLabel isRequired>Asset name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={updateAssetForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem className="col-span-12">
                                <FormLabel isRequired>
                                  Asset description
                                </FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormDescription />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </form>
                    </Form>
                  </ItemContent>
                </Item>
              </DialogBody>

              <DialogFooter>
                <Button
                  variant="outline"
                  Icon={Edit2Icon}
                  onClick={updateAssetForm.handleSubmit(onAssetUpdate)}
                  disabled={updateAssetForm.formState.isDirty === false}
                >
                  Update
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="icon-sm"
            className="flex-1"
            Icon={DownloadIcon}
            onClick={onAssetSave}
          >
            <span className="sr-only">Save as</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon-sm"
                className="flex-1"
                Icon={TrashIcon}
              >
                <span className="sr-only">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  You are about to delete this Asset
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action can be undone later by restoring the Asset via
                  it&apos;s history.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AssetDisplay {...props} static />

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="destructive"
                    Icon={TrashIcon}
                    onClick={async () => deleteAsset({ ...props })}
                  >
                    Delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ButtonGroup>
      </ItemFooter>
    </Item>
  );
}

export function AssetTeaserSkeleton(): React.JSX.Element {
  return (
    <Item variant="outline">
      <ItemHeader className="aspect-4/3">
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </ItemHeader>
      <ItemContent>
        <ItemTitle>
          <Skeleton className="h-4 w-3/4" />
        </ItemTitle>
        <ItemDescription>
          <Skeleton className="h-3 w-1/2" />
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

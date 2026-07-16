import {
  type FieldPath,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
  FormTextareaField,
} from '@renderer/components/ui/form';

interface AssetFormProps<TFieldValues extends FieldValues> {
  assetForm: UseFormReturn<TFieldValues>;
  onFormSubmit: SubmitHandler<TFieldValues>;
  /**
   * Associates the form with a submit button rendered outside it (in the
   * dialog's `DialogFooter`). The footer button carries `type="submit"` and the
   * same `form={id}`, so it submits this form natively from outside its subtree.
   */
  id?: string;
}

/**
 * Shared form body collecting an Asset's `name` and `description`.
 *
 * Renders only the fields inside a form, so the surrounding dialog owns the
 * scroll structure. Place it inside a `DialogBody` and put the submit control in
 * a sibling `DialogFooter` that calls `assetForm.handleSubmit`, so the body
 * scrolls while the footer stays pinned and on screen (see the create dialog in
 * `assets/index.tsx` and the update dialog in `asset-teaser.tsx`).
 *
 * Kept generic over the form values so it works for both the create
 * (`CreateAssetProps`) and update (`UpdateAssetProps`) flows, whose shapes
 * diverge (`filePath` vs `id`/`newFilePath`) and therefore can't be expressed
 * as a single non-invariant union prop. Both shapes share `name` and
 * `description`, so the field names are asserted as paths of `TFieldValues`.
 */
export function AssetForm<TFieldValues extends FieldValues>({
  assetForm,
  onFormSubmit,
  id,
}: AssetFormProps<TFieldValues>): React.JSX.Element {
  return (
    <Form {...assetForm}>
      {/* noValidate: zod (through RHF) owns validation. Without it the browser's
      native constraint check on required inputs blocks submit before
      handleSubmit runs. */}
      <form id={id} noValidate onSubmit={assetForm.handleSubmit(onFormSubmit)}>
        <div className="grid grid-cols-12 gap-6">
          <FormField
            control={assetForm.control}
            name={'name' as FieldPath<TFieldValues>}
            render={({ field }) => (
              <FormItem className="col-span-12">
                <FormLabel isRequired>Asset name</FormLabel>
                <FormControl>
                  <FormInputField field={field} type="text" />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={assetForm.control}
            name={'description' as FieldPath<TFieldValues>}
            render={({ field }) => (
              <FormItem className="col-span-12">
                <FormLabel isRequired>Asset description</FormLabel>
                <FormControl>
                  <FormTextareaField field={field} />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}

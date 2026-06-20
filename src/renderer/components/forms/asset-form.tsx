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
  children?: React.ReactNode;
  onFormSubmit: SubmitHandler<TFieldValues>;
}

/**
 * Shared form body collecting an Asset's `name` and `description`.
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
  children,
}: AssetFormProps<TFieldValues>): React.JSX.Element {
  return (
    <Form {...assetForm}>
      <form onSubmit={assetForm.handleSubmit(onFormSubmit)}>
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
        {children}
      </form>
    </Form>
  );
}

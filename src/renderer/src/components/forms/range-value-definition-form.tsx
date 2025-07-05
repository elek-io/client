import { type RangeFieldDefinition } from '@elek-io/core';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { FormInput } from '../ui/form-input';
import {
  DefaultFieldDefinitionForm,
  type DefaultFieldDefinitionFormProps,
} from './default-field-definition-form';

export type RangeFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<RangeFieldDefinition>;

const RangeFieldDefinitionForm = ({
  form,
  ...props
}: RangeFieldDefinitionFormProps): JSX.Element => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired={true}>Default value</FormLabel>
                <FormControl>
                  <FormInput field={field} type="number" />
                </FormControl>
                <FormDescription>
                  The initial value for the field.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-row items-center justify-between space-x-2">
            <FormField
              control={form.control}
              name={`min`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={true}>Minimum</FormLabel>
                  <FormControl>
                    <FormInput field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The minimum Value the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`max`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel isRequired={true}>Maximum</FormLabel>
                  <FormControl>
                    <FormInput field={field} type="number" />
                  </FormControl>
                  <FormDescription>
                    The maximum Value the user is able to enter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};
RangeFieldDefinitionForm.displayName = 'RangeFieldDefinitionForm';

export { RangeFieldDefinitionForm };

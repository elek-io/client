import { type NumberFieldDefinition } from '@elek-io/core';
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

export type NumberFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<NumberFieldDefinition>;

const NumberFieldDefinitionForm = ({
  form,
  ...props
}: NumberFieldDefinitionFormProps): JSX.Element => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        {JSON.stringify(form.watch())}
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem>
                <FormLabel isRequired={false}>Default value</FormLabel>
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
                  <FormLabel isRequired={false}>Minimum</FormLabel>
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
                  <FormLabel isRequired={false}>Maximum</FormLabel>
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
NumberFieldDefinitionForm.displayName = 'NumberFieldDefinitionForm';

export { NumberFieldDefinitionForm };

import { ToggleFieldDefinition } from '@elek-io/core';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Switch } from '../ui/switch';
import {
  DefaultFieldDefinitionForm,
  DefaultFieldDefinitionFormProps,
} from './default-field-definition-form';

export type ToggleFieldDefinitionFormProps =
  DefaultFieldDefinitionFormProps<ToggleFieldDefinition>;

const ToggleFieldDefinitionForm = ({
  form,
  ...props
}: ToggleFieldDefinitionFormProps): JSX.Element => {
  return (
    <Form {...form}>
      <form className="space-y-6">
        <DefaultFieldDefinitionForm form={form} {...props}>
          <FormField
            control={form.control}
            name={`defaultValue`}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                <div>
                  <FormLabel isRequired={true}>Default value</FormLabel>
                  <FormDescription>
                    The initial value for the field.
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
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};
ToggleFieldDefinitionForm.displayName = 'ToggleFieldDefinitionForm';

export { ToggleFieldDefinitionForm };

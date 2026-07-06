import { Plus, TrashIcon } from 'lucide-react';
import { useEffect, type ReactElement } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';

import { DefaultFieldDefinitionForm } from '@renderer/components/forms/default-field-definition-form';
import { Button } from '@renderer/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
  TranslatableFormInputField,
} from '@renderer/components/ui/form';
import { Input } from '@renderer/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import { translatableDefault } from '@renderer/lib/utils';

import {
  slug,
  type NumberSelectFieldDefinition,
  type StringSelectFieldDefinition,
  type SupportedLanguage,
} from '@elek-io/core';

// Core's 'select' fieldType is backed by two schemas, chosen by the type of
// value its options hold.
export type SelectValueType = 'string' | 'number';

export interface SelectFieldDefinitionFormProps {
  stringForm: UseFormReturn<StringSelectFieldDefinition>;
  numberForm: UseFormReturn<NumberSelectFieldDefinition>;
  valueType: SelectValueType;
  onValueTypeChange: (valueType: SelectValueType) => void;
  supportedLanguages: SupportedLanguage[];
  currentLanguage: SupportedLanguage;
}

/**
 * Definition form for select fields. Renders a chooser for the type of option
 * values and mounts the matching variant's form. Each variant keeps its own
 * draft, so switching back and forth does not carry entered values over.
 */
export const SelectFieldDefinitionForm = ({
  stringForm,
  numberForm,
  ...props
}: SelectFieldDefinitionFormProps): ReactElement => {
  return props.valueType === 'string' ? (
    <StringSelectFieldDefinitionForm form={stringForm} {...props} />
  ) : (
    <NumberSelectFieldDefinitionForm form={numberForm} {...props} />
  );
};

interface SelectVariantFormProps {
  valueType: SelectValueType;
  onValueTypeChange: (valueType: SelectValueType) => void;
  supportedLanguages: SupportedLanguage[];
  currentLanguage: SupportedLanguage;
}

const ValueTypeSelect = ({
  valueType,
  onValueTypeChange,
}: Pick<
  SelectVariantFormProps,
  'valueType' | 'onValueTypeChange'
>): ReactElement => {
  return (
    <FormItem>
      <FormLabel isRequired>Type of options</FormLabel>
      <Select
        value={valueType}
        onValueChange={(value: SelectValueType) => onValueTypeChange(value)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="string">Text</SelectItem>
          <SelectItem value="number">Number</SelectItem>
        </SelectContent>
      </Select>
      <FormDescription>
        Whether the options of this Field hold text or number values.
      </FormDescription>
    </FormItem>
  );
};

const StringSelectFieldDefinitionForm = ({
  form,
  supportedLanguages,
  currentLanguage,
  valueType,
  onValueTypeChange,
}: SelectVariantFormProps & {
  form: UseFormReturn<StringSelectFieldDefinition>;
}): ReactElement => {
  const options = useFieldArray({ control: form.control, name: 'options' });
  const watchedOptions = useWatch({ control: form.control, name: 'options' });

  const optionDisplay = (
    option: StringSelectFieldDefinition['options'][number],
    index: number
  ): string => {
    const label = option.label[currentLanguage];
    if (label !== undefined && label !== '') {
      return label;
    }
    if (option.value !== '') {
      return option.value;
    }
    return `Option ${String(index + 1)}`;
  };
  const defaultValueItems = watchedOptions.map((option, index) => ({
    itemValue: String(index),
    display: optionDisplay(option, index),
  }));

  return (
    <Form {...form}>
      <form className="space-y-6">
        <ValueTypeSelect
          valueType={valueType}
          onValueTypeChange={onValueTypeChange}
        />
        <DefaultFieldDefinitionForm
          form={form}
          fieldType="stringSelect"
          currentLanguage={currentLanguage}
          supportedLanguages={supportedLanguages}
        >
          <FormField
            control={form.control}
            name="options"
            render={() => (
              <FormItem>
                <FormLabel isRequired>Options</FormLabel>
                <div className="space-y-2">
                  {options.fields.map((option, index) => (
                    <StringSelectOptionRow
                      key={option.id}
                      form={form}
                      index={index}
                      currentLanguage={currentLanguage}
                      supportedLanguages={supportedLanguages}
                      onRemove={
                        options.fields.length > 1
                          ? () => options.remove(index)
                          : undefined
                      }
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  Icon={Plus}
                  onClick={() =>
                    options.append({
                      value: '',
                      label: translatableDefault({
                        supportedLanguages,
                        defaultValue: '',
                      }),
                    })
                  }
                >
                  Add option
                </Button>
                <FormDescription>
                  The options a user can choose between. The label is what users
                  see, the value is what gets stored.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => {
              const selectedIndex =
                field.value === null
                  ? -1
                  : watchedOptions.findIndex(
                      (option) => option.value === field.value
                    );
              return (
                <FormItem>
                  <FormLabel isRequired={false}>Default value</FormLabel>
                  <FormControl>
                    <Select
                      value={
                        selectedIndex === -1 ? 'none' : String(selectedIndex)
                      }
                      onValueChange={(selected) =>
                        field.onChange(
                          watchedOptions[Number(selected)]?.value ?? null
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {defaultValueItems.map((item) => (
                          <SelectItem
                            key={item.itemValue}
                            value={item.itemValue}
                          >
                            {item.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    The initial option for the field.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};

const StringSelectOptionRow = ({
  form,
  index,
  currentLanguage,
  supportedLanguages,
  onRemove,
}: {
  form: UseFormReturn<StringSelectFieldDefinition>;
  index: number;
  currentLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  onRemove: (() => void) | undefined;
}): ReactElement => {
  const labelValue = useWatch({
    control: form.control,
    name: `options.${index}.label.${currentLanguage}`,
  });
  // Auto-generate the value from the label until the value is edited manually
  useEffect(() => {
    if (form.getFieldState(`options.${index}.value`).isDirty === false) {
      form.setValue(`options.${index}.value`, slug(labelValue ?? ''));
    }
  }, [form, labelValue, index]);

  return (
    <div className="flex items-start gap-2">
      <FormField
        control={form.control}
        name={`options.${index}.label.${currentLanguage}`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <TranslatableFormInputField
                title="Label"
                description="The label users see for this option."
                type="text"
                field={field}
                errors={form.formState.errors}
                supportedLanguages={supportedLanguages}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`options.${index}.value`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              {/* Option values are plain strings, not nullable Values, so the
                  null-for-empty transform of FormInputField does not apply */}
              <Input type="text" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="destructive"
        size="icon"
        Icon={TrashIcon}
        disabled={onRemove === undefined}
        onClick={onRemove}
      />
    </div>
  );
};

const NumberSelectFieldDefinitionForm = ({
  form,
  supportedLanguages,
  currentLanguage,
  valueType,
  onValueTypeChange,
}: SelectVariantFormProps & {
  form: UseFormReturn<NumberSelectFieldDefinition>;
}): ReactElement => {
  const options = useFieldArray({ control: form.control, name: 'options' });
  const watchedOptions = useWatch({ control: form.control, name: 'options' });

  const optionDisplay = (
    option: NumberSelectFieldDefinition['options'][number]
  ): string => {
    const label = option.label[currentLanguage];
    if (label !== undefined && label !== '') {
      return label;
    }
    return String(option.value);
  };
  const defaultValueItems = watchedOptions.map((option, index) => ({
    itemValue: String(index),
    display: optionDisplay(option),
  }));

  return (
    <Form {...form}>
      <form className="space-y-6">
        <ValueTypeSelect
          valueType={valueType}
          onValueTypeChange={onValueTypeChange}
        />
        <DefaultFieldDefinitionForm
          form={form}
          fieldType="numberSelect"
          currentLanguage={currentLanguage}
          supportedLanguages={supportedLanguages}
        >
          <FormField
            control={form.control}
            name="options"
            render={() => (
              <FormItem>
                <FormLabel isRequired>Options</FormLabel>
                <div className="space-y-2">
                  {options.fields.map((option, index) => (
                    <div key={option.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`options.${index}.label.${currentLanguage}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <TranslatableFormInputField
                                title="Label"
                                description="The label users see for this option."
                                type="text"
                                field={field}
                                errors={form.formState.errors}
                                supportedLanguages={supportedLanguages}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`options.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <FormInputField type="number" field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        Icon={TrashIcon}
                        disabled={options.fields.length === 1}
                        onClick={() => options.remove(index)}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  Icon={Plus}
                  onClick={() =>
                    options.append({
                      value: 0,
                      label: translatableDefault({
                        supportedLanguages,
                        defaultValue: '',
                      }),
                    })
                  }
                >
                  Add option
                </Button>
                <FormDescription>
                  The options a user can choose between. The label is what users
                  see, the value is what gets stored.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultValue"
            render={({ field }) => {
              const selectedIndex =
                field.value === null
                  ? -1
                  : watchedOptions.findIndex(
                      (option) => option.value === field.value
                    );
              return (
                <FormItem>
                  <FormLabel isRequired={false}>Default value</FormLabel>
                  <FormControl>
                    <Select
                      value={
                        selectedIndex === -1 ? 'none' : String(selectedIndex)
                      }
                      onValueChange={(selected) =>
                        field.onChange(
                          watchedOptions[Number(selected)]?.value ?? null
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {defaultValueItems.map((item) => (
                          <SelectItem
                            key={item.itemValue}
                            value={item.itemValue}
                          >
                            {item.display}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    The initial option for the field.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </DefaultFieldDefinitionForm>
      </form>
    </Form>
  );
};

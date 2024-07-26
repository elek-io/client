import * as React from 'react';

import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { Input } from './input';

export interface FormInputProps<T extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  field: ControllerRenderProps<T>;
  type: Extract<React.HTMLInputTypeAttribute, 'text' | 'number'>;
}

/**
 * Special variant of the Input component
 * that transforms the value the user put in
 * e.g. to a number before handing it back to the form field.
 * It also returns null instead of an empty string
 * if the user did not put in a value.
 */
function FormInput<T extends FieldValues>({
  field,
  ...props
}: FormInputProps<T>) {
  function transform(value: string) {
    if (value.trim() === '') {
      return null;
    }

    switch (props.type) {
      case 'text':
        return value;
      case 'number':
        return parseInt(value);

      default:
        throw new Error(`Unsupporetd input type "${props.type}"`);
    }
  }

  return (
    <Input
      {...props}
      {...field}
      onChange={(event) => field.onChange(transform(event.target.value))}
    />
  );
}

export { FormInput };

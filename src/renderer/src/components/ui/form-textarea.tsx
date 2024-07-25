import * as React from 'react';

import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { Textarea } from './textarea';

export interface FormTextareaProps<T extends FieldValues>
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  field: ControllerRenderProps<T>;
}

/**
 * Special variant of the Textarea component
 * that returns null instead of an empty string
 * if the user did not put in a value.
 */
function FormTextarea<T extends FieldValues>({
  field,
  ...props
}: FormTextareaProps<T>) {
  function transform(value: string) {
    if (value.trim() === '') {
      return null;
    }
    return value;
  }

  return (
    <Textarea
      {...props}
      {...field}
      onChange={(event) => field.onChange(transform(event.target.value))}
    />
  );
}

export { FormTextarea };

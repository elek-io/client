import {
  type ForwardedRef,
  forwardRef,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type ReactElement,
} from 'react';
import { type ControllerRenderProps, type FieldValues } from 'react-hook-form';
import { Input } from './input';

export interface FormInputProps<T extends FieldValues>
  extends InputHTMLAttributes<HTMLInputElement> {
  field: ControllerRenderProps<T>;
  type: Extract<HTMLInputTypeAttribute, 'text' | 'number'>;
}

/**
 * Special variant of the Input component
 * that transforms the value the user put in
 * e.g. to a number before handing it back to the form field.
 * It also returns null instead of an empty string
 * if the user did not put in a value.
 */
function _FormInput<T extends FieldValues>(
  { field, ...props }: FormInputProps<T>,
  ref: ForwardedRef<HTMLInputElement>
): ReactElement {
  function transform(value: string): string | number | null {
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
      value={field.value || ''} // The value can now also be null but the input cannot handle it, so we set a default empty string instead
      ref={ref}
      onChange={(event) => field.onChange(transform(event.target.value))}
    />
  );
}

export const FormInput: ForwardRefWithGenerics = forwardRef(_FormInput);

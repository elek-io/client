import { ForwardedRef, forwardRef, TextareaHTMLAttributes } from 'react';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { Textarea } from './textarea';

export interface FormTextareaProps<T extends FieldValues>
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  field: ControllerRenderProps<T>;
}

/**
 * Special variant of the Textarea component
 * that returns null instead of an empty string
 * if the user did not put in a value.
 */
function _FormTextarea<T extends FieldValues>(
  { field, ...props }: FormTextareaProps<T>,
  ref: ForwardedRef<HTMLTextAreaElement>
): JSX.Element {
  function transform(value: string): string | null {
    if (value.trim() === '') {
      return null;
    }
    return value;
  }

  return (
    <Textarea
      {...props}
      {...field}
      value={field.value || ''} // The value can now also be null but the textarea cannot handle it, so we set a default empty string instead
      ref={ref}
      onChange={(event) => field.onChange(transform(event.target.value))}
    />
  );
}

export const FormTextarea: ForwardRefWithGenerics = forwardRef(_FormTextarea);

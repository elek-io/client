import { ValueDefinition } from '@elek-io/shared';
import { ReactElement } from 'react';
import { ControllerRenderProps, UseFormReturn } from 'react-hook-form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export function ValueInputFromDefinition<T>(
  definition: ValueDefinition,
  state: UseFormReturn<T>,
  field: ControllerRenderProps<T>
): ReactElement {
  switch (definition.inputType) {
    case 'text':
      return (
        <Input
          {...field}
          type="text"
          required={definition.isRequired}
          disabled={definition.isDisabled}
        />
      );
    case 'textarea':
      return (
        <Textarea
          {...field}
          required={definition.isRequired}
          disabled={definition.isDisabled}
        />
      );
    case 'number':
      return (
        <Input
          {...field}
          {...state.register(field.name, { setValueAs: setValueAsNumber })}
          type="number"
          min={definition.min}
          max={definition.max}
          required={definition.isRequired}
          disabled={definition.isDisabled}
        />
      );
    default:
      console.error(
        `Unsupported Entry definition inputType "${definition.inputType}"`
      );
      break;
  }
}

/**
 * Custom transform function that will be called before validation
 * when used with react hook form's setValueAs of the register method
 * to return the input's value as a number instead of string and undefined if empty.
 *
 * Imagine we have a useForm() with zod validation and the schema used
 * contains an optional number and we have a number input that has the value 5.
 * Then the value of 5 is returned as a string by the input.
 *
 * React hook form's valueAsNumber is returning the value 5 as a number (great!)
 * but it returns NaN if the input field is empty.
 * So we need to use this custom transform function that returns undefined instead
 * to satisfy the zod validator.
 *
 * If the zod schema for number is required, it is still correct to return undefined
 * instead of an empty string or NaN, since the zod validator then is complaining
 * about the required value not being set.
 *
 * @see https://github.com/orgs/react-hook-form/discussions/6980#discussioncomment-1785009
 * @see https://react-hook-form.com/docs/useform/register
 */
export function setValueAsNumber(value: any) {
  if (value === '') {
    return undefined;
  }

  return parseInt(value);
}

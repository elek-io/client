import { ValueDefinition } from '@elek-io/shared';
import { ReactElement } from 'react';
import { ControllerRenderProps, UseFormReturn } from 'react-hook-form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { setValueAsNumber } from './util';

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

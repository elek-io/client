import { useMemo } from 'react';

import { FieldDefinitionsContext } from '@renderer/hooks/useFieldDefinitions';

import {
  flattenFieldDefinitions,
  type FieldDefinitionOrGroup,
} from '@elek-io/core';

/**
 * Provides a form's field definitions (flattened, since grouping carries no
 * meaning for references) to field renderers that resolve sibling fields.
 */
export function FieldDefinitionsProvider({
  fieldDefinitions,
  children,
}: {
  fieldDefinitions: FieldDefinitionOrGroup[];
  children: React.ReactNode;
}): React.JSX.Element {
  const flattenedFieldDefinitions = useMemo(
    () => flattenFieldDefinitions(fieldDefinitions),
    [fieldDefinitions]
  );

  return (
    <FieldDefinitionsContext.Provider value={flattenedFieldDefinitions}>
      {children}
    </FieldDefinitionsContext.Provider>
  );
}

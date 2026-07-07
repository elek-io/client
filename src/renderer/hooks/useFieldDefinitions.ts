import { createContext, useContext } from 'react';

import type { FieldDefinition } from '@elek-io/core';

export const FieldDefinitionsContext = createContext<FieldDefinition[] | null>(
  null
);

/**
 * The flattened field definitions of the surrounding Entry form, or null when
 * rendered outside of one (for example the Collection editor's field preview).
 *
 * Used by field renderers that resolve references to sibling fields,
 * currently the slug field's sources.
 */
export function useFieldDefinitions(): FieldDefinition[] | null {
  return useContext(FieldDefinitionsContext);
}

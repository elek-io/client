import { translatableDefault } from '@renderer/lib/utils';

import type { FieldDefinition, SupportedLanguage } from '@elek-io/core';

/**
 * Builds the default form Value for a single field definition, in the shape the
 * generated Entry schema expects (a per-language `content` record under a slug).
 * Shared by the create and update Entry routes so both hydrate Values the same way.
 */
export function defaultEntryValue(
  definition: FieldDefinition,
  supportedLanguages: SupportedLanguage[]
): {
  objectType: 'value';
  valueType: FieldDefinition['valueType'];
  content: Record<SupportedLanguage, unknown>;
} {
  switch (definition.valueType) {
    case 'boolean':
    case 'number':
    case 'string':
      return {
        objectType: 'value',
        valueType: definition.valueType,
        content: translatableDefault({
          supportedLanguages,
          defaultValue: definition.defaultValue,
        }),
      };
    case 'reference':
      return {
        objectType: 'value',
        valueType: definition.valueType,
        content: translatableDefault({
          supportedLanguages,
          defaultValue: [],
        }),
      };
    case 'component':
    case 'mdast':
    default:
      throw new Error(
        `Unsupported valueType "${definition.valueType}" while building default Entry Values`
      );
  }
}

/**
 * Builds the default Values record (keyed by slug) for a set of field definitions.
 * Pass the flattened field definitions (grouping does not affect Values).
 */
export function defaultEntryValues(
  fieldDefinitions: FieldDefinition[],
  supportedLanguages: SupportedLanguage[]
): Record<string, ReturnType<typeof defaultEntryValue>> {
  return Object.fromEntries(
    fieldDefinitions.map((definition) => [
      definition.slug,
      defaultEntryValue(definition, supportedLanguages),
    ])
  );
}

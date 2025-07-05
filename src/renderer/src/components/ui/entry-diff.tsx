import {
  type Collection,
  type Entry,
  type SupportedLanguage,
  type TranslatableString,
} from '@elek-io/core';
import { FieldFromDefinition } from '../forms/util';

export interface EntryDiffProps {
  collection: Collection;
  entry: Entry;
  language: SupportedLanguage;
  translateContent: (key: string, record: TranslatableString) => string;
}

export function EntryDiff({
  collection,
  entry,
  language,
  translateContent,
}: EntryDiffProps): JSX.Element {
  return (
    <>
      {collection.fieldDefinitions.map((definition, definitionIndex) => {
        return (
          <FieldFromDefinition
            key={definition.id}
            fieldDefinition={definition}
            translateContent={translateContent}
            value={entry.values[definitionIndex]?.content[language]}
          />
        );
      })}
    </>
  );
}

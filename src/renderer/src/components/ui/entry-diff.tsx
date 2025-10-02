import {
  type Collection,
  type Entry,
  type SupportedLanguage,
  type TranslatableString,
} from '@elek-io/core';
import type { ReactElement } from 'react';
import { DisabledFieldFromDefinition } from '../forms/util';

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
}: EntryDiffProps): ReactElement {
  return (
    <div className="p-6 grid grid-cols-12 gap-x-4 gap-y-8 sm:gap-x-6 xl:gap-x-8">
      {collection.fieldDefinitions.map((definition, definitionIndex) => {
        return (
          <DisabledFieldFromDefinition
            key={definition.id}
            fieldDefinition={definition}
            translateContent={translateContent}
            value={entry.values[definitionIndex]?.content[language]}
          />
        );
      })}
    </div>
  );
}

import type { ReactElement } from 'react';

import { DisabledFieldFromDefinition } from '@renderer/components/forms/util';

import {
  type Collection,
  type Entry,
  type SupportedLanguage,
  type TranslatableString,
} from '@elek-io/core';

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
    <div className="grid grid-cols-12 gap-x-4 gap-y-8 p-6 sm:gap-x-6 xl:gap-x-8">
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

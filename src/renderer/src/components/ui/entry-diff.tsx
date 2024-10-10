import {
  Collection,
  Entry,
  SupportedLanguage,
  TranslatableString,
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
    <div className="text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
      <div className="p-6 flex flex-col gap-6">
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
      </div>
    </div>
  );
}

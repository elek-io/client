import type { ReactElement } from 'react';

import { DisabledFieldFromDefinition } from '@renderer/components/forms/util';
import { FormItem } from '@renderer/components/ui/form';
import { Input } from '@renderer/components/ui/input';
import { Label } from '@renderer/components/ui/label';
import { Textarea } from '@renderer/components/ui/textarea';

import {
  type Collection,
  type SupportedLanguage,
  type TranslatableString,
} from '@elek-io/core';

export interface CollectionDiffProps {
  collection: Collection;
  language: SupportedLanguage;
  translateContent: (key: string, record: TranslatableString) => string;
}

export function CollectionDiff({
  collection,
  language,
  translateContent,
}: CollectionDiffProps): ReactElement {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <FormItem>
          <Label isRequired={true}>Collection name (Plural)</Label>
          <Input value={collection.name.plural[language]} disabled={true} />
        </FormItem>

        <FormItem>
          <Label isRequired={true}>Entry name (Singular)</Label>
          <Input value={collection.name.singular[language]} disabled={true} />
        </FormItem>

        <FormItem>
          <Label isRequired={true}>Description</Label>
          <Textarea value={collection.description[language]} disabled={true} />
        </FormItem>
      </div>

      <section className="border-t border-zinc-200 p-6 dark:border-zinc-800">
        <h3 className="text-sm leading-6 font-semibold">Fields</h3>
        <div className="grid grid-cols-12 gap-x-4 gap-y-8 p-6 sm:gap-x-6 xl:gap-x-8">
          {collection.fieldDefinitions.map((definition) => (
            <DisabledFieldFromDefinition
              key={definition.id}
              fieldDefinition={definition}
              translateContent={translateContent}
              value={''}
            />
          ))}
        </div>
      </section>
    </>
  );
}

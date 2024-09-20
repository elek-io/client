import {
  Collection,
  SupportedLanguage,
  TranslatableString,
} from '@elek-io/core';
import { FieldFromDefinition } from '../forms/util';
import { FormItem } from './form';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

export interface CollectionDiffProps {
  collection: Collection;
  language: SupportedLanguage;
  translateContent: (key: string, record: TranslatableString) => string;
}

export function CollectionDiff({
  collection,
  language,
  translateContent,
}: CollectionDiffProps): JSX.Element {
  return (
    <div className="text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
      <div className="p-6 flex flex-col gap-6">
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

      <section className="p-6 border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base font-semibold leading-6">Fields</h2>
        <div className="mt-6 flex flex-col gap-6">
          {collection.fieldDefinitions.map((definition) =>
            FieldFromDefinition(definition, translateContent)
          )}
        </div>
      </section>
    </div>
  );
}

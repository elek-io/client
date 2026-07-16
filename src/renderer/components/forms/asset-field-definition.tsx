import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement } from 'react';

import { baseDefaults } from '@renderer/components/forms/field-definition-defaults';
import {
  DefinitionDraft,
  type DefinitionDraftProps,
  type DefinitionExtrasProps,
  type DefinitionSpec,
} from '@renderer/components/forms/field-definition-draft';
import {
  FormControl,
  FormDescription,
  FormField,
  FormInputField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@renderer/components/ui/form';

import {
  assetFieldDefinitionSchema,
  uuid,
  type AssetFieldDefinition,
} from '@elek-io/core';

// PROOF OF CONCEPT - the asset field type on the registry.
//
// Asset is the simplest reference type: a `reference` value that can never be
// unique, whose only controls are how many Assets may be selected (min/max).
// Those bounds are int>=1 nullable Asset counts, a different shape from the
// scalar char/number bounds, so they stay inline rather than routing through
// MinMaxRow. `ofAssetMimeTypes` is not authored today (see
// contributing/not-yet-implemented.md), so it carries no control but still gets
// its empty default so the definition Core requires it validates and saves.
//
// See contributing/renderer/form-architecture.md.

function AssetExtras({
  form,
}: DefinitionExtrasProps<AssetFieldDefinition>): ReactElement {
  return (
    <div className="flex flex-row items-center justify-between space-x-2">
      <FormField
        control={form.control}
        name="min"
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={false}>Minimum</FormLabel>
            <FormControl>
              <FormInputField field={field} type="number" />
            </FormControl>
            <FormDescription>
              The minimum number of Assets the user needs to select.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="max"
        render={({ field }) => (
          <FormItem>
            <FormLabel isRequired={false}>Maximum</FormLabel>
            <FormControl>
              <FormInputField field={field} type="number" />
            </FormControl>
            <FormDescription>
              The maximum number of Assets the user is able to select.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

const assetSpec: DefinitionSpec<AssetFieldDefinition> = {
  authorableFieldType: 'asset',
  resolver: zodResolver(assetFieldDefinitionSchema),
  // Reference fields are never unique. ofAssetMimeTypes has no authoring control
  // yet but is required by Core, so it defaults to empty (any mime type).
  makeDefaults: (langs) => ({
    ...baseDefaults(langs),
    id: uuid(),
    valueType: 'reference',
    fieldType: 'asset',
    isUnique: false,
    min: null,
    max: null,
    ofAssetMimeTypes: [],
  }),
  Extras: AssetExtras,
};

/** The asset authoring entry: a DefinitionDraft over the asset spec. */
export function AssetDefinitionDraft(
  props: DefinitionDraftProps
): ReactElement {
  return <DefinitionDraft {...props} spec={assetSpec} />;
}

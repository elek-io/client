import { Plus } from 'lucide-react';
import { useId, useState, type ReactElement } from 'react';

import { type DefinitionDraftProps } from '@renderer/components/forms/field-definition-draft';
import {
  FIELD_DEFINITION_REGISTRY,
  unauthorableFieldTypes,
} from '@renderer/components/forms/field-definition-registry';
import { SubmitButton } from '@renderer/components/ui/app-form';
import { Button } from '@renderer/components/ui/button';
import {
  FormDescription,
  FormItem,
  FormLabel,
} from '@renderer/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@renderer/components/ui/sheet';

import {
  fieldTypeSchema,
  type FieldDefinition,
  type FieldDefinitionOrGroup,
  type FieldType,
  type Project,
} from '@elek-io/core';

// The Add Field sheet, the hardest form in the app, self-contained. It renders
// ONE registry-driven AppForm for the selected field type and submits it through
// a real detached SubmitButton (form={id}) in the footer - one submission model,
// no imperative ref. The registry is exhaustive over Core's FieldType, so every
// pickable type has an authoring form; 'dynamic' cannot be authored yet and is
// disabled in the picker (see unauthorableFieldTypes).
//
// See contributing/renderer/form-architecture.md.

export interface AddFieldSheetProps {
  project: Project;
  // The Collection's field definitions as their real value (real ids), bound
  // through a Controller in the Collection form. Read here only for the
  // duplicate-slug guard and the slug source list; edits go through onAppend.
  fieldDefinitions: FieldDefinitionOrGroup[];
  onAppend: (definition: FieldDefinition) => void;
}

export function AddFieldSheet({
  project,
  fieldDefinitions,
  onAppend,
}: AddFieldSheetProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text');
  const addFieldFormId = useId();

  const supportedLanguages = project.settings.language.supported;
  const defaultLanguage = project.settings.language.default;

  const existingSlugs = fieldDefinitions.flatMap((definition) =>
    'isGroup' in definition
      ? definition.fieldDefinitions.map((member) => member.slug)
      : [definition.slug]
  );

  const onAdd = (definition: FieldDefinition): void => {
    onAppend(definition);
    setIsOpen(false);
  };

  const draftProps: DefinitionDraftProps = {
    id: addFieldFormId,
    existingSlugs,
    fieldDefinitions,
    supportedLanguages,
    defaultLanguage,
    onAdd,
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          Icon={Plus}
          onClick={(event) => {
            event.preventDefault();
            setIsOpen(true);
          }}
        >
          Add Field
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add a Field to this Collection</SheetTitle>
          <SheetDescription>
            Adding Fields to your Collection will enable users to enter data
            that follows the boundries you&apos;ve set.
          </SheetDescription>
          <FormItem>
            <FormLabel isRequired>Input type</FormLabel>
            <Select
              value={selectedFieldType}
              onValueChange={(value: FieldType) => setSelectedFieldType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypeSchema.options.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    disabled={unauthorableFieldTypes.has(option)}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              The type of input the user is able to enter for this Field.
            </FormDescription>
          </FormItem>
        </SheetHeader>

        {/* Keyed by type so switching the picker remounts the body with the
        right schema and defaults. One live form, not 18. */}
        <SheetBody key={selectedFieldType}>
          {FIELD_DEFINITION_REGISTRY[selectedFieldType](draftProps)}
        </SheetBody>

        <SheetFooter>
          {/* Detached submit: the button lives in the footer, the form in the
          body; they associate through the HTML form attribute. Both are in the
          Sheet's portal, so the inner <form> is not DOM-nested in the Collection
          form. */}
          <SubmitButton className="w-full" form={addFieldFormId}>
            Add definition
          </SubmitButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

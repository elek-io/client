import { createContext, useContext, useId, type ReactNode } from 'react';
import {
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import { Button } from '@renderer/components/ui/button';
import { Form } from '@renderer/components/ui/form';

// PROOF OF CONCEPT - the single blessed form primitive.
//
// This is the whole point of the redesign: one place owns the <form> element and
// the policies that were previously pasted per call site (noValidate, the submit
// wiring, the id/detached-button seam, view-only disabling). A caller cannot get
// these wrong because they are not props.
//
// See contributing/renderer/form-architecture.md.

interface AppFormContextValue {
  id: string;
}

const AppFormContext = createContext<AppFormContextValue | null>(null);

function useAppFormId(): string | null {
  return useContext(AppFormContext)?.id ?? null;
}

export interface AppFormProps<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
> {
  form: UseFormReturn<TFieldValues, unknown, TTransformedValues>;
  onSubmit: SubmitHandler<TTransformedValues>;
  /**
   * The form's id. A detached submit button (page header, dialog or sheet
   * footer) associates with it via the HTML form attribute. Defaults to a
   * generated id when omitted, which is enough for a form whose submit button is
   * inside its own subtree.
   */
  id?: string;
  /**
   * 'view' renders the whole form read-only through a disabled fieldset and
   * makes onSubmit a no-op, so the diff and history views reuse the same
   * component without a second read-only code path.
   */
  mode?: 'edit' | 'view';
  className?: string;
  children: ReactNode;
}

/**
 * The only place a <form> element is written in the app. It always sets
 * noValidate (zod through react-hook-form is the single validator), always
 * routes submission through handleSubmit, and owns the id that a detached
 * SubmitButton associates with.
 */
export function AppForm<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  form,
  onSubmit,
  id,
  mode = 'edit',
  className,
  children,
}: AppFormProps<TFieldValues, TTransformedValues>): ReactNode {
  const generatedId = useId();
  const formId = id ?? generatedId;

  const submit = form.handleSubmit(onSubmit);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    // Stop the submit event from bubbling up the React tree. An AppForm rendered
    // inside another form's React subtree (a Sheet or Dialog on a page that is
    // itself a form) is portaled out of that form's DOM, but React still bubbles
    // the synthetic submit event to React ancestors - which would submit the
    // outer form too. Owning this here means a nested AppForm can never
    // cross-submit its parent. handleSubmit already calls preventDefault.
    event.stopPropagation();
    if (mode === 'view') {
      event.preventDefault();
      return;
    }
    void submit(event);
  };

  return (
    <AppFormContext value={{ id: formId }}>
      <Form {...form}>
        {/* noValidate is not a prop and cannot be forgotten. The field registry
        emits no native constraint attributes either, so there is nothing for the
        browser to validate first and block handleSubmit on. */}
        <form
          id={formId}
          noValidate
          className={className}
          onSubmit={handleSubmit}
        >
          <fieldset disabled={mode === 'view'}>{children}</fieldset>
        </form>
      </Form>
    </AppFormContext>
  );
}

export interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  /**
   * The id of the form to submit. Required when the button is rendered outside
   * the form's subtree (the detached header/footer case), which is the common
   * one here. When omitted, the button falls back to the enclosing AppForm's id.
   */
  form?: string;
}

/**
 * The only submit control. type="submit" and the form association are
 * structural, not opt-in, so a submit button can never silently do nothing
 * (the footgun that Button's type="button" default introduced).
 */
export function SubmitButton({
  form,
  children,
  ...props
}: SubmitButtonProps): ReactNode {
  const contextId = useAppFormId();
  const formId = form ?? contextId ?? undefined;

  return (
    <Button type="submit" form={formId} {...props}>
      {children}
    </Button>
  );
}

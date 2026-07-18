import { createContext, useContext, useId, type ReactNode } from 'react';
import {
  useFormState,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import { Button } from '@renderer/components/ui/button';
import { Form } from '@renderer/components/ui/form';

// The single blessed form primitive. One place owns the <form> element and the
// policies that were previously pasted per call site (noValidate, the submit
// wiring, the id/detached-button seam, view-only disabling). A caller cannot get
// these wrong because they are not props.
//
// See contributing/renderer/forms.md.

interface AppFormContextValue {
  id: string;
}

const AppFormContext = createContext<AppFormContextValue | null>(null);

function useAppFormId(): string | null {
  return useContext(AppFormContext)?.id ?? null;
}

// The gating a detached SubmitButton reads. A button in a Page header, dialog or
// sheet footer sits OUTSIDE the form's FormProvider subtree, so it cannot read
// formState from context there. FormActions bridges that gap: it reads the
// reactive formState with the form in scope and exposes just what the button
// gates on, plus the id it submits.
interface FormActionsContextValue {
  formId: string | undefined;
  isDirty: boolean;
  isSubmitting: boolean;
}

const FormActionsContext = createContext<FormActionsContextValue | null>(null);

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
  id?: string | undefined;
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

export interface FormActionsProps<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
> {
  form: UseFormReturn<TFieldValues, unknown, TTransformedValues>;
  /**
   * The form's id, shared with the AppForm so a detached SubmitButton inside
   * this area associates with it. Defaults to the enclosing AppForm's id, which
   * is enough when the button sits inside the form's own subtree.
   */
  id?: string | undefined;
  children: ReactNode;
}

/**
 * Wraps the area that holds a form's SubmitButton (a Page header, dialog or
 * sheet footer) and makes the form's reactive gating available to it. This is
 * the one mechanism for gating a detached button: it subscribes to `isDirty` and
 * `isSubmitting` through `useFormState` (so the button re-renders when the form
 * dirties or starts submitting), and passes them plus the form id down.
 */
export function FormActions<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  form,
  id,
  children,
}: FormActionsProps<TFieldValues, TTransformedValues>): ReactNode {
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const appFormId = useAppFormId();
  const formId = id ?? appFormId ?? undefined;

  return (
    <FormActionsContext value={{ formId, isDirty, isSubmitting }}>
      {children}
    </FormActionsContext>
  );
}

export interface SubmitButtonProps extends React.ComponentProps<typeof Button> {
  /**
   * The id of the form to submit. Needed when the button is rendered outside the
   * form's subtree (the detached header/footer case) and no enclosing
   * FormActions or AppForm supplies it. When omitted, it falls back to the
   * enclosing FormActions' id, then the enclosing AppForm's id.
   */
  form?: string;
  /**
   * Disable the button until the form is dirty. Off by default, so a create form
   * stays enabled on open; update forms opt in to keep their per-form intent.
   * Requires an enclosing FormActions to read the dirty state.
   */
  requireDirty?: boolean;
}

/**
 * The only submit control. type="submit" and the form association are
 * structural, not opt-in, so a submit button can never silently do nothing (the
 * footgun that Button's type="button" default introduced).
 *
 * Gating is uniform: it always disables while the form is submitting (RHF's
 * `isSubmitting`, which spans the awaited `mutateAsync`), and additionally on a
 * pristine form when `requireDirty` is set. Both come from the enclosing
 * FormActions.
 */
export function SubmitButton({
  form,
  requireDirty = false,
  disabled,
  isLoading,
  children,
  ...props
}: SubmitButtonProps): ReactNode {
  const actions = useContext(FormActionsContext);
  const appFormId = useAppFormId();
  const formId = form ?? actions?.formId ?? appFormId ?? undefined;

  const isSubmitting = actions?.isSubmitting ?? false;
  const isDirty = actions?.isDirty ?? true;
  const gatedDisabled =
    disabled === true || isSubmitting || (requireDirty && isDirty === false);

  return (
    <Button
      type="submit"
      form={formId}
      disabled={gatedDisabled}
      isLoading={isLoading ?? isSubmitting}
      {...props}
    >
      {children}
    </Button>
  );
}

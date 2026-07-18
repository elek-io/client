import { createContext, useContext, useId, type ReactNode } from 'react';
import {
  useFormState,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';

import { Button } from '@renderer/components/ui/button';
import { Form } from '@renderer/components/ui/form';

// The form primitives every form in the app is built from.
// See contributing/renderer/forms.md.

interface AppFormContextValue {
  id: string;
}

const AppFormContext = createContext<AppFormContextValue | null>(null);

function useAppFormId(): string | null {
  return useContext(AppFormContext)?.id ?? null;
}

// The gating a detached SubmitButton reads, since a button outside the form's
// FormProvider subtree cannot read formState from context.
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
 * The only place a <form> element is written in the app. It owns noValidate, the
 * handleSubmit wiring, the id a detached SubmitButton associates with, and the
 * view-only mode. See contributing/renderer/forms.md.
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
    // Load bearing: a Sheet or Dialog is portaled out of an outer form's DOM but
    // React still bubbles the synthetic submit event to its React ancestors, so
    // without this a nested AppForm also submits its parent. handleSubmit already
    // calls preventDefault.
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
        {/* noValidate is deliberately not a prop, so it cannot be forgotten. */}
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
 * sheet footer) and makes the form's reactive gating available to it. It
 * subscribes through `useFormState`, so the enclosed button re-renders when the
 * form dirties or starts submitting.
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
 * The only submit control. It always disables while the form is submitting, and
 * additionally on a pristine form when `requireDirty` is set. Both read the
 * enclosing FormActions. See contributing/renderer/forms.md.
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

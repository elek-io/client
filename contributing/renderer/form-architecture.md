# Form Architecture (design record)

> [!NOTE]
> **Status: IMPLEMENTED.** This document is the design **record** for the
> renderer's form layer: the problem, the four candidate architectures that were
> weighed, and why the shipped one (a bespoke schema-driven form engine on
> react-hook-form behind one blessed `AppForm` / `SubmitButton` primitive) was
> chosen. It is kept for the rationale, not as instructions.
>
> For how the shipped architecture works day to day - `AppForm` / `SubmitButton`,
> the authoring and render registries, the single `TranslatableField`,
> `useAppMutation`, and the enforced invariants - read the living doc,
> [`dynamic-form-field-generation.md`](./dynamic-form-field-generation.md). The
> durable parts have been folded there. The **Landed** callouts below mark where
> each proposal became code, and the [Guardrails](#guardrails) section records the
> lint rules and test that now enforce the invariants.

Forms are the largest surface of this app: **~6000 lines across 24 files**
(`components/forms/*` plus `components/ui/form.tsx` at 1912 lines), 11
mutation-backed form instances, 6 diff forms, 18 field types, and every
create/update/view flow the user has. This proposal treats getting them right
(correct, consistent, accessible, testable, hard to misuse) as worth a
structural change, not a set of point fixes.

---

## TL;DR

- **Keep react-hook-form and zod.** The library is not the problem. Swapping to
  TanStack Form or a native-form approach would be a full rewrite that fixes the
  _least_ important problem and leaves the two hardest ones (recursive-type
  instantiation depth, `z.input`/`z.output` divergence) exactly where they are,
  while risking a currently-green E2E suite. See
  [Candidate architectures](#candidate-architectures).
- **The missing abstraction, not the wrong library, is the root cause.** Every
  cross-cutting policy (native-vs-programmatic submit, `noValidate`, `isDirty`
  gating, `sr-only` names, submit-button wiring) is applied per call site.
  History shows each policy needed a **7–16 file sweep** and at least one
  follow-up regression to roll out. See [What is wrong today](#what-is-wrong-today).
- **Two things fix the class of bug structurally:**
  1. **One blessed form primitive** (`AppForm` + `SubmitButton`) that owns the
     only `<form>` element, always sets `noValidate`, always wires `handleSubmit`,
     always `stopPropagation`s submit (so a nested form can't cross-submit its
     parent — a real bug the PoC hit), and owns the `id`/detached-button seam.
     In-place `CoreError` handling stays at the mutation layer (a `useAppMutation`
     helper), not in `AppForm`.
  2. **One schema-driven field registry** keyed on Core's `FieldType`, which
     drives **both** the entry form renderer **and** the field-definition
     authoring forms. This collapses the 18 near-duplicate `*-value-definition-form.tsx`
     files, the two 18-case switches, the 18 simultaneous `useForm` instances,
     and the imperative `useImperativeHandle` dispatcher into one form plus a
     data table.
- **Manage `fieldDefinitions` as a single `Controller`-bound value (edited
  through typed helpers), not opaque `useFieldArray`
  rows.** This is [already Core's suggested direction](./../not-yet-implemented.md),
  it removes three `as unknown as` casts, and it fixes a **latent correctness bug**
  (below).
- **Adopt via a strangler**, one form at a time, E2E-green at every step. No
  big-bang rewrite.

---

## Form inventory

Every form-bearing surface in `src/renderer`, from reading the code (not this
brief). "Mode" is create / update / view-only(diff) / other.

| #     | File                                                                                   | Purpose                       | Mode              | Schema source                          | Submit button location                |
| ----- | -------------------------------------------------------------------------------------- | ----------------------------- | ----------------- | -------------------------------------- | ------------------------------------- |
| 1     | `routes/projects/create.tsx`                                                           | Create Project                | create            | Core `createProjectSchema`             | Page header                           |
| 2     | `routes/projects/index.tsx`                                                            | Clone Project (dialog)        | create            | **none (no resolver)**                 | Dialog footer                         |
| 3     | `routes/user/profile.tsx`                                                              | User setup / profile          | create+update     | Core `setUserSchema`                   | Page header                           |
| 4     | `routes/projects/$projectId/assets/index.tsx`                                          | Add Asset (dialog)            | create            | Core `createAssetSchema`               | Dialog footer                         |
| 5     | `components/asset-teaser.tsx`                                                          | Update Asset (dialog)         | update            | Core `updateAssetSchema`               | Dialog footer                         |
| 6     | `routes/…/collections/create.tsx`                                                      | Create Collection             | create            | Core `createCollectionSchema`          | Page header                           |
| 7     | `routes/…/collections/$collectionId/update.tsx`                                        | Configure Collection          | update            | Core `updateCollectionSchema`          | Page header                           |
| 8     | `routes/…/collections/$collectionId/create.tsx`                                        | Create Entry                  | create            | **Core-generated** per collection      | Page header                           |
| 9     | `routes/…/$entryId/update.tsx`                                                         | Update Entry                  | update            | **Core-generated** per collection      | Page header                           |
| 10    | `routes/…/settings/general.tsx`                                                        | Update Project                | update            | Core `updateProjectSchema`             | Page header                           |
| 11    | `routes/…/settings/version-control.tsx`                                                | Set remote origin URL         | update            | Core `setRemoteOriginUrlProjectSchema` | **inside `<form>`** (the one outlier) |
| 12–14 | `components/{project,collection,entry}-diff.tsx`                                       | History diff                  | view-only         | Core static update schemas (×2 each)   | none                                  |
| —     | `components/forms/collection-form.tsx` + `util.tsx` + 18 `*-value-definition-form.tsx` | **Add Field** authoring sheet | create (add-only) | Core 18 per-type definition schemas    | Sheet footer (imperative ref)         |
| —     | `components/forms/entry-form.tsx` + `ui/form.tsx`                                      | Dynamic entry renderer        | all               | Core-generated                         | n/a                                   |

Non-RHF form-like interactions (delete confirmations, sync, markdown link
dialog, reference pickers, table filter, API toggle) exist too; they are out of
scope except where they share the submit/`Button` primitives.

Two facts shape everything:

- **Reference fields fetch inside the form.** `FormAssetField` /
  `FormEntryField` run TanStack Query themselves and enforce `max` in the UI.
- **The entry form is inherently dynamic.** Its schema is generated per
  collection from field definitions at runtime, and — critically — the generated
  schema's **input type is `{ [x: string]: unknown }`** (verified in Core's
  `.d.ts`: the per-slug object is `.pipe()`d to `z.record(slugSchema, valueSchema)`,
  erasing per-field static types). No form library can give per-field static
  typing here. The entry form must be metadata-driven; trying to make RHF's
  `FieldPath` resolve entry value paths is fighting a type that is `unknown` by
  construction.

---

## Requirements matrix

The dimensions any architecture must satisfy, distilled from the inventory.
These are the yardstick used to score candidates.

| #   | Requirement                                                                                                          | Why it is load-bearing                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| R1  | **Create / update / view-only / diff** reuse of one component                                                        | 4 shared form components each serve all four; diff mounts them read-only               |
| R2  | **Dynamic entry forms** generated from Core field definitions (18 types)                                             | The core product; schema and fields unknown at compile time                            |
| R3  | **Field-definition authoring forms** (18 per-type meta-forms)                                                        | The smelliest area; 3488 lines, 2×18-case switches, 18 `useForm`                       |
| R4  | **Translatable (per-language) fields** with a translations dialog                                                    | Every string/mdast field; single-language is the common path                           |
| R5  | **Nested field arrays with drag-reorder**                                                                            | Collection field definitions, select options, project languages                        |
| R6  | **Recursive schemas** (`FieldDefinitionOrGroup`, mdast) without hitting TS instantiation-depth limits                | Forces the opaque-row and cast workarounds today                                       |
| R7  | **Detached submit buttons** in Page headers / Dialog & Sheet footers, accessibly and testably                        | 10 of 11 forms submit from outside the `<form>`                                        |
| R8  | **Pending + dirty gating** of submit                                                                                 | Inconsistent today; a missing `isDirty` gate makes Core throw a message-less git error |
| R9  | **TanStack Query mutation + error handling by `CoreError` type**, rest to the root boundary                          | Never blanket-disable; 7 typed `CoreError`s                                            |
| R10 | **Accessibility**: label association, `aria-*` wiring, focus-on-error, axe-clean                                     | E2E asserts zero console errors and runs axe; role/label locators require it           |
| R11 | **Playwright E2E testability** via role/label locators (no test-ids)                                                 | The entire suite is semantic locators                                                  |
| R12 | **`z.input`/`z.output` divergence** handled                                                                          | `values` is a pipe; entry input is `unknown`; `CreateEntryProps` ≠ form values         |
| R13 | **Value contracts**: null-for-empty, number coercion, ISO↔local datetime, reference arrays, mdast null-normalization | Core validates tightly; wrong shape fails validation                                   |
| R14 | **One submission model** (no native-vs-programmatic split)                                                           | The root of the recent bug chain                                                       |
| R15 | **Low TS-cast tax**, no `as unknown as` of whole form objects                                                        | AGENTS.md forbids casts; ~25 exist across the form layer                               |
| R16 | **Maintenance / React 19 / Electron / bundle** health                                                                | Must stay current and small                                                            |

---

## What is wrong today

Grounded in the code and git history. Each is a symptom of the same root cause:
**there is no single place that owns a form's behavior**, so every policy is
re-implemented per call site and drifts.

### 1. Two-and-a-half submission models, mixable wrong (R14)

- **Native**: 10 forms render the submit button _outside_ the `<form>` (Page
  header / Dialog footer) and associate it with `type="submit" form={id}`.
- **Programmatic-via-ref**: the "Add Field" sheet footer button calls
  `fieldDefinitionFormRef.current.addDefinition()`, which calls
  `handleSubmit(cb)()` manually. No `<form>` submit event is involved.
- **Layout-only `<form>`**: all 18 per-type authoring files wrap fields in a
  bare `<form className="space-y-6">` with **no `onSubmit`, no `id`, no
  `noValidate`** — they are not forms, and Enter inside one is an unhandled
  native submit waiting to happen.

The recent three-commit chain (`4cbd995` → `adadb58` → `b52858e`, over 12 hours)
is exactly this class: moving buttons out of the form → changing `Button`'s
default `type` → discovering native constraint validation now blocks
`handleSubmit` → pasting `noValidate` into 7 forms individually. The fix works
but nothing structural prevents the next mix-up. Worse, `adadb58` introduced a
_new_ footgun: because `Button` now defaults to `type="button"`, a submit button
that forgets `type="submit"` silently does nothing.

### 2. The field-definition authoring subsystem is data pretending to be code (R3)

`util.tsx` (690 lines) instantiates **18 `useForm` hooks on every render** (one
per field type), switches on `fieldType` **twice** (an 18-case render dispatch
and an 18-case submit dispatch inside a `useImperativeHandle`), and appends the
result to an opaque field array. 13 of the 18 per-type files contain **zero
logic** — they differ only in which of `defaultValue`/`min`/`max` they render,
the input's `type` attribute, and description strings. The per-type defaults,
the "can this type be unique/required" rules, and the "which options does this
type expose" knowledge are **scattered across three places** (`util.tsx`
defaults, `default-field-definition-form.tsx` conditionals, the per-type files).
Editing an existing definition is unimplemented — the Edit pencil has no
`onClick`.

### 3. A latent correctness bug from the opaque-row workaround (R6, R15)

To dodge RHF's instantiation-depth limit on the `FieldDefinitionOrGroup` union,
`fieldDefinitions` is a `useFieldArray` of opaque `{ id: string }` rows, cast
back with `as unknown as FieldDefinitionOrGroup`. But **RHF overwrites each
top-level row's `id` with its own `crypto.randomUUID()` render key** (verified in
`react-hook-form/dist`). The slug authoring form reads these rows to build its
`ofFieldDefinitions` source list and stores those ids — so it stores **RHF's
render keys, not the definitions' real UUIDs**, and Core's
`slugSourceReferencesSuperRefinement` requires those ids to exist in the
Collection. No E2E covers the slug-source toggle, so this is latent. It is a
direct consequence of using `useFieldArray` for a recursive union it cannot type.

### 4. `ui/form.tsx` is a 1912-line growth sink with triplicated logic (R4, R10)

`hasErrorsInTranslations` appears **three times**; the translatable-dialog
pattern exists three times (two with `@todo` dedup comments). `FormControl`'s
Radix `Slot` lands `id`/`aria-*` on a wrapper `<div>` or a non-DOM Radix `Select`
root for translatable/date/select/asset/entry fields, so `<label htmlFor>` does
not always point at a focusable input. `FormAssetField`/`FormEntryField` accept a
`required` prop that is silently never used. Focus-on-error is wired for some
wrappers and not others. These are the kinds of defects a single field contract
would make structurally impossible.

### 5. Cross-cutting policy has a large blast radius (R7, R8, R14)

From git history, each policy rollout touched many files and needed a follow-up:

- `noValidate` (`b52858e`): 7 forms, 9 files, +72/−7.
- `Button` default type + detached buttons (`adadb58`): **16 files**, +93/−28.
- `isDirty` gating (`4f8f3bf`): applied per button; two routes had been missed.
- `sr-only` translatable-trigger names (`f00a7e7`): the _same_ fix pasted in 3
  near-duplicate places.

This is the signature of a missing abstraction, not of a wrong library.

### 6. Inconsistencies that a primitive would erase (R8, R9)

Dirty gating present on Create Entry but absent on Create Project / Collection /
Asset / Clone. Update Asset has no pending gating (`isPending` never read). Clone
Project has **no resolver at all**. Three forms wrap `zodResolver` in a needless
async closure. In-place `CoreError` handling exists at exactly 4 delete/sync
sites and **zero form submits** — so an entry unique-collision (`Conflict`) today
takes over the whole screen via the root boundary instead of flagging the field
(backlog P2-10).

> **Landed** (migration step 5). Every form now submits through
> `AppForm`/`SubmitButton`; `useAppMutation` closed P2-10; Update Asset is
> pending-gated; Clone Project is validated; the async resolver closures are gone.
> The create-form dirty-gating inconsistency was left deliberately (pinned by the
> `projects.spec.ts` / `entries.spec.ts` create-form specs), not fixed by accident.

---

## Candidate architectures

Four options, scored against the matrix. Versions verified against official
sources on 2026-07-16.

### A. Redesign on react-hook-form (recommended)

Keep RHF 7.81 + `@hookform/resolvers` 5.4 (native zod 4 support since resolvers
5.1; Standard Schema resolver available). Add **one `AppForm`/`SubmitButton`
primitive** and **one schema-driven field registry**; manage `fieldDefinitions`
as a `Controller`-bound value. Details in [The recommendation](#the-recommendation).

- **Fixes**: R3, R4, R6, R7, R8, R9, R10, R14 structurally; reduces R15.
- **Cost**: additive; strangler migration; no new dependency (bundle delta ~0).
- **Risk**: low — the E2E suite stays green at each step; RHF is healthy (latest
  2026-07-05, 2 open issues, React 19 supported since 7.52).

### B. Migrate to TanStack Form

Latest `@tanstack/react-form` 1.33.2 (2026-07-13), v1 line, React 19 supported,
official devtools, **+17.9 kB gzip** (vs RHF 12.9 kB). Its `createFormHook` /
`useFieldContext<ValueType>()` composition is a genuinely better answer to R15's
"generic component cannot address literal paths" problem — the path check stays
at the `<form.AppField name=…>` call site.

But against this app's hardest requirements it does **not** help:

- **R6 (recursion)**: TanStack Form has the _same_ open defect — issues
  [#1484](https://github.com/TanStack/form/issues/1484) ("excessively deep" on a
  CMS-style recursive union) and [#1553](https://github.com/TanStack/form/issues/1553)
  (`getFieldValue` degrades to `any`). No improvement.
- **R12 (`z.input`/`z.output`)**: its `onSubmit` receives **raw input, never the
  schema's parsed output** (documented: "it does not preserve the Schema's output
  data … parse it in the `onSubmit`"). Same divergence, now manual.
- **R2**: no official runtime-schema-driven-fields example; dynamic shapes
  degrade to index-signature records — exactly where we already are.
- **Cost**: a full rewrite of `ui/form.tsx` (1912 lines), all 4 shared forms, 18
  authoring forms, and every call site, re-deriving all 13 value contracts, with
  a temporarily red E2E suite — to fix R15 alone while B leaves R6 and R12 as-is.

Verdict: the composition model is attractive, but the migration cost is enormous
and the payoff is the least important requirement. **Not recommended.** (The one
idea worth stealing — value-typed shared field components instead of
path-generic ones — is achievable on RHF via the registry, see below.)

### C. Native-form-first: React 19 actions / Conform

React 19 `<form action>` + `useActionState`/`useFormStatus`, or Conform on top of
native submission. The appeal is that "embracing native submission correctly
removes the footgun."

It does not fit this app's data:

- React 19 form actions are built around **FormData and uncontrolled inputs**
  ("read from state on submit rather than from FormData" for controlled inputs;
  the form resets uncontrolled fields after the action). The action model targets
  **Server Functions** (POST); it has no story for a client-only IPC mutation via
  TanStack Query.
- Conform and any FormData-centric model **cannot round-trip this app's value
  shapes**: an mdast tree, an array of `{ id, objectType }` references, a
  per-language record `{ title: { en, de } }`. These are rich object values that
  do not serialize to string FormData without a bespoke codec per field — which
  is more work than the current controlled model, not less.
- The genuinely useful insight — that native submission is safe **if the form
  always sets `noValidate` and never emits native constraint attributes** — is
  real, and folded into option A as the structural fix.

Verdict: **Not recommended** as an architecture. The controlled + zod + IPC model
is correct for rich object values; the fix is to make native submission
_disciplined_, not to hand form state to the browser.

### D. Generic schema-form engine (JSONForms / RJSF / uniforms)

These render forms from a schema via a widget registry. Two are JSON-Schema-first
(JSONForms, react-jsonschema-form); Core emits **zod**, and its schemas carry
`.pipe`/`.transform` and recursion that make `z.toJSONSchema` lossy, so we would
be converting away from the source of truth. Uniforms has a zod bridge but is
prototype/internal-tool oriented and would replace RHF wholesale. All three own
their own form state and styling model, and none accommodates this app's Radix +
dnd-kit + translatable-dialog + Milkdown widgets without heavy custom renderers.

Verdict: **Not recommended** as a dependency. But their **core pattern — a
registry keyed by field type, each entry a component with a uniform
value/onChange/error contract** (the same pattern Payload and Sanity use for
their field systems) — is exactly right, and option A adopts it _bespoke_ on top
of RHF, so we consume Core's zod directly and keep our widgets.

### Scorecard

| Req                  |       A (RHF redesign)        |  B (TanStack Form)  | C (native/Conform) |   D (JSONForms/RJSF)   |
| -------------------- | :---------------------------: | :-----------------: | :----------------: | :--------------------: |
| R2 dynamic entry     |          ✅ registry          |  ⚠️ untyped anyway  | ❌ FormData misfit | ⚠️ JSON-Schema convert |
| R3 authoring forms   |          ✅ registry          |     ⚠️ rewrite      |         ❌         |           ⚠️           |
| R4 translatable      |        ✅ one wrapper         |     ⚠️ rewrite      |         ❌         |    ❌ custom widget    |
| R6 recursion depth   | ✅ Controller value sidesteps |     ❌ same bug     |         ➖         |           ⚠️           |
| R7 detached submit   |         ✅ primitive          | ✅ you own `<form>` |     ✅ native      |      ❌ owns form      |
| R9 CoreError-by-type |        ✅ in primitive        |     ⚠️ re-build     |  ❌ action model   |           ❌           |
| R12 input/output     |         ✅ localized          |    ❌ raw input     |         ❌         |           ⚠️           |
| R14 one submit model |         ✅ primitive          |     ⚠️ re-build     | ✅ if disciplined  |           ⚠️           |
| R15 cast tax         |         ✅ much lower         |      ✅✅ best      |         ➖         |           ⚠️           |
| R16 bundle/health    |          ✅ ~0 delta          |  ⚠️ +5 kB, rewrite  |         ✅         |        ❌ heavy        |
| **Migration risk**   |      **low (strangler)**      | **high (rewrite)**  |      **high**      |        **high**        |

---

## The recommendation

**Option A: a bespoke schema-driven form engine on react-hook-form, behind one
blessed primitive.** Three pillars.

### Pillar 1 — one blessed form primitive

A single `AppForm` component owns every `<form>` element (one per form, but no
`<form>` is written anywhere else), and a single `SubmitButton` is the only
submit control. This is the exact shape the [proof of concept](#proof-of-concept)
ships and type-checks.

```tsx
// The only place a <form> element is written. useId is called unconditionally
// (never `id ?? useId()`, which would be a conditional hook); the passed id
// wins when present.
export function AppForm<
  TFieldValues extends FieldValues,
  TOut extends FieldValues = TFieldValues,
>({
  form,
  onSubmit,
  mode = 'edit',
  id,
  children,
}: AppFormProps<TFieldValues, TOut>) {
  const generatedId = useId();
  const formId = id ?? generatedId; // owns the detached-button seam
  return (
    <AppFormContext value={{ id: formId }}>
      <Form {...form}>
        {/* noValidate is not a prop and cannot be forgotten. The registry emits
        no native constraint attributes, so nothing blocks handleSubmit first. */}
        <form
          id={formId}
          noValidate
          onSubmit={
            mode === 'view' ? preventSubmit : form.handleSubmit(onSubmit)
          }
        >
          <fieldset disabled={mode === 'view'}>{children}</fieldset>
        </form>
      </Form>
    </AppFormContext>
  );
}

// The only submit control. type="submit" is structural, not opt-in, so a submit
// button can never silently do nothing. It takes an explicit `form` id for the
// detached case (header/footer/sheet), falling back to the enclosing AppForm's
// id when in-subtree.
export function SubmitButton({ form, ...props }: SubmitButtonProps) {
  const formId = form ?? useAppFormId() ?? undefined;
  return <Button type="submit" form={formId} {...props} />;
}
```

> [!IMPORTANT]
> **Dirty/pending gating and detached buttons.** A detached button (page header,
> dialog/sheet footer) is _outside_ the form's `FormProvider` subtree, so
> `SubmitButton` cannot read `formState` from context there. This is not a defect
> of the design — it is how the current app already works: the owning route holds
> the `useForm` object and reads `form.formState.isDirty` / passes the mutation's
> `isPending`. So gating stays with the owner that has both the form and the
> button in scope (a small `<FormActions form={form}>` render-prop can expose
> `formState` to header/footer buttons where wanted). `SubmitButton`'s guarantee
> is the _association and submit semantics_, not automatic gating.

What this makes **impossible**, not merely currently-fixed:

- The native-vs-programmatic split (R14): there is one path — `handleSubmit` on a
  real `<form>`, triggered by a spec-compliant external `type="submit" form={id}`
  button. The imperative-ref path disappears.
- Forgetting `noValidate` (R14): it is not a prop.
- A submit button that does nothing because it forgot `type="submit"` (R14):
  `SubmitButton` is the only submit control and always sets it.
- Missing dirty/pending gating (R8): default on, opt-out explicit.
- The `id`/`useId` per-call-site wiring (R7): owned by `AppForm`.
- **Nested-form cross-submit (a real footgun the PoC hit): `AppForm` calls
  `event.stopPropagation()` on submit.** An `AppForm` inside a Sheet or Dialog on
  a page that is _itself_ a form (the Add Field sheet inside the Collection form)
  is portaled out of the outer form's DOM, but React still bubbles the synthetic
  `submit` event up the React tree — so submitting the inner form would _also_
  submit the outer one. Owning `stopPropagation` in the primitive makes this
  impossible; every current form does it by luck of not nesting, and the PoC
  proved a naive nesting silently creates the parent record. See
  [Proof of concept](#proof-of-concept).

**In-place `CoreError` handling stays at the mutation layer** (R9). It is
tempting to fold the 4-site in-place pattern into `AppForm.onSubmit`, but that
would be a layer confusion: per
[error-handling.md](../error-handling.md), in-place handling requires overriding
the **mutation's** `throwOnError` predicate _and_ a no-op `onError` — both on the
`useMutation` call, which `AppForm` does not own (it wraps `handleSubmit`, not
the mutation). So the guardrail is a small `useAppMutation(options, { handled })`
helper that applies the by-type predicate to `throwOnError`/`onError`; a form's
`onSubmit` calls it and drives the field/dialog for the handled `type`. This is
what closes the entry unique-collision gap (P2-10) — at the mutation layer, not in
`AppForm`.

> **Landed.** [`hooks/useAppMutation.ts`](/src/renderer/hooks/useAppMutation.ts)
> takes the `handled` map and derives `throwOnError` (false only for the handled
> types) plus the no-op `onError` from it, and returns a `handleError(error)` the
> caller runs in its `catch`. It is the single home for the by-type pattern: the
> "expected" set is defined once, so predicate and dispatch cannot drift. P2-10 is
> closed — the Entry create and update forms handle a unique-value `Conflict` in a
> "Could not save this Entry" dialog (gated by a new `entries.spec.ts` test, plus
> one that drives an unhandled failure to the boundary). The four delete/sync
> in-place sites were refactored onto the helper with their copy unchanged.

**The field registry emits no native constraint attributes** (with one
exception). Today the rendered inputs carry `required`/`minLength`/`maxLength`/
`min`/`max` from the definition, which is precisely what made the browser bubble
fire before `noValidate` was added. Under this design zod is the _only_ validator,
so those attributes are simply not emitted — removing the footgun's fuel, not just
its match. **Exception:** the range field's `min`/`max` on the Radix `Slider` are
its functional value domain, not HTML constraint attributes, and stay.

### Pillar 2 — a schema-driven field registry (the real win)

Two facets that share one `FieldType` spine. They are related but not one uniform
contract, because rendering and authoring live in different value spaces:
rendering keys on `FieldType` and turns a `FieldDefinition` into a `Value` input;
authoring keys on `AuthorableFieldType` (`Exclude<FieldType,'select'> |
'stringSelect' | 'numberSelect'` — `select` splits into two) and produces a
`FieldDefinition`.

```tsx
// Facet A - entry rendering. Keyed by FieldType.
interface RenderSpec {
  renderInput: (p: FieldInputProps) => ReactElement; // value/onChange/error/disabled
  translatable: boolean;                              // string & mdast are per-language
}
const RENDER_REGISTRY: Record<FieldType, RenderSpec> = { text: …, number: … };

// Facet B - definition authoring. Keyed by AuthorableFieldType.
interface DefinitionSpec<Def extends FieldDefinition> {
  resolver: Resolver<Def>;                            // built from Core's per-type schema
  makeDefaults: (ctx) => Def;                         // replaces the scattered defaults
  Extras?: (p: { form: UseFormReturn<Def> }) => ReactElement; // min/max, options, ofCollections…
  capabilities: { canBeUnique: boolean; canBeRequired: boolean };
}
const AUTHORING_REGISTRY: Partial<Record<AuthorableFieldType, DefinitionSpec<…>>> = …;
```

Making `RENDER_REGISTRY` a `Record<FieldType, …>` makes adding a Core field type
a **compile error until the entry exists** — replacing the two manually-synced
sets (`unimplementedFieldTypes`, `renderableFieldTypes`) and their "keep in sync"
comments (R2). What each facet buys:

- **Authoring** collapses the 18 `*-value-definition-form.tsx` files, both
  18-case switches, the 18 `useForm` instances, and the `useImperativeHandle`
  dispatcher into **one authoring form** whose resolver and extra controls are
  looked up by the selected type. The per-type defaults and the "can this type be
  unique/required" rules live here once, as data (R3). _This is exactly what the
  [PoC](#proof-of-concept) implements and proves._
- **Rendering** gives shared field components a **value-typed contract**
  (`value`/`onChange`/`error`/`disabled`) instead of a path-generic one. This is
  the good idea from TanStack Form (B), achieved on RHF: the path lives at the one
  `Controller` boundary; the input component only knows its value type. That
  erases most of `ui/form.tsx`'s path-cast tax (R15) and the `FormControl`-Slot
  aria defects (R10), because the contract puts `id`/`aria-*` on a real input.

The registry **relocates** the genuinely type-specific bits rather than erasing
them, and the leaks are worth naming honestly: `markdown`'s definition input and
output diverge (`MarkdownFieldDefinitionFormValues` pins the recursive
`defaultValue` to null), so its `DefinitionSpec.resolver` still carries the one
resolver cast `util.tsx` has today; `entry`/`markdown` read a TanStack-Query
Collections list (`ofCollections`) that lives entirely inside their `Extras`;
`slug`'s source picker (`ofFieldDefinitions`) needs the current sibling
definitions, which surfaced as **one** shared widening — `DefinitionExtrasProps`
now also carries `fieldDefinitions`, passed to every `Extras` and ignored by all
but slug, exactly like the `currentLanguage`/`supportedLanguages` widening
`select` made. The win is that these five complex types are the _only_ ones with
bespoke code; the other 13 become pure data. The `select` two-schema case is two
authoring entries (`stringSelect`/`numberSelect`) chosen by the option value-type
picker — no `AuthorableFieldType` widening leaking into a shared base.

### Pillar 3 — `fieldDefinitions` as a `Controller`-bound value

Replace the opaque `useFieldArray` with a **single `Controller`-bound
`fieldDefinitions` value** — one RHF field whose value is the whole
`FieldDefinitionOrGroup[]`, edited through typed helpers (add / remove / move via
dnd-kit `arrayMove`, and eventually group nesting) that produce a new array. The
critical point is the seam: because the array is bound through `Controller`, it
stays _inside_ RHF state, so everything the collection form already relies on
keeps working with no second source of truth —

- `updateCollectionSchema`'s `fieldDefinitions` super-refinements
  (`slugUniqueness`, `slugSourceReferences`) run through the resolver as before,
  because the value is in the form (R6, R12).
- `formState.isDirty` flips on a definition-only edit, so the `SubmitButton`
  dirty gate works (R8).
- `reset()`-on-load and the two historical resets in `collection-diff` hydrate it
  like any other field, so **view/diff reuse is unchanged** (R1).

Why this beats both the current `useFieldArray` and a free-floating `useReducer`:
`useFieldArray` walks the deep union and hits the instantiation-depth limit (the
reason for the opaque rows and the id-overwrite bug); a `useReducer` _outside_ RHF
would sit outside the resolver and never flip `isDirty` or reset — reintroducing a
sync problem. A `Controller` holds one opaque value RHF never introspects, so it
**sidesteps the depth limit and fixes the latent slug-source id bug** (§3: the
real UUIDs are the value; nothing overwrites them) while staying in RHF state. The
typed edit helpers give the "reducer feel" without the split. This also unblocks
group authoring and field-definition editing, both currently blocked _by_ the
opaque-row typing.

> **Landed** on `poc-form-registry` (migration step 3). `collection-form.tsx`
> binds `fieldDefinitions` through `useController` and edits it with typed
> `appendDefinition`/`removeDefinition`/`moveDefinition` helpers (reorder via
> dnd-kit `arrayMove`); the sheet and the fallback dispatcher now take the value
> array plus an `onAppend` callback. The three opaque-row `as unknown as` casts
> are gone and no `field.value` cast was needed. The slug-source id bug is closed
> and gated by E2E: a slug-source-picker test, a definition-only dirty-gate test,
> and a collection-diff render test. Group authoring and definition editing stay
> out of scope (still clearly-marked TODOs).

### How the recommendation solves each hard problem

| Hard problem                                    | Solution                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native-vs-programmatic submit (make structural) | One `AppForm` + `SubmitButton`; registry emits no native constraint attrs; imperative ref deleted (R14)                                                                                                                                                                                                                                   |
| Detached submit buttons, a11y + testable        | Spec-blessed `form={id}` behind `SubmitButton`; role/label locators unchanged (R7, R11)                                                                                                                                                                                                                                                   |
| Recursive schemas / instantiation depth         | `Controller`-bound single value for `fieldDefinitions` (RHF never walks the union); entry values embraced as `unknown` and rendered from metadata; mdast stays an opaque controlled value (R6)                                                                                                                                            |
| `z.input`/`z.output` divergence                 | Keep the doc's inference pattern (no explicit generic; `handleSubmit` yields output). Value wrappers are assembled at **reset** (via `defaultEntryValues`) and live in form state as the resolver's input shape — unchanged; the registry only decouples which input widget renders each wrapper's scalar. No submit-time assembler (R12) |
| Field arrays + reorder                          | Typed edit helpers + dnd-kit `arrayMove` over the `Controller`-bound definitions value; typed `useFieldArray` fine for flat select options (R5)                                                                                                                                                                                           |
| Translatable fields                             | One `TranslatableField` wrapper (dedupe ×3); registry marks which value types are translatable (R4)                                                                                                                                                                                                                                       |
| View-only / diff reuse                          | `mode` prop on `AppForm` (`view` disables the fieldset, drops submit); diff composes two view-mode forms (R1)                                                                                                                                                                                                                             |
| IPC error handling by `CoreError` type          | Stays at the mutation layer: a `useAppMutation(options, { handled })` helper applies the by-type predicate to `throwOnError`/`onError`; unhandled types propagate to the boundary; no blanket opt-out (R9)                                                                                                                                |

---

## Incremental migration path (strangler)

Each step is independently shippable and E2E-green; no big-bang.

1. **Land the primitives, additively.** Add `AppForm` + `SubmitButton` +
   `AppFormContext`. Adopt them in **one** simple form first (e.g. Create Project),
   behind the existing `projects.spec.ts`. No behavior change; the per-form
   `noValidate` and manual `useId` in that route are deleted.
2. **Build the field registry, prove it on the hardest form.** Implement
   `FIELD_REGISTRY` for the types the "Add Field" E2E drives (text + a few more),
   and rebuild the **Add Field sheet** on it: one authoring `AppForm`, resolver
   from the registry, submit via `SubmitButton form={sheetId}`. This is the
   [proof of concept](#proof-of-concept). Ship once `collections.spec.ts` is
   green.
3. **(Done) Move `fieldDefinitions` to the `Controller`-bound value.** Swapped
   the opaque `useFieldArray` for a single `useController`-bound value with typed
   edit helpers; deleted the three opaque-row casts; the slug-source id bug is
   closed. This step touches `collection-form.tsx`, which `collection-diff.tsx`
   reuses read-only, so it landed **behind new E2E first**: a slug-source-picker
   test (previously uncovered), a dirty-gate test on a definition-only edit, and a
   collection-diff render test. Was not covered by the PoC.
4. **(Done) Fold the entry renderer onto the registry.** `FormComponentFromFieldDefinition`
   is now a lookup into an exhaustive `RENDER_REGISTRY: Record<FieldType, RenderSpec>`
   (the RENDER facet), replacing the 18-case switch and the hand-synced
   `renderableFieldTypes` set; a new Core type is a compile error until it has an
   entry. Each `RenderSpec` is a value-typed `renderInput` leaf (id/aria land on the
   real input via `ControlledLeaf`/`useFormField`, not a Radix `Slot`) plus a
   `translatable` flag. The ×3 translatable dialog collapsed to one `TranslatableField`
   (with `TranslatableFormInputField`/`TranslatableFormTextareaField` as thin presets),
   the leaves emit no native constraint attributes (except the range Slider's domain),
   and the collection editor's `@ts-ignore` phantom-path previews became a bound-free
   `FormFieldDefinitionPreview` (real disabled input, proper label). Landed per
   field-type group behind the entry, history and accessibility specs (see the
   [render registry section](./dynamic-form-field-generation.md#the-render-registry)).
5. **(Done) Migrate remaining route forms to `AppForm`/`SubmitButton`.** All four
   shared form components (`project`/`entry`/`collection`/`asset`) and the three
   route-inline forms (Clone Project, User profile, Set remote URL) now render
   through `AppForm`, and every submit control is a `SubmitButton`. The per-form
   `noValidate`, the `<Form><form><fieldset>` boilerplate, the three async
   resolver closures, and the diff forms' no-op submit handlers are gone. Gating
   is uniform through a `<FormActions form={...}>` provider that exposes the
   reactive `isDirty`/`isSubmitting` to the detached button: pending gating
   (`isSubmitting`, spanning the awaited `mutateAsync`) is always on, which fixed
   Update Asset never gating on pending; dirty gating stays per-form intent
   (`requireDirty` on updates and Create Entry) with the create-form inconsistency
   left as pinned by the specs. Clone Project gained `zodResolver(cloneProjectSchema)`.
6. **(Done) Enable guardrails and delete dead code.** The three lint rules and the
   no-native-constraint-attributes test are in place (see [Guardrails](#guardrails))
   and each was proven to fire on an intentional violation; `getExampleFormField`,
   the commented-out preview block, and the per-type `*-value-definition-form.tsx`
   files are gone. Both registries are exhaustive `Record<FieldType, ...>` and the
   two hand-synced sets are deleted. **This closes the migration.**

Steps 1–2 are the proof that the abstraction holds (and are what the PoC
exercises). **Steps 3 and 4 are the genuinely risky ones** — they touch the
recursive `fieldDefinitions` state and the shared 1912-line renderer that diff
and preview also depend on — so each must be gated by the new E2E named above,
not treated as mechanical. The migration can pause after any step with a
coherent, shippable app.

---

## Guardrails

> **Landed** (migration step 6). The lint rules and the test below are in place in
> [`eslint.config.mjs`](../../eslint.config.mjs) and the E2E suite, and each was
> proven to fire on an intentional violation. They make the fixed bug classes hard
> to reintroduce. The compile-time guarantees (exhaustive registries, structural
> `SubmitButton`/`AppForm`) are properties of the code, not separate rules.

- **Lint: raw `<form>` outside `app-form.tsx` is an error.** A `no-restricted-syntax`
  selector `JSXOpeningElement[name.name='form']` over the renderer, with a
  flat-config `files` override exempting `components/ui/app-form.tsx`. Kills
  layout-only `<form>`s and stray submission paths (R14). Blunt by design: it
  matches the literal element, which is exactly what to ban here.
- **Lint: a literal `type="submit"` outside `app-form.tsx` is an error.** Selector
  `JSXAttribute[name.name='type'][value.value='submit']`, same app-form.tsx
  exemption (`SubmitButton` lives there). Catches the common case; a computed
  `type={var}` slips through, which is acceptable - it is a backstop, and submit
  controls should be the primitive anyway (R7, R14).
- **Lint: the whole-form laundering casts `as unknown as UseFormReturn` /
  `... as Control` are an error.** Two `no-restricted-syntax` `TSAsExpression`
  selectors (one per target type, so the config cannot fail to parse), applied as
  a **denylist across the whole renderer** rather than a positive allowlist -
  option (a) from the migration brief, so a new laundering cast anywhere in the
  renderer is caught, not only in the registry/engine files. The three shared
  `*Form` components (`project-form.tsx`, `collection-form.tsx`, `entry-form.tsx`)
  are the one **documented, tracked exception**: each views its generic form as a
  concrete `Update*Props` to address literal fields (the RHF generic-component
  path tax; the render-fold removed the leaf-input casts but not these wrapper
  ones). They are exempted by a file-scoped override, with an inline comment and a
  `@todo` at each cast site. `asset-form.tsx` needs no exemption: it stays generic
  and casts only field names (`as FieldPath<T>`), so it never launders the whole
  form. Banning globally while those three casts exist would have left a red
  baseline, which is not a guardrail; the denylist-plus-exemption keeps the tree
  green and the exception explicit. It is a backstop, not a proof: an aliased or
  single-step cast still slips through (R15).
- **Not a lint rule: "forbid `useForm` outside `components/forms`".** Rejected as
  self-contradictory - `AppForm` takes the `form` object as a _prop_, so every
  route legitimately calls `useForm` and hands it in. Centralize the _policies_ in
  `AppForm`, not the `useForm` call.
- **Type: exhaustive registries.** Both `RENDER_REGISTRY` and
  `FIELD_DEFINITION_REGISTRY` are `Record<FieldType, ...>`, so adding a Core field
  type fails to compile until both have an entry. This replaced the two
  hand-synced sets (`renderableFieldTypes`, `unimplementedFieldTypes`), which are
  gone (R2).
- **Type: `SubmitButton` sets `type="submit"` structurally**, `AppForm` owns
  `noValidate`, the `id`, and `stopPropagation` - none are props a caller can get
  wrong.
- **Registry emits no `required`/`min`/`max`/`minLength`/`maxLength`** on inputs
  (except the range Slider's functional domain, which Radix surfaces as
  `aria-valuemin`/`aria-valuemax`). An E2E test (`entries.spec.ts`) asserts a
  rendered required text and number field carry none of those attributes and that
  the range slider keeps its `aria-value*` domain, locking the footgun shut. The
  required state is instead conveyed to assistive tech through `aria-required`
  (an ARIA state, not a native constraint, so it never blocks submit) on the
  string/number scalar and select controls that accept it (`ariaRequiredFor` in
  `form.tsx`); the same E2E asserts a required field carries `aria-required` and an
  optional one does not.
- **E2E: keep asserting `aria-invalid` and axe**, with coverage for the authoring
  paths (slug source, select options, non-text field types) that moved onto the
  registry.

---

## Risks

- **Core-schema coupling.** The registry must track Core's 18 types and their
  per-type option shapes. This coupling already exists (two synced sets, 18
  useForms); the registry _consolidates_ it to one exhaustive table, so drift
  becomes a compile error rather than a runtime `throw`. Risk: **reduced**.
- **Recursive schemas.** The `Controller`-bound value sidesteps RHF's instantiation-depth limit
  for `fieldDefinitions`; mdast stays an opaque controlled value behind its
  editor adapter (unchanged). We do **not** try to make RHF type the recursive
  union. Risk: **contained**.
- **IPC boundary.** Unchanged: submissions still go through TanStack Query
  mutations to `window.ipc`; `AppForm.onSubmit` calls `mutateAsync`. No new
  coupling. `CoreError`-by-type handling stays at the mutation layer via
  `useAppMutation`, exactly as the 4 existing in-place sites do today (R9). Risk:
  **low**.
- **Accessibility.** The value-typed field contract puts `id`/`aria-*` on a real
  input by construction, fixing the current `FormControl`-Slot defects — but the
  migration must not regress the axe-clean routes. Mitigation: migrate one form
  at a time behind `expectNoAxeViolations`. Risk: **low with discipline**.
- **E2E.** The suite is semantic (role/label), so DOM restructuring is safe as
  long as labels/roles/copy hold. The known Slot+Fragment label-association break
  in the appended-definition preview is an opportunity to _fix_ (the registry
  gives it a real label), improving a test that currently counts text. Risk:
  **low; net improvement**.
- **Bundle size.** Recommendation A adds **no dependency** (delta ~0). TanStack
  Form (B) would be +5 kB gzip; JSONForms/RJSF (D) much more. Risk: **none for A**.
- **Migration fatigue.** The strangler has 6 steps; the temptation is to stop
  half-migrated with two form systems coexisting. Mitigation: the guardrail lint
  rules only turn on at step 6, and each step is individually shippable, so
  "half-migrated" is still coherent.

---

## Proof of concept

The single hardest form — the field-definition **"Add Field" sheet** — rebuilt
in the recommended architecture on an isolated git worktree (branch
`poc-form-registry` off `add-e2e-tests`), so the working branch is untouched. It
exercises Pillars 1 and 2; Pillar 3 (`fieldDefinitions` as a `Controller`-bound
value) is deliberately out of scope so the two migrations stay independent.

### What was built

| File                                                          |     Lines | What                                                                                                                                                                                                                   |
| ------------------------------------------------------------- | --------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/renderer/components/ui/app-form.tsx`                     |       135 | `AppForm` + `SubmitButton` primitives                                                                                                                                                                                  |
| `src/renderer/components/forms/field-definition-draft.tsx`    |       229 | the shared engine: `DefinitionSpec`, the one generic `DefinitionDraft` form, and the value-typed field helpers (`DefaultValueInputField` parameterized by Core field type, `MinMaxRow` with an optional/required flag) |
| `src/renderer/components/forms/field-definition-defaults.ts`  |        25 | `baseDefaults` (the shared-fields factory), in a component-free module                                                                                                                                                 |
| `src/renderer/components/forms/field-definition-registry.tsx` |       409 | the map: scalar specs (`text`, `textarea`, `number`, `toggle`, `email`, `date`, `datetime`, `time`, `url`, `telephone`, `ipv4`, `range`) as data + the `select` entry                                                  |
| `src/renderer/components/forms/select-field-definition.tsx`   |       533 | `select` authoring: two specs (`stringSelect`/`numberSelect`), their option-array `Extras`, and the value-type picker                                                                                                  |
| `src/renderer/components/forms/add-field-sheet.tsx`           |       198 | the sheet, self-contained: registry-driven `AppForm` + detached `SubmitButton`, falling back to the dispatcher for the rest                                                                                            |
| `src/renderer/components/forms/collection-form.tsx`           | 458 → 342 | the inline Sheet + `useRef` + `useImperativeHandle` wiring replaced by `<AddFieldSheet>` (−116 lines)                                                                                                                  |

### How it behaves (verified in the packaged app + E2E)

- **One submission model.** The sheet footer's "Add definition" is a real
  `SubmitButton type="submit" form={sheetId}`; the authoring form is a real
  `AppForm` with its own `onSubmit`. The `useImperativeHandle`/`forwardRef`
  `addDefinition()` dispatch is gone for migrated types.
- **The nested-form footgun was real and is now closed.** First run: clicking
  "Add definition" appended the field **and created the whole Collection** — the
  inner form's `submit` bubbled up the _React tree_ (portals bubble by React
  hierarchy, not DOM) to the Collection form's `onSubmit`. Fix: `AppForm` calls
  `event.stopPropagation()`. This is exactly the class of bug the primitive is
  meant to absorb once; a hand-written nested form would hit it every time.
- **One live form, not 18.** `DefinitionDraft` is keyed by the selected field
  type, so switching the picker remounts a single `useForm` with the right
  resolver and defaults — replacing the 18 always-mounted `useForm` instances.
- **Cast tax dropped.** `AppForm`: 0 casts. The registry: **2** casts, both the
  "assert once" generic tax (`as DefaultValues<Def>`, `as FieldPath<Def>` for the
  `slug` path), replacing the old `util.tsx` dispatcher's resolver-laundering and
  per-type path casts. `add-field-sheet.tsx` keeps **1** opaque-row cast, which is
  inherited from the still-`useFieldArray`-backed collection field array and
  disappears with Pillar 3. The 13 trivial field types become pure data
  (`resolver` + `makeDefaults` + optional `Extras`).
- **`pnpm check` clean** on the new/edited files (web type-check 0 errors, eslint
  0 errors — including react-refresh — prettier clean).

### `select`: the first complex type — collapse or relocate?

The adversarial review's sharpest doubt was that the registry would only
_relocate_ complex types' special-casing, not collapse it. `select` is the test:
one Core `fieldType` backed by **two** schemas (`stringSelect`/`numberSelect`), a
value-type picker, an **options field array**, and translatable option labels.
Migrating it end to end gave a genuinely mixed, honest answer:

- **What generalized cleanly (evidence of collapse).** The two-schema case is two
  `DefinitionSpec`s and one entry component that keys the active draft — no
  `select` special-casing leaks into the shared base or the sheet. The sheet's
  detached `SubmitButton` submits whichever variant is active with **no wiring
  change**. The migration added **zero casts** (`select-field-definition.tsx`: 0),
  versus the old path's second `useForm`-per-render, `selectValueType` state, and
  `select`-specific `case`s in both of `util.tsx`'s 18-way switches. The imperative
  dispatch and the two-schema submit branching are gone.
- **What the contract had to grow (a real, contained leak).** Select's option
  labels are translatable, so its `Extras` needs the language context the scalar
  `Extras` never used. This surfaced as one widening: `DefinitionExtrasProps` now
  carries `currentLanguage` + `supportedLanguages`, passed to every `Extras`
  (scalars ignore them). One prop on one shared type — not a `select` branch — so
  it generalizes, but it _is_ a place the abstraction had to give.
- **LOC is honest, not magical.** The 13 trivial types collapsed to data; `select`
  did **not** shrink (533 lines vs the old 481, and it _added_ the option UI's
  missing `sr-only` labels). Its irreducible complexity is the option-array UI.
  The win for a complex type is **architectural, not line-count**: one submission
  model, zero casts, self-contained in one file, and no entanglement with a shared
  dispatcher. Expect `slug`/`asset`/`entry`/`markdown` to behave the same way —
  they relocate cleanly and drop their cross-cutting wiring, but their bespoke UI
  stays roughly its current size.
- **Bonus a11y win.** The old option rows had no accessible names (a documented
  gap); the migrated rows carry `sr-only` labels ("Option N label/value", "Remove
  option N"), which is also what makes them E2E-addressable by role/name.

### E2E outcome

`collections.spec.ts` drives the sheet directly (text add, duplicate-slug reject
via `aria-invalid` + sheet-stays-open, min>max reject, a full `select` authoring
flow, and the newly-migrated scalars: a `range` add exercising its required
default/min/max Extras and a `date` add exercising the bespoke-picker Extras path
— each picks the type, fills the base, adds, then creates the Collection so Core
validates the definition). Against the packaged PoC build:

- **`collections.spec.ts`: 10/10 pass** — behavior parity with the old sheet plus
  the `select`, `range` and `date` flows (one iteration needed: the `sr-only`
  label carries an "- optional" suffix, so the locator matches by prefix like the
  bounds labels).
- **`collections` + `entries` + `history`/diff + `accessibility`: 23/23 pass** —
  the file restructure and the `select`/scalar migrations do not regress the
  forms that reuse `collection-form.tsx` read-only (diff/history), the entry
  forms, or the axe-enforced Projects route.

### What the PoC does **not** prove

- ~~Pillar 3 (the `Controller`-bound `fieldDefinitions`)~~ — landed since as
  migration step 3, closing the slug-source id bug. Group authoring and
  definition editing remain open.
- The entry-renderer fold (step 4) inside `form.tsx`.
- ~~The four remaining complex authoring types (`slug`, `markdown`, `asset`,
  `entry`) still use the existing dispatcher via the fallback.~~ — landed since:
  each authors through its own registry file (`slug-field-definition.tsx`,
  `asset-field-definition.tsx`, `entry-field-definition.tsx`,
  `markdown-field-definition.tsx`), so **all 18 authorable types are registered**
  and only `dynamic` stays disabled. `slug` reads its sibling sources through the
  one `fieldDefinitions` contract widening; `entry`/`markdown` keep their
  Collections query inside their `Extras`; `markdown` carries the single resolver
  cast. Authoring for each is gated by a new E2E in `collections.spec.ts` (asset,
  entry-with-restriction, markdown feature toggles), and the pre-existing
  slug-source test now drives the registry path. ~~The `util.tsx` dispatcher and
  the `*-value-definition-form.tsx` files are now dead but still present; deleting
  them (with `getExampleFormField` and the sheet's fallback branch) is the next
  step.~~ — done since: the dispatcher, the 17 per-type files,
  `getExampleFormField` and the sheet's fallback branch are deleted, and
  `FIELD_DEFINITION_REGISTRY` is now an exhaustive `Record<FieldType, ...>` (with a
  non-interactive `dynamic` entry) that is the single authoring path.

---

## Sources

Versions and behavior verified 2026-07-16 against official sources:

- react-hook-form 7.81.0 (2026-07-05), `@hookform/resolvers` 5.4.0 — zod 4 native
  since 5.1.0, Standard Schema resolver, `useForm<In, Ctx, Out>` pattern; recursion
  "excessively deep" is a closed _design limitation_ (#11971); generic-component
  `Path<T>` is a known limitation.
- `@tanstack/react-form` 1.33.2 (2026-07-13) — `onSubmit` receives raw input not
  output; recursion issues #1484/#1553 open; `createFormHook` composition.
- React 19 `<form action>` / `useActionState` / `useFormStatus` — FormData +
  uncontrolled + Server Functions model.
- Conform — FormData-centric; no rich-object round-trip.
- zod 4.4.3 — Standard Schema v1 compliant (`~standard` on every schema),
  `toJSONSchema` present but lossy on `.pipe`/`.transform`; recursion via getters,
  not `z.lazy`.
- HTML spec (MDN) — `formnovalidate` on a submit button and `form="id"`
  association are the blessed detached-submit mechanisms.
- Core `@elek-io/core` 0.21.0 — generated entry `values` is a `.pipe` whose input
  is `{ [x]: unknown }`; 18 field types; `fieldDefinitionSchema` is a plain union
  (not discriminated); exports `fieldDefinitionSlugUniquenessSuperRefinement`,
  `flattenFieldDefinitions`, `slug()`.

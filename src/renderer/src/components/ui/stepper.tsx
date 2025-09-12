import clsx from 'clsx';
import { Check } from 'lucide-react';
import { Fragment, useEffect, useState, type ReactElement } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Separator } from './separator';

interface StepperIndicatorProps {
  steps: {
    title: string;
  }[];
  activeStep: number;
}

const StepperIndicator = ({
  activeStep,
  steps,
}: StepperIndicatorProps): ReactElement => {
  return (
    <div className="flex justify-center items-center text-sm text-zinc-800 dark:text-zinc-200">
      {steps.map((step, stepIndex) => (
        <Fragment key={stepIndex}>
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'w-[40px] h-[40px] flex justify-center items-center m-[5px] border-[2px] border-zinc-800 dark:border-zinc-200 rounded-full',
                stepIndex + 1 < activeStep && 'bg-brand-600',
                stepIndex + 1 === activeStep &&
                  '!border-brand-600 !dark:border-brand-600'
              )}
            >
              {stepIndex + 1 >= activeStep ? (
                stepIndex + 1
              ) : (
                <Check className="h-5 w-5" />
              )}
            </div>
            {step.title}
          </div>

          {stepIndex + 1 !== steps.length && (
            <Separator
              orientation="horizontal"
              className={clsx(
                'w-[100px] h-[2px]',
                stepIndex + 1 <= activeStep - 1 &&
                  'bg-brand-600 dark:bg-brand-600'
              )}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

interface StepperFormProps {
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  steps: {
    title: string;
    content: ReactElement;
  }[];
}

const StepperForm = (props: StepperFormProps): ReactElement => {
  const [erroredInputName, setErroredInputName] = useState('');
  const methods = useForm<StepperFormValues>({
    mode: 'onTouched',
  });

  const {
    trigger,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = methods;

  // focus errored input on submit
  useEffect(() => {
    const erroredInputElement =
      document.getElementsByName(erroredInputName)?.[0];
    if (erroredInputElement instanceof HTMLInputElement) {
      erroredInputElement.focus();
      setErroredInputName('');
    }
  }, [erroredInputName]);

  const onSubmit = async (formData: StepperFormValues) => {
    console.log({ formData });
    // simulate api call
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        // resolve({
        //   title: "Success",
        //   description: "Form submitted successfully",
        // });
        reject({
          message: 'There was an error submitting form',
          // message: "Field error",
          // errorKey: "fullName",
        });
      }, 2000);
    }).catch(({ message: errorMessage, errorKey }) => {
      // if (
      //   errorKey &&
      //   Object.values(STEPPER_FORM_KEYS)
      //     .flatMap((fieldNames) => fieldNames)
      //     .includes(errorKey)
      // ) {
      //   let erroredStep: number;
      //   // get the step number based on input name
      //   for (const [key, value] of Object.entries(STEPPER_FORM_KEYS)) {
      //     if (value.includes(errorKey as never)) {
      //       erroredStep = Number(key);
      //     }
      //   }
      //   // set active step and error
      //   setActiveStep(erroredStep);
      //   setError(errorKey as StepperFormKeysType, {
      //     message: errorMessage,
      //   });
      //   setErroredInputName(errorKey);
      // } else {
      //   setError('root.formError', {
      //     message: errorMessage,
      //   });
      // }
    });
  };

  return (
    <div>
      {errors.root?.formError && (
        <Alert variant="destructive" className="mt-[28px]">
          <AlertTitle>Form Error</AlertTitle>
          <AlertDescription>{errors.root?.formError?.message}</AlertDescription>
        </Alert>
      )}
      <FormProvider {...methods}>
        <form noValidate>{props.steps.at(props.activeStep - 1)?.content}</form>
      </FormProvider>
    </div>
  );
};

export { StepperForm, StepperIndicator };

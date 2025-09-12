import { type FieldType } from '@elek-io/core';
import clsx from 'clsx';
import { AxeIcon, Plus } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { InputFromFieldType } from '../forms/util';
import { Button } from './button';
import { Card, CardDescription, CardHeader, CardTitle } from './card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { ScrollArea, ScrollBar } from './scroll-area';
import { StepperForm, StepperIndicator } from './stepper';

export type FieldTypeDisplay = {
  type: FieldType;
  icon: ReactElement;
  title: string;
  description: string;
  value: string | number | boolean;
};

const fieldTypesToDisplay: FieldTypeDisplay[] = [
  {
    type: 'text',
    icon: <AxeIcon />,
    title: 'Text Field',
    description: 'Single line input field for entering simple, short text',
    value: 'Lorem Ipsum',
  },
  {
    type: 'textarea',
    icon: <AxeIcon />,
    title: 'Text Area Field',
    description:
      'Multi-line input field for entering longer text and allows for line breaks',
    value:
      'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
  },
  {
    type: 'email',
    icon: <AxeIcon />,
    title: 'Email Field',
    description: 'Input field for entering an email address',
    value: 'user@example.com',
  },
  {
    type: 'url',
    icon: <AxeIcon />,
    title: 'URL Field',
    description: 'Input field for entering a URL',
    value: 'https://www.example.com',
  },
  {
    type: 'ipv4',
    icon: <AxeIcon />,
    title: 'IPv4 Field',
    description: 'Input field for entering an IPv4 address',
    value: '192.168.1.1',
  },
  {
    type: 'date',
    icon: <AxeIcon />,
    title: 'Date Field',
    description: 'Input field for entering a date',
    value: '2023-03-15',
  },
  {
    type: 'time',
    icon: <AxeIcon />,
    title: 'Time Field',
    description: 'Input field for entering a time',
    value: '12:00 PM',
  },
  {
    type: 'datetime',
    icon: <AxeIcon />,
    title: 'Date & Time Field',
    description: 'Input field for entering a date and time',
    value: '2023-03-15T12:00:00',
  },
  {
    type: 'telephone',
    icon: <AxeIcon />,
    title: 'Telephone Field',
    description: 'Input field for entering a telephone number',
    value: '123-456-7890',
  },
  {
    type: 'number',
    icon: <AxeIcon />,
    title: 'Number Field',
    description: 'Input field for entering a number',
    value: 42,
  },
  {
    type: 'range',
    icon: <AxeIcon />,
    title: 'Range Field',
    description: 'Input field for selecting a value from a range',
    value: 33,
  },
  {
    type: 'toggle',
    icon: <AxeIcon />,
    title: 'Toggle Field',
    description: 'Input field for toggling between two states',
    value: true,
  },
  {
    type: 'asset',
    icon: <AxeIcon />,
    title: 'Asset Field',
    description: 'Input field for selecting an Asset',
    value: 'asset-id-123',
  },
  {
    type: 'entry',
    icon: <AxeIcon />,
    title: 'Entry Field',
    description: 'Input field for selecting an Entry',
    value: 'entry-id-123',
  },
];

type Step1SelectFieldTypeProps = {
  selectedFieldType: FieldType;
  setSelectedFieldType: React.Dispatch<React.SetStateAction<FieldType>>;
};

const Step1SelectFieldType = (
  props: Step1SelectFieldTypeProps
): ReactElement => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {fieldTypesToDisplay.map((fieldType) => {
        return (
          <Card
            key={fieldType.type}
            className={clsx(
              'hover:shadow-lg hover:dark:border-zinc-200 cursor-pointer overflow-hidden',
              props.selectedFieldType === fieldType.type && '!border-brand-600'
            )}
            onClick={() => props.setSelectedFieldType(fieldType.type)}
          >
            <CardHeader>
              <div className="flex items-center">
                <div className="w-[60%] mr-6">
                  <CardTitle>{fieldType.title}</CardTitle>
                  <CardDescription>{fieldType.description}</CardDescription>
                </div>
                <div className="w-48 -mr-24">
                  <InputFromFieldType
                    fieldType={fieldType.type}
                    value={fieldType.value}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
};

type Step2DescribeFieldProps = {
  selectedFieldType: FieldType;
};

const Step2DescribeField = (props: Step2DescribeFieldProps): ReactElement => {
  return (
    <div className="flex">
      <div>Left ({props.selectedFieldType})</div>
      <div>Right</div>
    </div>
  );
};

const Wizard = (): ReactElement => {
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text');
  const steps = [
    {
      title: 'Select Field Type',
      content: (
        <Step1SelectFieldType
          selectedFieldType={selectedFieldType}
          setSelectedFieldType={setSelectedFieldType}
        />
      ),
    },
    {
      title: 'Describe Field',
      content: <Step2DescribeField selectedFieldType={selectedFieldType} />,
    },
    {
      title: 'Set Validations',
      content: <div>Step 3</div>,
    },
  ];
  const [activeStep, setActiveStep] = useState(1);

  const handleNext = (): void => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = (): void => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2"></Plus>
          Add Field
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Add a Field to this Collection</DialogTitle>
          <DialogDescription>
            Adding Fields to your Collection will enable users to enter data
            that follows the boundaries you&apos;ve set.
          </DialogDescription>
          <StepperIndicator steps={steps} activeStep={activeStep} />
        </DialogHeader>

        <div className="flex h-full overflow-hidden">
          <ScrollArea>
            <div className="p-6">
              <StepperForm
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                steps={steps}
              />
            </div>

            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={activeStep === 1}
          >
            Back
          </Button>
          {activeStep === steps.length ? (
            <Button onClick={handleSubmit(onSubmit)}>Add Field</Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { Wizard };

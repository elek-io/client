'use client';

import { cn } from '@renderer/util';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DatePickerProps {
  date: Date;
  setDate: Dispatch<SetStateAction<Date>>;
}

const DatePicker = ({ date, setDate }: DatePickerProps): JSX.Element => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(_day, selectedDay) => setDate(selectedDay)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
DatePicker.displayName = 'DatePicker';

export { DatePicker };

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import ClearButton from "./clear-button";

interface DateTimePickerProps {
  id?: string;
  date?: Date;
  onDateTimeChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

export default function DateTimePicker({
  id,
  date,
  onDateTimeChange,
  placeholder = "Pick a date and time",
  disabled = false,
  className,
  allowClear = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    date,
  );
  const [timeValue, setTimeValue] = React.useState<string>(
    date ? format(date, "HH:mm") : "12:00",
  );

  React.useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setTimeValue(format(date, "HH:mm"));
    }
  }, [date]);

  const handleTimeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const time = event.target.value;
      setTimeValue(time);

      if (!selectedDate) return;

      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);

      onDateTimeChange?.(newDate);
    },
    [selectedDate, onDateTimeChange],
  );

  const handleDateSelect = React.useCallback(
    (newDate: Date | undefined) => {
      if (!newDate) {
        setSelectedDate(undefined);
        onDateTimeChange?.(undefined);
        return;
      }

      const [hours, minutes] = timeValue.split(":").map(Number);
      newDate.setHours(hours, minutes, 0, 0);

      setSelectedDate(newDate);
      onDateTimeChange?.(newDate);
    },
    [timeValue, onDateTimeChange],
  );

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "flex-1 justify-start text-left font-normal relative",
              !selectedDate && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
          >
            <>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>{placeholder}</span>
              )}
              <ClearButton
                onClear={() => {
                  setSelectedDate(undefined);
                  onDateTimeChange?.(undefined);
                }}
                visible={allowClear && !!date}
              />
            </>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            id={id}
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        disabled={disabled || !selectedDate}
        className="w-32"
      />
    </div>
  );
}

import { useMemo, useState } from "react";
import ChevronDownIcon from "../icons/chevron-down";
import { AvailableTimeSlots, TimeSlot } from "@/types";
import { formatDayName, formatShortDate, formatTimeSlot } from "@/utils/format";

export interface DateTimePickerProps {
  value?: Partial<TimeSlot>;
  onChange: (value: Partial<TimeSlot>) => void;
  slots: AvailableTimeSlots[];
}

function DateTimePicker({ value, onChange, slots }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value?.date);
  const [selectedTime, setSelectedTime] = useState(value?.time);
  const [isExpanded, setIsExpanded] = useState(!!value?.date && !!value.time);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
    setIsExpanded(true);
    onChange({ date });
  };

  const handleTimeSelect = (time: TimeSlot["time"]) => {
    setSelectedTime(time);
    onChange({
      date: selectedDate,
      time,
    });
  };

  const toggleExpand = () => {
    if (!isExpanded && !selectedDate && slots.length > 0) {
      handleDateSelect(slots[0].date);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const timeSlots = useMemo(() => {
    const dateSlot = slots.find(
      (slot) => slot.date.toDateString() === selectedDate?.toDateString()
    );
    return dateSlot?.slots || [];
  }, [slots, selectedDate]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-4 overflow-x-auto">
        {slots.map(({ date }, index) => {
          const dayName = formatDayName(date);
          const shortDate = formatShortDate(date);
          const isSelected =
            selectedDate?.toDateString() === date.toDateString();

          return (
            <button
              type="button"
              key={index}
              onClick={() => handleDateSelect(date)}
              className={`flex flex-none basis-16 flex-col justify-center items-center gap-2 px-1 py-2.5 font-medium relative rounded-lg ${
                isSelected ? "text-primary-gradient bg-highlight" : ""
              }`}
            >
              <span className="text-center text-xs whitespace-nowrap opacity-50">
                {dayName}
              </span>
              <span className="text-center text-base">{shortDate}</span>
            </button>
          );
        })}
      </div>

      <div
        className={`grid grid-cols-4 gap-3 px-4 overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100 pt-4" : "max-h-0 opacity-0"
        }`}
      >
        {timeSlots.map((time, timeIndex) => {
          const formattedTime = formatTimeSlot(time);
          const isSelected =
            selectedTime?.hour === time.hour &&
            selectedTime?.half === time.half;

          return (
            <button
              type="button"
              key={timeIndex}
              onClick={() => handleTimeSelect(time)}
              disabled={!time.isAvailable}
              className={`flex items-center justify-center rounded-3xl h-8 text-center text-sm ${
                isSelected ? "bg-primary-gradient text-white" : "bg-background"
              } ${!time.isAvailable ? "opacity-25 cursor-not-allowed" : ""}`}
            >
              {formattedTime}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={toggleExpand}
        className="flex justify-center items-center h-12"
      >
        <ChevronDownIcon
          className={`transition-transform duration-300 ${isExpanded ? "" : "rotate-180"}`}
        />
      </button>
    </div>
  );
}

export default DateTimePicker;

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface BookingPanelCalendarProps {
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  otherDate?: Date | null;
  mode: 'checkin' | 'checkout';
  blockedRanges: { start: Date; end: Date }[];
}

export function BookingPanelCalendar({
  onClose,
  onDateSelect,
  selectedDate,
  otherDate,
  mode,
  blockedRanges,
}: BookingPanelCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isPastDate = (date: Date) => {
    return date < today;
  };

  const isDateInBlockedRange = (date: Date) => {
    return blockedRanges.some((range) => {
      const rangeStart = new Date(range.start);
      const rangeEnd = new Date(range.end);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(0, 0, 0, 0);
      return date >= rangeStart && date <= rangeEnd;
    });
  };

  const isDateDisabled = (date: Date) => {
    if (isPastDate(date)) return true;
    if (isDateInBlockedRange(date)) return true;

    // If selecting checkout and we have a checkin, block dates that would overlap blocked ranges
    if (mode === 'checkout' && otherDate) {
      const checkIn = new Date(otherDate);
      checkIn.setHours(0, 0, 0, 0);
      
      // Check if there's a blocked range between checkin and this date
      for (const range of blockedRanges) {
        const rangeStart = new Date(range.start);
        rangeStart.setHours(0, 0, 0, 0);
        
        if (rangeStart > checkIn && rangeStart <= date) {
          return true;
        }
      }
    }

    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onDateSelect(date);
    onClose();
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const renderMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);

    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = isSameDay(currentDate, today);
      const isSelected = isSameDay(currentDate, selectedDate);
      const disabled = isDateDisabled(currentDate);
      const blocked = isDateInBlockedRange(currentDate);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(currentDate)}
          disabled={disabled}
          className={`h-10 flex items-center justify-center text-sm relative rounded-full transition-colors
            ${disabled ? 'text-[#BBBBBB] cursor-not-allowed' : 'cursor-pointer'}
            ${blocked ? 'relative' : ''}
            ${isSelected ? 'bg-[#FF385C] text-white font-semibold z-10' : ''}
            ${!isSelected && !disabled ? 'hover:border-2 hover:border-[#222222]' : ''}
            ${isToday && !isSelected ? 'font-bold underline' : ''}
          `}
        >
          {blocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[1px] h-full bg-[#BBBBBB] rotate-45" />
            </div>
          )}
          <span className="relative z-10">{day}</span>
        </button>
      );
    }

    return (
      <div className="w-full">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
            <div
              key={i}
              className="text-center text-xs font-semibold text-[#717171] h-8 flex items-center justify-center"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-2xl border border-[#EBEBEB] p-6 z-50 w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#222222]" />
        </button>

        <div className="text-center font-bold text-base text-[#222222]">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-[#222222]" />
        </button>
      </div>

      {/* Calendar */}
      {renderMonth()}

      {/* Close button */}
      <div className="flex justify-end mt-4 pt-4 border-t border-[#EBEBEB]">
        <button
          onClick={onClose}
          className="text-[#717171] text-sm font-semibold hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  );
}
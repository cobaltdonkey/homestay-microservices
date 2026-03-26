import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  onClose: () => void;
  onDatesSelected: (checkIn: Date | null, checkOut: Date | null) => void;
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
}

export function DatePicker({ onClose, onDatesSelected, initialCheckIn, initialCheckOut }: DatePickerProps) {
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn || null);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
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

  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    return date > checkIn && date < checkOut;
  };

  const isInHoverRange = (date: Date) => {
    if (!checkIn || checkOut || !hoveredDate) return false;
    const start = checkIn < hoveredDate ? checkIn : hoveredDate;
    const end = checkIn < hoveredDate ? hoveredDate : checkIn;
    return date > start && date < end;
  };

  const isPastDate = (date: Date) => {
    return date < today;
  };

  const handleDateClick = (date: Date) => {
    if (isPastDate(date)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // First click or reset
      setCheckIn(date);
      setCheckOut(null);
    } else {
      // Second click
      if (date < checkIn) {
        // If clicked date is before check-in, set it as new check-in
        setCheckOut(checkIn);
        setCheckIn(date);
      } else {
        setCheckOut(date);
      }
    }
  };

  const handleClear = () => {
    setCheckIn(null);
    setCheckOut(null);
  };

  const handleClose = () => {
    onDatesSelected(checkIn, checkOut);
    onClose();
  };

  const renderMonth = (monthOffset: number) => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + monthOffset);
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);

    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isToday = isSameDay(currentDate, today);
      const isCheckInDate = isSameDay(currentDate, checkIn);
      const isCheckOutDate = isSameDay(currentDate, checkOut);
      const inRange = isInRange(currentDate);
      const inHover = isInHoverRange(currentDate);
      const past = isPastDate(currentDate);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(currentDate)}
          onMouseEnter={() => setHoveredDate(currentDate)}
          onMouseLeave={() => setHoveredDate(null)}
          disabled={past}
          className={`h-12 flex items-center justify-center text-base relative rounded-full transition-colors
            ${past ? 'text-[#BBBBBB] cursor-not-allowed' : 'cursor-pointer'}
            ${isCheckInDate || isCheckOutDate ? 'bg-[#FF385C] text-white font-semibold z-10' : ''}
            ${inRange || inHover ? 'bg-[#FFE4EC]' : ''}
            ${!isCheckInDate && !isCheckOutDate && !past ? 'hover:border-2 hover:border-[#222222]' : ''}
            ${isToday && !isCheckInDate && !isCheckOutDate ? 'font-bold underline' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="flex-1">
        <div className="text-center font-bold text-lg text-[#222222] mb-6">
          {monthNames[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-sm font-semibold text-[#717171] h-10 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
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

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-white rounded-2xl shadow-2xl border border-[#EBEBEB] p-8 z-50 w-[900px]">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#222222]" />
        </button>
        
        <div className="flex gap-12 px-4">
          {renderMonth(0)}
          {renderMonth(1)}
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-[#222222]" />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-[#EBEBEB]">
        <button
          onClick={handleClear}
          className="text-[#717171] text-base font-semibold hover:underline"
        >
          Clear dates
        </button>
        <button
          onClick={handleClose}
          className="bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold px-8 py-3 rounded-full transition-colors text-base"
        >
          Close
        </button>
      </div>
    </div>
  );
}
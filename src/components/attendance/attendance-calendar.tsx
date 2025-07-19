
'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import type { Shift } from '@/lib/types';
import { format, startOfDay, isBefore, endOfMonth, parseISO } from 'date-fns';

type AttendanceCalendarProps = {
  shifts: Shift[];
  selectedCrewRoleId: string;
  selectedProjectId: string;
  onDateClick: (date: Date) => void;
};

export function AttendanceCalendar({ shifts, selectedCrewRoleId, selectedProjectId, onDateClick }: AttendanceCalendarProps) {
  const [month, setMonth] = useState(new Date());

  const memberShifts = useMemo(() => {
    return shifts.filter(shift => shift.crewId === selectedCrewRoleId && shift.projectId === selectedProjectId);
  }, [shifts, selectedCrewRoleId, selectedProjectId]);

  const markedDaysSet = useMemo(() => {
    return new Set(memberShifts.map(shift => shift.date));
  }, [memberShifts]);

  const markedDays = useMemo(() => {
    return Array.from(markedDaysSet).map(dateStr => startOfDay(parseISO(dateStr)));
  }, [markedDaysSet]);

  const handleDayClick = (day: Date | undefined, modifiers: any) => {
    if (day && !modifiers.disabled) {
      onDateClick(day);
    }
  };

  const today = startOfDay(new Date());
  
  const unmarkedDays = useMemo(() => {
    const firstDay = startOfDay(new Date(month.getFullYear(), month.getMonth(), 1));
    const lastDay = endOfMonth(month);
    const daysInMonth = [];

    let dayIterator = new Date(firstDay);
    while(dayIterator <= lastDay) {
        if (isBefore(dayIterator, today) && !markedDaysSet.has(format(dayIterator, 'yyyy-MM-dd'))) {
            daysInMonth.push(new Date(dayIterator));
        }
        dayIterator.setDate(dayIterator.getDate() + 1);
    }
    return daysInMonth;
  }, [month, today, markedDaysSet]);

  return (
    <Calendar
      mode="single"
      onSelect={handleDayClick}
      month={month}
      onMonthChange={setMonth}
      className="w-full flex justify-center"
      modifiers={{
        marked: markedDays,
        unmarked: unmarkedDays
      }}
      modifiersStyles={{
        marked: {
          backgroundColor: 'hsl(var(--primary) / 0.2)',
          color: 'hsl(var(--primary-foreground))',
          fontWeight: 'bold',
        },
        unmarked: {
          backgroundColor: 'hsl(var(--destructive) / 0.2)',
          color: 'hsl(var(--destructive))',
        },
      }}
      disabled={{ after: new Date() }}
    />
  );
}

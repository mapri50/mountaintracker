"use client";

import { useState, useMemo } from "react";
import { Tour } from "@prisma/client";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Mountain,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ACTIVITY_STYLES, ACTIVITY_LABELS } from "@/lib/constants";

interface TourCalendarProps {
  tours: Tour[];
  onDateClick?: (date: Date, tours: Tour[]) => void;
  onTourClick?: (tour: Tour) => void;
}

export function TourCalendar({
  tours,
  onDateClick,
  onTourClick,
}: TourCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Group tours by date
  const toursByDate = useMemo(() => {
    const grouped = new Map<string, Tour[]>();
    tours.forEach((tour) => {
      if (tour.plannedDate) {
        const dateKey = new Date(tour.plannedDate).toISOString().split("T")[0];
        if (!grouped.has(dateKey)) {
          grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(tour);
      }
    });
    return grouped;
  }, [tours]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startingDayOfWeek + 1;
      const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;

      if (isValidDay) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          dayNumber
        );
        const dateKey = date.toISOString().split("T")[0];
        const dayTours = toursByDate.get(dateKey) || [];
        const isToday = new Date().toDateString() === date.toDateString();
        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

        days.push(
          <div
            key={i}
            className={cn(
              "min-h-[120px] p-2 border border-gray-200 cursor-pointer transition-all duration-200",
              isToday && "bg-blue-50 border-blue-400 border-2",
              isPast && "bg-gray-50",
              dayTours.length > 0 && "hover:bg-mountain-50",
              dayTours.length === 0 && "hover:bg-gray-50"
            )}
            onClick={() => onDateClick?.(date, dayTours)}
          >
            <div
              className={cn(
                "font-semibold text-sm mb-1",
                isToday && "text-blue-600",
                isPast && "text-gray-400"
              )}
            >
              {dayNumber}
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-[75px]">
              {dayTours.map((tour) => {
                const activityColor =
                  ACTIVITY_STYLES[tour.activity]?.backgroundColor || "#6b7280";
                return (
                  <div
                    key={tour.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTourClick?.(tour);
                    }}
                    className="group relative cursor-pointer"
                    title={`${tour.name}${
                      tour.elevation ? ` • ${tour.elevation}m` : ""
                    }${tour.location ? ` • ${tour.location}` : ""}`}
                  >
                    <div
                      className="text-xs px-2 py-1.5 rounded-md text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                      style={{ backgroundColor: activityColor }}
                    >
                      <div className="flex items-center gap-1">
                        <Mountain className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate flex-1">{tour.name}</span>
                      </div>
                      {tour.elevation && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-90">
                          <TrendingUp className="w-2.5 h-2.5" />
                          <span>{tour.elevation}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      } else {
        days.push(
          <div
            key={i}
            className="min-h-[100px] p-2 border border-gray-200 bg-gray-50"
          />
        );
      }
    }

    return days;
  };

  const totalPlannedTours = tours.filter((t) => t.plannedDate).length;
  const toursThisMonth = Array.from(toursByDate.values())
    .flat()
    .filter((tour) => {
      const tourDate = new Date(tour.plannedDate!);
      return (
        tourDate.getMonth() === currentDate.getMonth() &&
        tourDate.getFullYear() === currentDate.getFullYear()
      );
    }).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-mountain-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button onClick={goToToday} variant="secondary" size="sm">
            Today
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{toursThisMonth}</span> tour
            {toursThisMonth !== 1 && "s"} this month
            {totalPlannedTours > 0 && (
              <span className="ml-2">
                · <span className="font-semibold">{totalPlannedTours}</span>{" "}
                total planned
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={goToPreviousMonth}
              variant="secondary"
              size="sm"
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={goToNextMonth}
              variant="secondary"
              size="sm"
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center font-semibold text-gray-700 bg-gray-100 border border-gray-200"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-50 border-2 border-blue-400 rounded"></div>
            <span className="font-medium">Heute</span>
          </div>
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-mountain-600" />
            <span className="font-medium">Geplante Tour</span>
          </div>
          <div className="text-xs text-gray-500">
            Farben repräsentieren verschiedene Aktivitäten
          </div>
        </div>
      </div>
    </div>
  );
}

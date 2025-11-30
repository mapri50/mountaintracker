"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tour } from "@prisma/client";
import { TourCalendar } from "@/components/tours/TourCalendar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SearchBar } from "@/components/ui/SearchBar";
import { searchTours } from "@/lib/utils";
import { Loader2, Calendar, X, MapPin, TrendingUp, Clock } from "lucide-react";

export default function CalendarPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTours, setSelectedTours] = useState<Tour[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableTours, setAvailableTours] = useState<Tour[]>([]);
  const [selectedTourToSchedule, setSelectedTourToSchedule] =
    useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTours();
    }
  }, [status]);

  const fetchTours = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tours");
      if (response.ok) {
        const data = await response.json();
        setTours(data);
        // Get tours that are not marked as irrelevant for scheduling
        setAvailableTours(data.filter((t: Tour) => !t.irrelevant));
      }
    } catch (error) {
      console.error("Error fetching tours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date, dayTours: Tour[]) => {
    setSelectedDate(date);
    setSelectedTours(dayTours);
    setShowDatePicker(true);
  };

  const handleScheduleTour = async (
    tourId: string,
    plannedDate: Date | null
  ) => {
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plannedDate: plannedDate?.toISOString() }),
      });

      if (response.ok) {
        // Refresh tours
        await fetchTours();
        setShowDatePicker(false);
        setSelectedDate(null);
        setSelectedTours([]);
        setSelectedTourToSchedule("");
      }
    } catch (error) {
      console.error("Error scheduling tour:", error);
    }
  };

  const handleUnscheduleTour = async (tourId: string) => {
    await handleScheduleTour(tourId, null);
  };

  const handleTourClick = (tour: Tour) => {
    router.push(`/tours/${tour.id}`);
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const unscheduledTours = availableTours.filter((t) => !t.plannedDate);
  const scheduledTours = tours.filter((t) => t.plannedDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-mountain-900 mb-2">
          Tour Calendar
        </h1>
        <p className="text-mountain-600">
          Plan and schedule your mountain adventures
        </p>
      </div>

      {/* Calendar */}
      <TourCalendar
        tours={tours}
        onDateClick={handleDateClick}
        onTourClick={handleTourClick}
      />

      {/* Unscheduled Tours */}
      {unscheduledTours.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-mountain-900 mb-4">
            Unscheduled Tours ({unscheduledTours.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unscheduledTours.map((tour) => (
              <div
                key={tour.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedTourToSchedule(tour.id);
                  setShowDatePicker(true);
                }}
              >
                <h3 className="font-semibold text-mountain-900 mb-2 truncate">
                  {tour.name}
                </h3>
                {tour.location && (
                  <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" />
                    {tour.location}
                  </p>
                )}
                <div className="flex gap-2 text-xs text-gray-500 mt-2">
                  {tour.elevation && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {tour.elevation}m
                    </span>
                  )}
                  {tour.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(tour.duration / 60)}h
                    </span>
                  )}
                </div>
                <Button
                  className="w-full mt-3"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTourToSchedule(tour.id);
                    setShowDatePicker(true);
                  }}
                >
                  Schedule Tour
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-mountain-900">
                {selectedDate
                  ? `Schedule for ${selectedDate.toLocaleDateString()}`
                  : "Select a Date"}
              </h3>
              <button
                onClick={() => {
                  setShowDatePicker(false);
                  setSelectedDate(null);
                  setSelectedTours([]);
                  setSelectedTourToSchedule("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Show tours already scheduled for this date */}
            {selectedTours.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  Already scheduled:
                </h4>
                <div className="space-y-2">
                  {selectedTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm">{tour.name}</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUnscheduleTour(tour.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date picker and tour selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <Input
                  type="date"
                  value={
                    selectedDate
                      ? selectedDate.toISOString().split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tour
                </label>
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search tours..."
                  className="mb-3"
                />
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                  {searchTours(availableTours, searchQuery).map((tour) => (
                    <div
                      key={tour.id}
                      onClick={() => setSelectedTourToSchedule(tour.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-b-0 transition-colors ${
                        selectedTourToSchedule === tour.id
                          ? "bg-mountain-50 border-l-4 border-l-mountain-500"
                          : ""
                      }`}
                    >
                      <div className="font-medium text-sm text-mountain-900">
                        {tour.name}
                      </div>
                      {tour.location && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {tour.location}
                        </div>
                      )}
                      {tour.plannedDate && (
                        <div className="text-xs text-orange-600 mt-1">
                          Currently scheduled for{" "}
                          {new Date(tour.plannedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                  {searchTours(availableTours, searchQuery).length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No tours found
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!selectedDate || !selectedTourToSchedule}
                onClick={() => {
                  if (selectedDate && selectedTourToSchedule) {
                    handleScheduleTour(selectedTourToSchedule, selectedDate);
                  }
                }}
              >
                Schedule Tour
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

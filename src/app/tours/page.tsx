"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tour, Condition, Activity } from "@prisma/client";
import { TourCard } from "@/components/tours/TourCard";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { CONDITION_LABELS, ACTIVITY_LABELS } from "@/lib/constants";
import { searchTours } from "@/lib/utils";
import { Filter, Loader2, EyeOff } from "lucide-react";

export default function ToursPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");
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
      const response = await fetch(`/api/tours`);
      if (response.ok) {
        const data = await response.json();
        setTours(data);
      }
    } catch (error) {
      console.error("Error fetching tours:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIrrelevantToggle = (tourId: string, irrelevant: boolean) => {
    setTours((prevTours) =>
      prevTours.map((tour) =>
        tour.id === tourId ? { ...tour, irrelevant } : tour
      )
    );
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const conditionOptions = [
    { value: "all", label: "All Conditions" },
    ...Object.entries(CONDITION_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const activityOptions = [
    { value: "all", label: "All Activities" },
    ...Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  // Apply search and filters
  const filteredTours = useMemo(() => {
    let filtered = tours;

    // Apply condition filter
    if (conditionFilter !== "all") {
      filtered = filtered.filter((tour) =>
        tour.conditions.includes(conditionFilter as Condition)
      );
    }

    // Apply activity filter
    if (activityFilter !== "all") {
      filtered = filtered.filter(
        (tour) => tour.activity === (activityFilter as Activity)
      );
    }

    // Apply search
    filtered = searchTours(filtered, searchQuery);

    return filtered;
  }, [tours, conditionFilter, activityFilter, searchQuery]);

  const relevantTours = filteredTours.filter((tour) => !tour.irrelevant);
  const irrelevantTours = filteredTours.filter((tour) => tour.irrelevant);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-mountain-900 mb-2">My Tours</h1>
        <p className="text-mountain-600">
          {filteredTours.length} {filteredTours.length === 1 ? "tour" : "tours"}{" "}
          found
          {filteredTours.length !== tours.length &&
            ` (filtered from ${tours.length} total)`}
          {irrelevantTours.length > 0 &&
            ` (${irrelevantTours.length} marked as irrelevant)`}
        </p>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-mountain-600" />
          <h2 className="text-lg font-semibold text-mountain-800">
            Search & Filters
          </h2>
        </div>
        <div className="mb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tours by name, location, activity, conditions..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            options={conditionOptions}
          />
          <Select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            options={activityOptions}
          />
        </div>
        {(conditionFilter !== "all" ||
          activityFilter !== "all" ||
          searchQuery !== "") && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConditionFilter("all");
                setActivityFilter("all");
                setSearchQuery("");
              }}
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : tours.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-mountain-600 mb-4">No tours found</p>
          <Button onClick={() => router.push("/tours/new")}>
            Create Your First Tour
          </Button>
        </div>
      ) : (
        <>
          {relevantTours.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relevantTours.map((tour: any) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  ascentCount={tour.ascentCount || 0}
                  onIrrelevantToggle={handleIrrelevantToggle}
                />
              ))}
            </div>
          )}

          {irrelevantTours.length > 0 && (
            <>
              <div className="mt-16 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 py-2 text-sm font-medium text-gray-500 rounded-md border border-gray-300">
                      <EyeOff className="w-4 h-4 inline-block mr-2" />
                      Irrelevant Tours
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {irrelevantTours.map((tour: any) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    ascentCount={tour.ascentCount || 0}
                    onIrrelevantToggle={handleIrrelevantToggle}
                  />
                ))}
              </div>
            </>
          )}

          {relevantTours.length === 0 && irrelevantTours.length > 0 && (
            <div className="text-center py-8 mb-8">
              <p className="text-lg text-mountain-600">
                All tours are marked as irrelevant
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

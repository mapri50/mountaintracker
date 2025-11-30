import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Tour } from "@prisma/client";
import { CONDITION_LABELS, ACTIVITY_LABELS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

export function formatElevation(meters: number): string {
  return `${meters} m`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Performs a full-text search across all tour properties
 * Searches: name, description, location, notes, sourceUrl, difficulty, grade,
 * and translates activity/condition enums to their labels
 */
export function searchTours(tours: Tour[], searchQuery: string): Tour[] {
  if (!searchQuery.trim()) {
    return tours;
  }

  const query = searchQuery.toLowerCase().trim();

  return tours.filter((tour) => {
    // Search in text fields
    const searchableText = [
      tour.name,
      tour.description,
      tour.location,
      tour.notes,
      tour.sourceUrl,
      tour.difficulty,
      tour.grade,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Search in activity label
    const activityLabel = ACTIVITY_LABELS[tour.activity]?.toLowerCase() || "";

    // Search in condition labels
    const conditionLabels = tour.conditions
      .map((c) => CONDITION_LABELS[c]?.toLowerCase() || "")
      .join(" ");

    // Search in numeric fields (converted to strings)
    const numericText = [
      tour.elevation?.toString(),
      tour.distance?.toString(),
      tour.duration?.toString(),
    ]
      .filter(Boolean)
      .join(" ");

    // Combine all searchable content
    const allContent = `${searchableText} ${activityLabel} ${conditionLabels} ${numericText}`;

    return allContent.includes(query);
  });
}

import { Tour } from "@prisma/client";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";
import {
  CONDITION_LABELS,
  ACTIVITY_LABELS,
  CONDITION_COLORS,
  ACTIVITY_COLORS,
  CONDITION_STYLES,
  ACTIVITY_STYLES,
} from "@/lib/constants";
import {
  formatDistance,
  formatElevation,
  formatDuration,
  cn,
} from "@/lib/utils";
import {
  Mountain,
  MapPin,
  Clock,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TourCardProps {
  tour: Tour;
  ascentCount?: number;
}

export function TourCard({ tour, ascentCount = 0 }: TourCardProps) {
  return (
    <Link href={`/tours/${tour.id}`} className="block no-underline">
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        {tour.imageUrl && (
          <div className="relative h-48 w-full">
            <Image
              src={tour.imageUrl}
              alt={tour.name}
              fill
              className="object-cover"
            />
            {ascentCount > 0 && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full px-3 py-1 text-sm font-medium">
                {ascentCount} {ascentCount === 1 ? "ascent" : "ascents"}
              </div>
            )}
          </div>
        )}

        <CardContent className="flex-1 flex flex-col gap-3 pt-4">
          <div>
            <h3 className="text-xl font-bold text-mountain-900 mb-2 line-clamp-2">
              {tour.name}
            </h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {tour.conditions.map((condition) => (
                <span
                  key={condition}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium border",
                    CONDITION_COLORS[condition]
                  )}
                  style={CONDITION_STYLES[condition]}
                >
                  {CONDITION_LABELS[condition]}
                </span>
              ))}
              <span
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium border",
                  ACTIVITY_COLORS[tour.activity]
                )}
                style={ACTIVITY_STYLES[tour.activity]}
              >
                {ACTIVITY_LABELS[tour.activity]}
              </span>
            </div>
          </div>

          {tour.location && (
            <div className="flex items-center gap-2 text-sm text-mountain-600">
              <MapPin className="w-4 h-4" />
              <span>{tour.location}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm text-mountain-600">
            {tour.elevation && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{formatElevation(tour.elevation)}</span>
              </div>
            )}

            {tour.distance && (
              <div className="flex items-center gap-1">
                <Mountain className="w-4 h-4" />
                <span>{formatDistance(tour.distance)}</span>
              </div>
            )}

            {tour.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(tour.duration)}</span>
              </div>
            )}

            {tour.difficulty && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Difficulty:</span>
                <span>{tour.difficulty}</span>
              </div>
            )}
          </div>

          {tour.description && (
            <p className="text-sm text-mountain-600 line-clamp-3">
              {tour.description}
            </p>
          )}
        </CardContent>

        {tour.grade && (
          <CardFooter>
            <span className="text-sm font-medium text-mountain-700">
              Grade: {tour.grade}
            </span>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}

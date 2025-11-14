"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tour } from "@prisma/client";
import { TourForm } from "@/components/tours/TourForm";
import { TourFormData } from "@/lib/validations";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
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
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  Calendar,
} from "lucide-react";
import Image from "next/image";

type Ascent = {
  id: string;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function TourDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { status } = useSession();
  const [tour, setTour] = useState<Tour | null>(null);
  const [ascents, setAscents] = useState<Ascent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAscentForm, setShowAscentForm] = useState(false);
  const [ascentDate, setAscentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [ascentNotes, setAscentNotes] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchTour();
      fetchAscents();
    }
  }, [status, params.id]);

  const fetchTour = async () => {
    try {
      const response = await fetch(`/api/tours/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTour(data);
      } else {
        router.push("/tours");
      }
    } catch (error) {
      console.error("Error fetching tour:", error);
      router.push("/tours");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAscents = async () => {
    try {
      const response = await fetch(`/api/tours/${params.id}/ascents`);
      if (response.ok) {
        const data = await response.json();
        setAscents(data);
      }
    } catch (error) {
      console.error("Error fetching ascents:", error);
    }
  };

  const handleUpdate = async (data: TourFormData) => {
    try {
      const response = await fetch(`/api/tours/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update tour");
      }

      const updatedTour = await response.json();
      setTour(updatedTour);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating tour:", error);
      alert("Failed to update tour. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this tour?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tours/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tour");
      }

      router.push("/tours");
      router.refresh();
    } catch (error) {
      console.error("Error deleting tour:", error);
      alert("Failed to delete tour. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleToggleCompleted = async () => {
    setShowAscentForm(!showAscentForm);
  };

  const handleAddAscent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/tours/${params.id}/ascents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: new Date(ascentDate).toISOString(),
          notes: ascentNotes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add ascent");
      }

      await fetchAscents();
      setShowAscentForm(false);
      setAscentDate(new Date().toISOString().split("T")[0]);
      setAscentNotes("");
    } catch (error) {
      console.error("Error adding ascent:", error);
      alert("Failed to add ascent. Please try again.");
    }
  };

  const handleDeleteAscent = async (ascentId: string) => {
    if (!confirm("Are you sure you want to delete this ascent?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tours/${params.id}/ascents/${ascentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete ascent");
      }

      await fetchAscents();
    } catch (error) {
      console.error("Error deleting ascent:", error);
      alert("Failed to delete ascent. Please try again.");
    }
  };

  if (isLoading || !tour) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-mountain-900 mb-8">Edit Tour</h1>
        <Card>
          <CardContent className="pt-6">
            <TourForm
              initialData={tour}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        {tour.imageUrl && (
          <div className="relative h-96 w-full">
            <Image
              src={tour.imageUrl}
              alt={tour.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-mountain-900 mb-3">
                {tour.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {tour.conditions.map((condition) => (
                  <span
                    key={condition}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm font-medium border",
                      CONDITION_COLORS[condition]
                    )}
                    style={CONDITION_STYLES[condition]}
                  >
                    {CONDITION_LABELS[condition]}
                  </span>
                ))}
                <span
                  className={cn(
                    "px-3 py-1 rounded-md text-sm font-medium border",
                    ACTIVITY_COLORS[tour.activity]
                  )}
                  style={ACTIVITY_STYLES[tour.activity]}
                >
                  {ACTIVITY_LABELS[tour.activity]}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleToggleCompleted}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Ascent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {tour.location && (
            <div className="flex items-center gap-2 text-mountain-700">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{tour.location}</span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tour.elevation && (
              <div className="bg-mountain-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-mountain-600 mb-1">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Elevation</span>
                </div>
                <p className="text-xl font-bold text-mountain-900">
                  {formatElevation(tour.elevation)}
                </p>
              </div>
            )}

            {tour.distance && (
              <div className="bg-mountain-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-mountain-600 mb-1">
                  <Mountain className="w-5 h-5" />
                  <span className="text-sm font-medium">Distance</span>
                </div>
                <p className="text-xl font-bold text-mountain-900">
                  {formatDistance(tour.distance)}
                </p>
              </div>
            )}

            {tour.duration && (
              <div className="bg-mountain-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-mountain-600 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="text-xl font-bold text-mountain-900">
                  {formatDuration(tour.duration)}
                </p>
              </div>
            )}

            {tour.grade && (
              <div className="bg-mountain-50 p-4 rounded-lg">
                <div className="text-mountain-600 mb-1">
                  <span className="text-sm font-medium">Grade</span>
                </div>
                <p className="text-xl font-bold text-mountain-900">
                  {tour.grade}
                </p>
              </div>
            )}
          </div>

          {tour.difficulty && (
            <div>
              <h3 className="text-lg font-semibold text-mountain-800 mb-2">
                Difficulty
              </h3>
              <p className="text-mountain-700">{tour.difficulty}</p>
            </div>
          )}

          {tour.description && (
            <div>
              <h3 className="text-lg font-semibold text-mountain-800 mb-2">
                Description
              </h3>
              <p className="text-mountain-700 whitespace-pre-wrap">
                {tour.description}
              </p>
            </div>
          )}

          {tour.notes && (
            <div>
              <h3 className="text-lg font-semibold text-mountain-800 mb-2">
                Notes
              </h3>
              <p className="text-mountain-700 whitespace-pre-wrap">
                {tour.notes}
              </p>
            </div>
          )}

          {tour.sourceUrl && (
            <div>
              <a
                href={tour.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                View Original Source
              </a>
            </div>
          )}

          {showAscentForm && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-mountain-800 mb-4">
                Add New Ascent
              </h3>
              <form onSubmit={handleAddAscent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-mountain-700 mb-1">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={ascentDate}
                    onChange={(e) => setAscentDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-mountain-700 mb-1">
                    Notes (optional)
                  </label>
                  <Textarea
                    value={ascentNotes}
                    onChange={(e) => setAscentNotes(e.target.value)}
                    placeholder="How was the tour? Weather, conditions, etc."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" size="sm">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Save Ascent
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAscentForm(false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {ascents.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-mountain-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Ascents ({ascents.length})
              </h3>
              <div className="space-y-3">
                {ascents.map((ascent) => (
                  <div
                    key={ascent.id}
                    className="bg-mountain-50 p-4 rounded-lg flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-green-600 font-medium mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {new Date(ascent.date).toLocaleDateString("de-DE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      {ascent.notes && (
                        <p className="text-sm text-mountain-600 whitespace-pre-wrap mt-2">
                          {ascent.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAscent(ascent.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  CheckCircle2,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

export interface AscentFormData {
  date: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  partners?: string[];
  conditions?: string;
  weather?: string;
}

interface AscentFormProps {
  tourId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AscentForm({ tourId, onSuccess, onCancel }: AscentFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [partnerInput, setPartnerInput] = useState("");
  const [partners, setPartners] = useState<string[]>([]);
  const [conditions, setConditions] = useState("");
  const [weather, setWeather] = useState("");
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPartner = () => {
    if (partnerInput.trim() && !partners.includes(partnerInput.trim())) {
      setPartners([...partners, partnerInput.trim()]);
      setPartnerInput("");
    }
  };

  const handleRemovePartner = (partner: string) => {
    setPartners(partners.filter((p) => p !== partner));
  };

  const handleGpxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGpxFile(e.target.files[0]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create ascent
      const ascentData: any = {
        date: new Date(date).toISOString(),
        notes: notes || undefined,
        partners: partners.length > 0 ? partners : undefined,
        conditions: conditions || undefined,
        weather: weather || undefined,
      };

      if (startTime) {
        ascentData.startTime = new Date(`${date}T${startTime}`).toISOString();
      }
      if (endTime) {
        ascentData.endTime = new Date(`${date}T${endTime}`).toISOString();
      }

      const response = await fetch(`/api/tours/${tourId}/ascents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ascentData),
      });

      if (!response.ok) {
        throw new Error("Failed to create ascent");
      }

      const ascent = await response.json();

      // Upload GPX file if provided
      if (gpxFile) {
        const gpxFormData = new FormData();
        gpxFormData.append("gpx", gpxFile);

        const gpxResponse = await fetch(
          `/api/tours/${tourId}/ascents/${ascent.id}/gpx`,
          {
            method: "POST",
            body: gpxFormData,
          }
        );

        if (!gpxResponse.ok) {
          console.error("Failed to upload GPX file");
        }
      }

      // Upload photos if provided
      if (photoFiles.length > 0) {
        const photoFormData = new FormData();
        photoFiles.forEach((file) => {
          photoFormData.append("photos", file);
        });

        const photoResponse = await fetch(
          `/api/tours/${tourId}/ascents/${ascent.id}/photos`,
          {
            method: "POST",
            body: photoFormData,
          }
        );

        if (!photoResponse.ok) {
          console.error("Failed to upload photos");
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error creating ascent:", error);
      alert("Failed to create ascent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-mountain-700 mb-1">
            Date *
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-mountain-700 mb-1">
              Start Time
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-mountain-700 mb-1">
              End Time
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        {startTime && endTime && (
          <div className="text-sm text-mountain-600 mt-2">
            Duration:{" "}
            {(() => {
              const start = new Date(`2000-01-01T${startTime}`);
              const end = new Date(`2000-01-01T${endTime}`);
              const minutes = Math.round(
                (end.getTime() - start.getTime()) / 60000
              );
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              return minutes > 0
                ? `${hours}h ${mins}m (${minutes} minutes)`
                : "Invalid time range";
            })()}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-mountain-700 mb-1">
          Partners
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={partnerInput}
            onChange={(e) => setPartnerInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPartner();
              }
            }}
            placeholder="Add partner name"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddPartner}
          >
            Add
          </Button>
        </div>
        {partners.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {partners.map((partner) => (
              <span
                key={partner}
                className="inline-flex items-center gap-1 px-3 py-1 bg-mountain-100 text-mountain-700 rounded-full text-sm"
              >
                {partner}
                <button
                  type="button"
                  onClick={() => handleRemovePartner(partner)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-mountain-700 mb-1">
            Weather
          </label>
          <Input
            type="text"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            placeholder="e.g., Sunny, 15°C"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mountain-700 mb-1">
            Route Conditions
          </label>
          <Input
            type="text"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="e.g., Good snow, icy sections"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-mountain-700 mb-1">
          Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was the tour? Any highlights or challenges?"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-mountain-700 mb-2">
          <Upload className="w-4 h-4 inline mr-1" />
          GPX/TCX Track File
        </label>
        <Input
          type="file"
          accept=".gpx,.tcx"
          onChange={handleGpxChange}
          className="cursor-pointer"
        />
        {gpxFile && (
          <p className="text-sm text-mountain-600 mt-1">
            Selected: {gpxFile.name}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-mountain-700 mb-2">
          <ImageIcon className="w-4 h-4 inline mr-1" />
          Photos
        </label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
          className="cursor-pointer"
        />
        {photoFiles.length > 0 && (
          <p className="text-sm text-mountain-600 mt-1">
            {photoFiles.length} photo(s) selected
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Save Ascent
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tourSchema, TourFormData } from "@/lib/validations";
import { CONDITION_LABELS, ACTIVITY_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Condition, Activity, Tour } from "@prisma/client";

interface TourFormProps {
  initialData?: Tour | Partial<TourFormData> | null;
  onSubmit: (data: TourFormData) => Promise<void>;
  onCancel?: () => void;
}

export function TourForm({ initialData, onSubmit, onCancel }: TourFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          description: initialData.description ?? undefined,
          sourceUrl: initialData.sourceUrl ?? undefined,
          location: initialData.location ?? undefined,
          elevation: initialData.elevation ?? undefined,
          distance: initialData.distance ?? undefined,
          duration: initialData.duration ?? undefined,
          difficulty: initialData.difficulty ?? undefined,
          grade: initialData.grade ?? undefined,
          imageUrl: initialData.imageUrl ?? undefined,
          notes: initialData.notes ?? undefined,
          plannedDate: initialData.plannedDate
            ? new Date(initialData.plannedDate).toISOString().split("T")[0]
            : undefined,
        }
      : {
          conditions: ["SOMMER"] as Condition[],
          activity: "BERGTOUR" as Activity,
        },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl ?? null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePreview?.startsWith("blob:")) return;

    return () => {
      URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData as any);
      setImagePreview(initialData.imageUrl ?? null);
    } else {
      setImagePreview(null);
    }
    setImageFile(null);
  }, [initialData, reset]);

  const onFormSubmit = async (data: TourFormData) => {
    setIsSubmitting(true);
    setUploadError(null);

    try {
      let imageUrl = data.imageUrl?.trim() || undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const uploadResponse = await fetch("/api/tours/upload-image", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json().catch(() => ({}));

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || "Failed to upload image");
        }

        imageUrl = uploadResult.url;
        setValue("imageUrl", imageUrl);
      }

      await onSubmit({ ...data, imageUrl });
    } catch (error: any) {
      console.error("Error saving tour:", error);
      setUploadError(error?.message || "Failed to save tour.");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(null);

    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(initialData?.imageUrl ?? null);
    }
  };

  const activityOptions = Object.entries(ACTIVITY_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Input
        label="Tour Name *"
        {...register("name")}
        error={errors.name?.message}
        placeholder="e.g., Großglockner Normalweg"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conditions * (select all that apply)
          </label>
          <Controller
            name="conditions"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={value}
                      checked={field.value?.includes(value as Condition)}
                      onChange={(e) => {
                        const currentValue = field.value || [];
                        if (e.target.checked) {
                          field.onChange([...currentValue, value as Condition]);
                        } else {
                          field.onChange(
                            currentValue.filter((v) => v !== value)
                          );
                        }
                      }}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.conditions && (
            <p className="mt-1 text-sm text-red-600">
              {errors.conditions.message}
            </p>
          )}
        </div>

        <Select
          label="Activity *"
          {...register("activity")}
          options={activityOptions}
          error={errors.activity?.message}
        />
      </div>

      <Input
        label="Location"
        {...register("location")}
        error={errors.location?.message}
        placeholder="e.g., Hohe Tauern, Austria"
      />

      <Textarea
        label="Description"
        {...register("description")}
        error={errors.description?.message}
        rows={4}
        placeholder="Describe the tour..."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Elevation (m)"
          type="number"
          {...register("elevation", { valueAsNumber: true })}
          error={errors.elevation?.message}
          placeholder="1200"
        />

        <Input
          label="Distance (m)"
          type="number"
          {...register("distance", { valueAsNumber: true })}
          error={errors.distance?.message}
          placeholder="8000"
        />

        <Input
          label="Duration (minutes)"
          type="number"
          {...register("duration", { valueAsNumber: true })}
          error={errors.duration?.message}
          placeholder="360"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Difficulty"
          {...register("difficulty")}
          error={errors.difficulty?.message}
          placeholder="e.g., Medium"
        />

        <Input
          label="Grade"
          {...register("grade")}
          error={errors.grade?.message}
          placeholder="e.g., III, 5.9, WS"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Image URL"
          {...register("imageUrl")}
          error={errors.imageUrl?.message}
          placeholder="https://..."
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            disabled={isSubmitting}
          />
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          {imagePreview && (
            <div className="relative h-32 w-full overflow-hidden rounded-md border border-gray-200">
              {/* Basic preview without Next/Image to support blob URLs */}
              <img
                src={imagePreview}
                alt="Tour preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <Input
        label="Source URL"
        {...register("sourceUrl")}
        error={errors.sourceUrl?.message}
        placeholder="https://www.bergsteigen.com/..."
      />

      <Textarea
        label="Notes"
        {...register("notes")}
        error={errors.notes?.message}
        rows={3}
        placeholder="Personal notes about this tour..."
      />

      <Input
        label="Planned Date"
        type="date"
        {...register("plannedDate")}
        error={errors.plannedDate?.message}
      />

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : initialData
            ? "Update Tour"
            : "Create Tour"}
        </Button>
      </div>
    </form>
  );
}

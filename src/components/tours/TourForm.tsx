"use client";

import { useState, useEffect } from "react";
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
        }
      : {
          conditions: ["SOMMER"] as Condition[],
          activity: "BERGTOUR" as Activity,
        },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData as any);
    }
  }, [initialData, reset]);

  const onFormSubmit = async (data: TourFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
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

      <Input
        label="Image URL"
        {...register("imageUrl")}
        error={errors.imageUrl?.message}
        placeholder="https://..."
      />

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

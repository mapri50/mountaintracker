import { z } from "zod";
import { Condition, Activity } from "@prisma/client";

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const tourSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  conditions: z
    .array(z.nativeEnum(Condition))
    .min(1, "At least one condition is required"),
  activity: z.nativeEnum(Activity),
  elevation: z
    .union([z.number().int().positive(), z.nan()])
    .optional()
    .transform((val) => (val && !isNaN(val) && val > 0 ? val : undefined)),
  distance: z
    .union([z.number().int().positive(), z.nan()])
    .optional()
    .transform((val) => (val && !isNaN(val) && val > 0 ? val : undefined)),
  duration: z
    .union([z.number().int().positive(), z.nan()])
    .optional()
    .transform((val) => (val && !isNaN(val) && val > 0 ? val : undefined)),
  difficulty: z.string().optional(),
  grade: z.string().optional(),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) =>
        !val || val === "" || isHttpUrl(val) || val.startsWith("/uploads/"),
      {
        message: "Use a valid URL or upload an image.",
      }
    )
    .transform((val) => (val === "" ? undefined : val)),
  notes: z.string().optional(),
  irrelevant: z.boolean().optional(),
  plannedDate: z.string().optional().or(z.literal("")),
});

export type TourFormData = z.infer<typeof tourSchema>;

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

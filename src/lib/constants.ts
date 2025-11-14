import { Condition, Activity } from "@prisma/client";

export const CONDITION_LABELS: Record<Condition, string> = {
  WINTER: "Winter",
  SOMMER: "Sommer",
  UEBERGANG: "Übergang",
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  SPORTKLETTERN: "Sportklettern",
  ALPINKLETTERN: "Alpinklettern",
  SPORTKLETTERSTEIG: "Sportklettersteig",
  HOCHTOUR: "Hochtour",
  EIS_MIXEDKLETTERN: "Eis/Mixedklettern",
  WANDERN: "Wandern",
  BERGTOUR: "Bergtour",
  SKITOUR: "Skitour",
  SKIHOCHTOUR: "Skihochtour",
};

export const CONDITION_COLORS: Record<Condition, string> = {
  WINTER: "text-white border-blue-200",
  SOMMER: "text-white border-green-200",
  UEBERGANG: "text-white border-yellow-200",
};

export const ACTIVITY_COLORS: Record<Activity, string> = {
  SPORTKLETTERN: "text-white border-orange-200",
  ALPINKLETTERN: "text-white border-red-200",
  SPORTKLETTERSTEIG: "text-white border-purple-200",
  HOCHTOUR: "text-white border-indigo-200",
  EIS_MIXEDKLETTERN: "text-white border-cyan-200",
  WANDERN: "text-white border-lime-200",
  BERGTOUR: "text-white border-emerald-200",
  SKITOUR: "text-white border-sky-200",
  SKIHOCHTOUR: "text-white border-violet-200",
};

export const CONDITION_STYLES: Record<Condition, { backgroundColor: string }> =
  {
    WINTER: { backgroundColor: "#3b82f6" },
    SOMMER: { backgroundColor: "#22c55e" },
    UEBERGANG: { backgroundColor: "#eab308" },
  };

export const ACTIVITY_STYLES: Record<Activity, { backgroundColor: string }> = {
  SPORTKLETTERN: { backgroundColor: "#f97316" },
  ALPINKLETTERN: { backgroundColor: "#ef4444" },
  SPORTKLETTERSTEIG: { backgroundColor: "#a855f7" },
  HOCHTOUR: { backgroundColor: "#6366f1" },
  EIS_MIXEDKLETTERN: { backgroundColor: "#06b6d4" },
  WANDERN: { backgroundColor: "#84cc16" },
  BERGTOUR: { backgroundColor: "#10b981" },
  SKITOUR: { backgroundColor: "#0ea5e9" },
  SKIHOCHTOUR: { backgroundColor: "#8b5cf6" },
};

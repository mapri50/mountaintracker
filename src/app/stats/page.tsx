"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  TrendingUp,
  Mountain,
  Clock,
  Target,
  Award,
  Calendar,
  Download,
  Upload,
  Loader2,
  Activity,
} from "lucide-react";
import { formatElevation, formatDistance, formatDuration } from "@/lib/utils";
import { ACTIVITY_LABELS } from "@/lib/constants";

interface UserStats {
  totalAscents: number;
  totalElevationGain: number;
  totalDistance: number;
  totalDuration: number;
  currentStreak: number;
  longestStreak: number;
  lastAscentDate: string | null;
  yearlyAscentGoal: number | null;
  yearlyElevationGoal: number | null;
  monthlyAscentGoal: number | null;
}

interface StatsData {
  stats: UserStats;
  recentAscents: any[];
  monthly: {
    ascents: number;
    elevationGain: number;
    goal: number | null;
  };
  yearly: {
    ascents: number;
    elevationGain: number;
    ascentGoal: number | null;
    elevationGoal: number | null;
  };
  activityBreakdown: Record<string, number>;
}

export default function StatsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [yearlyAscentGoal, setYearlyAscentGoal] = useState("");
  const [yearlyElevationGoal, setYearlyElevationGoal] = useState("");
  const [monthlyAscentGoal, setMonthlyAscentGoal] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const statsData = await response.json();
        setData(statsData);
        setYearlyAscentGoal(statsData.stats.yearlyAscentGoal?.toString() || "");
        setYearlyElevationGoal(
          statsData.stats.yearlyElevationGoal?.toString() || ""
        );
        setMonthlyAscentGoal(
          statsData.stats.monthlyAscentGoal?.toString() || ""
        );
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    try {
      const response = await fetch("/api/stats", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          yearlyAscentGoal: yearlyAscentGoal
            ? parseInt(yearlyAscentGoal)
            : undefined,
          yearlyElevationGoal: yearlyElevationGoal
            ? parseFloat(yearlyElevationGoal)
            : undefined,
          monthlyAscentGoal: monthlyAscentGoal
            ? parseInt(monthlyAscentGoal)
            : undefined,
        }),
      });

      if (response.ok) {
        await fetchStats();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating goals:", error);
      alert("Failed to update goals. Please try again.");
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const response = await fetch("/api/stats/recalculate", {
        method: "POST",
      });

      if (response.ok) {
        await fetchStats();
        alert("Statistics recalculated successfully!");
      } else {
        throw new Error("Recalculation failed");
      }
    } catch (error) {
      console.error("Error recalculating stats:", error);
      alert("Failed to recalculate statistics. Please try again.");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      const response = await fetch(`/api/export?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mountaintracker-export.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    try {
      const content = await file.text();
      const data = JSON.parse(content);

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await fetchStats();
        router.push("/tours");
      } else {
        throw new Error("Import failed");
      }
    } catch (error) {
      console.error("Error importing data:", error);
      alert("Failed to import data. Please check the file format.");
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const monthlyProgress = data.monthly.goal
    ? (data.monthly.ascents / data.monthly.goal) * 100
    : 0;
  const yearlyAscentProgress = data.yearly.ascentGoal
    ? (data.yearly.ascents / data.yearly.ascentGoal) * 100
    : 0;
  const yearlyElevationProgress = data.yearly.elevationGoal
    ? (data.yearly.elevationGain / data.yearly.elevationGoal) * 100
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-mountain-900">Statistics</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRecalculate}
            disabled={isRecalculating}
          >
            {isRecalculating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Recalculating...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-1" />
                Recalculate Stats
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport("json")}
          >
            <Download className="w-4 h-4 mr-1" />
            Export JSON
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleExport("csv")}>
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
          <label>
            <span className="cursor-pointer">
              <Button variant="ghost" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                Import
              </Button>
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Lifetime Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Mountain className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-mountain-600">Total Ascents</p>
                <p className="text-3xl font-bold text-mountain-900">
                  {data.stats.totalAscents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-mountain-600">Total Elevation</p>
                <p className="text-3xl font-bold text-mountain-900">
                  {formatElevation(data.stats.totalElevationGain)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-mountain-600">Total Distance</p>
                <p className="text-3xl font-bold text-mountain-900">
                  {Math.round(data.stats.totalDistance)} km
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-mountain-600">Total Time</p>
                <p className="text-3xl font-bold text-mountain-900">
                  {Math.round(data.stats.totalDuration / 60)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold">Current Streak</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary-600 mb-2">
              {data.stats.currentStreak} weeks
            </p>
            <p className="text-sm text-mountain-600">
              One tour per week (Monday-Sunday)
            </p>
            {data.stats.lastAscentDate && (
              <p className="text-sm text-mountain-600 mt-1">
                Last ascent:{" "}
                {new Date(data.stats.lastAscentDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <h2 className="text-xl font-semibold">Longest Streak</h2>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-600">
              {data.stats.longestStreak} weeks
            </p>
            <p className="text-sm text-mountain-600">Your personal best</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold">Goals & Progress</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                isEditing ? handleSaveGoals() : setIsEditing(true)
              }
            >
              {isEditing ? "Save" : "Edit Goals"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Monthly Ascent Goal
                </label>
                <Input
                  type="number"
                  value={monthlyAscentGoal}
                  onChange={(e) => setMonthlyAscentGoal(e.target.value)}
                  placeholder="e.g., 4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Yearly Ascent Goal
                </label>
                <Input
                  type="number"
                  value={yearlyAscentGoal}
                  onChange={(e) => setYearlyAscentGoal(e.target.value)}
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Yearly Elevation Goal (m)
                </label>
                <Input
                  type="number"
                  value={yearlyElevationGoal}
                  onChange={(e) => setYearlyElevationGoal(e.target.value)}
                  placeholder="e.g., 10000"
                />
              </div>
            </div>
          ) : (
            <>
              {data.monthly.goal && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Monthly Ascents</span>
                    <span className="text-sm text-mountain-600">
                      {data.monthly.ascents} / {data.monthly.goal}
                    </span>
                  </div>
                  <div className="w-full bg-mountain-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {data.yearly.ascentGoal && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Yearly Ascents</span>
                    <span className="text-sm text-mountain-600">
                      {data.yearly.ascents} / {data.yearly.ascentGoal}
                    </span>
                  </div>
                  <div className="w-full bg-mountain-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(yearlyAscentProgress, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {data.yearly.elevationGoal && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      Yearly Elevation
                    </span>
                    <span className="text-sm text-mountain-600">
                      {formatElevation(data.yearly.elevationGain)} /{" "}
                      {formatElevation(data.yearly.elevationGoal)}
                    </span>
                  </div>
                  <div className="w-full bg-mountain-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(yearlyElevationProgress, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {!data.monthly.goal &&
                !data.yearly.ascentGoal &&
                !data.yearly.elevationGoal && (
                  <p className="text-center text-mountain-600 py-4">
                    No goals set. Click &quot;Edit Goals&quot; to set your
                    goals.
                  </p>
                )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      {Object.keys(data.activityBreakdown).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold">Activity Breakdown</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(data.activityBreakdown).map(
                ([activity, count]) => (
                  <div key={activity} className="bg-mountain-50 p-4 rounded-lg">
                    <p className="text-sm text-mountain-600 mb-1">
                      {ACTIVITY_LABELS[
                        activity as keyof typeof ACTIVITY_LABELS
                      ] || activity}
                    </p>
                    <p className="text-2xl font-bold text-mountain-900">
                      {count}
                    </p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Ascents */}
      {data.recentAscents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold">Recent Ascents</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentAscents.map((ascent) => (
                <div
                  key={ascent.id}
                  className="flex justify-between items-center p-3 bg-mountain-50 rounded-lg hover:bg-mountain-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/tours/${ascent.tourId}`)}
                >
                  <div>
                    <p className="font-medium text-mountain-900">
                      {ascent.tour.name}
                    </p>
                    <p className="text-sm text-mountain-600">
                      {new Date(ascent.date).toLocaleDateString()} •{" "}
                      {(ascent.tour.activity &&
                        ACTIVITY_LABELS[
                          ascent.tour.activity as keyof typeof ACTIVITY_LABELS
                        ]) ||
                        ascent.tour.activity}
                    </p>
                  </div>
                  {ascent.elevationGain && (
                    <div className="text-right">
                      <p className="text-sm text-mountain-600">Elevation</p>
                      <p className="font-medium text-mountain-900">
                        {formatElevation(ascent.elevationGain)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

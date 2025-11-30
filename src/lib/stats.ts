import { prisma } from "@/lib/prisma";

/**
 * Get the Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday, go back 6 days, otherwise go to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Format date as YYYY-MM-DD in local timezone
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get the Sunday of the week for a given date
 */
function getWeekEnd(date: Date): Date {
  const monday = getWeekStart(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Update user statistics including weekly streaks
 */
export async function updateUserStats(userId: string) {
  // Get all ascents for this user, ordered by date descending
  const ascents = await prisma.ascent.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  if (ascents.length === 0) {
    // No ascents, reset stats
    await prisma.userStats.upsert({
      where: { userId },
      update: {
        totalAscents: 0,
        totalElevationGain: 0,
        totalDistance: 0,
        totalDuration: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastAscentDate: null,
      },
      create: {
        userId,
        totalAscents: 0,
        totalElevationGain: 0,
        totalDistance: 0,
        totalDuration: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastAscentDate: null,
      },
    });
    return;
  }

  // Calculate totals
  const totalAscents = ascents.length;
  const totalElevationGain = ascents.reduce(
    (sum, a) => sum + (a.elevationGain || 0),
    0
  );
  const totalDistance = ascents.reduce((sum, a) => sum + (a.distance || 0), 0);
  const totalDuration = ascents.reduce((sum, a) => sum + (a.duration || 0), 0);

  // Group ascents by week (Monday-Sunday)
  const weekMap = new Map<string, Date>();

  for (const ascent of ascents) {
    const ascentDate = new Date(ascent.date);
    const weekStart = getWeekStart(ascentDate);
    const weekKey = formatDateLocal(weekStart); // Use Monday's date as key in local timezone

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, ascentDate);
    }
  }

  // Sort weeks by date (newest first)
  const weeks = Array.from(weekMap.keys()).sort((a, b) => b.localeCompare(a));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  const currentWeekKey = formatDateLocal(currentWeekStart);

  // Calculate streaks
  let lastWeekKey: string | null = null;
  let currentStreakFromMostRecent = 0;

  for (const weekKey of weeks) {
    if (!lastWeekKey) {
      // First week
      tempStreak = 1;
      currentStreakFromMostRecent = 1;
      lastWeekKey = weekKey;
    } else {
      // Check if this week is consecutive to the last week
      // weekKeys are already Monday dates (week starts), compare them directly
      const lastWeekDate = new Date(lastWeekKey);
      const currentWeekDate = new Date(weekKey);
      // Since weeks are sorted newest first, currentWeek should be 1 week before lastWeek
      const diffMs = lastWeekDate.getTime() - currentWeekDate.getTime();
      const weeksDiff = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));

      if (weeksDiff === 1) {
        // Consecutive week
        tempStreak++;
        currentStreakFromMostRecent = tempStreak;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }

      lastWeekKey = weekKey;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  // Current streak is only valid if it includes current week or last week
  const mostRecentWeekKey = weeks[0];
  // Both are already week start dates (Mondays), compare them directly
  const diffMs =
    currentWeekStart.getTime() - new Date(mostRecentWeekKey).getTime();
  const weeksFromNow = Math.round(diffMs / (1000 * 60 * 60 * 24 * 7));

  if (weeksFromNow === 0) {
    // Ascent in current week
    currentStreak = currentStreakFromMostRecent;
  } else if (weeksFromNow === 1) {
    // Ascent in last week - streak continues if they do one this week
    currentStreak = currentStreakFromMostRecent;
  } else {
    // Streak broken
    currentStreak = 0;
  }

  // Upsert user stats
  await prisma.userStats.upsert({
    where: { userId },
    update: {
      totalAscents,
      totalElevationGain,
      totalDistance,
      totalDuration,
      currentStreak,
      longestStreak,
      lastAscentDate: ascents[0].date,
    },
    create: {
      userId,
      totalAscents,
      totalElevationGain,
      totalDistance,
      totalDuration,
      currentStreak,
      longestStreak,
      lastAscentDate: ascents[0].date,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statsUpdateSchema = z.object({
  yearlyAscentGoal: z.number().int().positive().optional(),
  yearlyElevationGoal: z.number().positive().optional(),
  monthlyAscentGoal: z.number().int().positive().optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user stats
    let stats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
    });

    if (!stats) {
      // Initialize stats if they don't exist
      stats = await prisma.userStats.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    // Get recent ascents for additional insights
    const ascents = await prisma.ascent.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 10,
      include: {
        tour: {
          select: {
            name: true,
            activity: true,
          },
        },
      },
    });

    // Calculate monthly stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyAscents = await prisma.ascent.count({
      where: {
        userId: session.user.id,
        date: {
          gte: firstDayOfMonth,
        },
      },
    });

    const monthlyElevation = await prisma.ascent.aggregate({
      where: {
        userId: session.user.id,
        date: {
          gte: firstDayOfMonth,
        },
      },
      _sum: {
        elevationGain: true,
      },
    });

    // Calculate yearly stats
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const yearlyAscents = await prisma.ascent.count({
      where: {
        userId: session.user.id,
        date: {
          gte: firstDayOfYear,
        },
      },
    });

    const yearlyElevation = await prisma.ascent.aggregate({
      where: {
        userId: session.user.id,
        date: {
          gte: firstDayOfYear,
        },
      },
      _sum: {
        elevationGain: true,
      },
    });

    // Get activity breakdown
    const activityBreakdown = await prisma.ascent.groupBy({
      by: ["tourId"],
      where: {
        userId: session.user.id,
      },
      _count: true,
    });

    const tourIds = activityBreakdown.map((a) => a.tourId);
    const tours = await prisma.tour.findMany({
      where: { id: { in: tourIds } },
      select: { id: true, activity: true },
    });

    const activityCounts: Record<string, number> = {};
    activityBreakdown.forEach((item) => {
      const tour = tours.find((t) => t.id === item.tourId);
      if (tour) {
        activityCounts[tour.activity] =
          (activityCounts[tour.activity] || 0) + item._count;
      }
    });

    return NextResponse.json({
      stats,
      recentAscents: ascents,
      monthly: {
        ascents: monthlyAscents,
        elevationGain: monthlyElevation._sum.elevationGain || 0,
        goal: stats.monthlyAscentGoal,
      },
      yearly: {
        ascents: yearlyAscents,
        elevationGain: yearlyElevation._sum.elevationGain || 0,
        ascentGoal: stats.yearlyAscentGoal,
        elevationGoal: stats.yearlyElevationGoal,
      },
      activityBreakdown: activityCounts,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = statsUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const stats = await prisma.userStats.upsert({
      where: { userId: session.user.id },
      update: validation.data,
      create: {
        userId: session.user.id,
        ...validation.data,
      },
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error updating stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

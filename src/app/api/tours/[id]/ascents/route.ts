import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { updateUserStats } from "@/lib/stats";

const ascentSchema = z.object({
  date: z.string().datetime(),
  notes: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  partners: z.array(z.string()).optional(),
  conditions: z.string().optional(),
  weather: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ascents = await prisma.ascent.findMany({
      where: {
        tourId: params.id,
        userId: session.user.id,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(ascents);
  } catch (error) {
    console.error("Error fetching ascents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = ascentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Verify tour exists and belongs to user
    const tour = await prisma.tour.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    //
    const start = validation.data.startTime
      ? new Date(validation.data.startTime)
      : null;
    const end = validation.data.endTime
      ? new Date(validation.data.endTime)
      : null;
    const duration =
      start && end
        ? Math.round((end.getTime() - start.getTime()) / 60000)
        : null;

    const ascent = await prisma.ascent.create({
      data: {
        date: new Date(validation.data.date),
        notes: validation.data.notes,
        startTime: start,
        endTime: end,
        partners: validation.data.partners || [],
        conditions: validation.data.conditions,
        weather: validation.data.weather,
        tourId: params.id,
        userId: session.user.id,
        elevationGain: tour.elevation,
        duration,
      },
      include: {
        photos: true,
        trackPoints: true,
      },
    });

    // Update user stats
    await updateUserStats(session.user.id);

    return NextResponse.json(ascent);
  } catch (error) {
    console.error("Error creating ascent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
